export type Production = {
  id: string;
  lhs: string;
  rhs: string[];
  raw: string;
};

export type Grammar = {
  start: string;
  nonTerminals: string[];
  terminals: string[];
  productions: Production[];
};

export type RdpNode = {
  id: number;
  symbol: string;
  kind: "nonterminal" | "terminal";
  status: "active" | "success" | "failed" | "backtrack" | "pending";
  children: RdpNode[];
  production?: string;
};

export type RdpEvent = {
  index: number;
  kind: "enter" | "try" | "match" | "fail" | "backtrack" | "return" | "accept" | "reject";
  message: string;
  stack: string[];
  input: string[];
  inputIndex: number;
  production?: Production;
  tree: RdpNode | null;
};

export type FirstStep = {
  id: number;
  target: string;
  sequence: string;
  additions: string[];
  reason: string;
};

export type FollowStep = {
  id: number;
  target: string;
  source: string;
  additions: string[];
  reason: string;
};

export type TablePlacement = {
  id: number;
  production: Production;
  cell: string;
  lookahead: string;
  source: "FIRST" | "FOLLOW";
  reason: string;
  conflict: boolean;
};

export type Ll1TraceStep = {
  id: number;
  stack: string;
  input: string;
  action: string;
  type: "expand" | "match" | "error" | "accept" | "start";
};

export function normalizeSymbol(symbol: string) {
  return symbol.trim().replace(/^['"]|['"]$/g, "");
}

export function tokenizeInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return [];
  return trimmed.split(/\s+/).map(normalizeSymbol).filter(Boolean);
}

export function parseGrammar(text: string): Grammar {
  const productions: Production[] = [];
  const lhsOrder: string[] = [];
  let productionIndex = 0;
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  if (!lines.length) throw new Error("Enter at least one grammar rule.");

  for (const line of lines) {
    const match = line.match(/^(.+?)\s*(?:->|::=)\s*(.+)$/);
    if (!match) throw new Error(`Could not read “${line}”. Use: E -> T E' | ε`);
    const lhs = normalizeSymbol(match[1]);
    if (!lhs) throw new Error("Every rule needs a non-terminal on the left.");
    if (!lhsOrder.includes(lhs)) lhsOrder.push(lhs);
    const alternatives = match[2].split("|");
    alternatives.forEach((alternative) => {
      const cleaned = alternative.trim();
      const epsilon = !cleaned || /^(ε|ϵ|epsilon|eps)$/i.test(cleaned);
      const rhs = epsilon ? [] : cleaned.split(/\s+/).map(normalizeSymbol).filter(Boolean);
      productions.push({
        id: `P${++productionIndex}`,
        lhs,
        rhs,
        raw: `${lhs} → ${rhs.length ? rhs.join(" ") : "ε"}`,
      });
    });
  }

  const nonTerminals = [...lhsOrder];
  const terminalSet = new Set<string>();
  productions.forEach((production) => {
    production.rhs.forEach((symbol) => {
      if (!nonTerminals.includes(symbol)) terminalSet.add(symbol);
    });
  });
  return { start: nonTerminals[0], nonTerminals, terminals: [...terminalSet], productions };
}

export function formatSequence(sequence: string[]) {
  return sequence.length ? sequence.join(" ") : "ε";
}

function firstOfSequence(sequence: string[], grammar: Grammar, first: Record<string, Set<string>>) {
  const result = new Set<string>();
  if (!sequence.length) {
    result.add("ε");
    return result;
  }
  let nullable = true;
  for (const symbol of sequence) {
    if (!grammar.nonTerminals.includes(symbol)) {
      result.add(symbol);
      nullable = false;
      break;
    }
    const values = first[symbol] ?? new Set<string>();
    values.forEach((value) => value !== "ε" && result.add(value));
    if (!values.has("ε")) {
      nullable = false;
      break;
    }
  }
  if (nullable) result.add("ε");
  return result;
}

export function computeFirst(grammar: Grammar) {
  const sets: Record<string, Set<string>> = {};
  grammar.nonTerminals.forEach((symbol) => (sets[symbol] = new Set<string>()));
  const steps: FirstStep[] = [];
  let changed = true;
  let guard = 0;

  while (changed && guard++ < 100) {
    changed = false;
    grammar.productions.forEach((production) => {
      const before = new Set(sets[production.lhs]);
      const derived = firstOfSequence(production.rhs, grammar, sets);
      derived.forEach((value) => sets[production.lhs].add(value));
      const additions = [...sets[production.lhs]].filter((value) => !before.has(value));
      if (additions.length) {
        changed = true;
        const source = production.rhs.length ? formatSequence(production.rhs) : "ε";
        const reason = additions.includes("ε")
          ? `${production.lhs} can derive ε through ${source}.`
          : `From FIRST(${source}), add ${additions.join(", ")} to FIRST(${production.lhs}).`;
        steps.push({ id: steps.length + 1, target: production.lhs, sequence: source, additions, reason });
      }
    });
  }
  return { sets, steps };
}

export function computeFollow(grammar: Grammar, first: Record<string, Set<string>>) {
  const sets: Record<string, Set<string>> = {};
  grammar.nonTerminals.forEach((symbol) => (sets[symbol] = new Set<string>()));
  sets[grammar.start].add("$");
  const steps: FollowStep[] = [{
    id: 1,
    target: grammar.start,
    source: "START",
    additions: ["$"],
    reason: `The start symbol ${grammar.start} receives the end-marker $ by definition.`,
  }];
  let changed = true;
  let guard = 0;

  while (changed && guard++ < 100) {
    changed = false;
    grammar.productions.forEach((production) => {
      production.rhs.forEach((symbol, index) => {
        if (!grammar.nonTerminals.includes(symbol)) return;
        const suffix = production.rhs.slice(index + 1);
        const derived = firstOfSequence(suffix, grammar, first);
        const before = new Set(sets[symbol]);
        derived.forEach((value) => value !== "ε" && sets[symbol].add(value));
        if (!suffix.length || derived.has("ε")) {
          sets[production.lhs].forEach((value) => sets[symbol].add(value));
        }
        const additions = [...sets[symbol]].filter((value) => !before.has(value));
        if (additions.length) {
          changed = true;
          const source = suffix.length ? formatSequence(suffix) : "ε";
          const reason = derived.has("ε") || !suffix.length
            ? `Because ${symbol} is at the end (or the suffix is nullable), inherit FOLLOW(${production.lhs}).`
            : `Add FIRST(${source}) without ε to FOLLOW(${symbol}).`;
          steps.push({ id: steps.length + 1, target: symbol, source: production.lhs, additions, reason });
        }
      });
    });
  }
  return { sets, steps };
}

export function firstOfProduction(production: Production, grammar: Grammar, first: Record<string, Set<string>>) {
  return firstOfSequence(production.rhs, grammar, first);
}

export function buildParseTable(
  grammar: Grammar,
  first: Record<string, Set<string>>,
  follow: Record<string, Set<string>>,
) {
  const table: Record<string, Production[]> = {};
  const steps: TablePlacement[] = [];
  const addPlacement = (production: Production, lookahead: string, source: "FIRST" | "FOLLOW", reason: string) => {
    const cell = `${production.lhs}|${lookahead}`;
    const existing = table[cell] ?? [];
    const conflict = existing.length > 0 && !existing.some((item) => item.id === production.id);
    table[cell] = [...existing, production];
    steps.push({ id: steps.length + 1, production, cell, lookahead, source, reason, conflict });
  };

  grammar.productions.forEach((production) => {
    const derived = firstOfProduction(production, grammar, first);
    derived.forEach((lookahead) => {
      if (lookahead !== "ε") {
        addPlacement(
          production,
          lookahead,
          "FIRST",
          `ε is not needed: ${lookahead} is in FIRST(${formatSequence(production.rhs)}).`,
        );
      }
    });
    if (derived.has("ε")) {
      follow[production.lhs]?.forEach((lookahead) => {
        addPlacement(
          production,
          lookahead,
          "FOLLOW",
          `The rule derives ε, so place it for every symbol in FOLLOW(${production.lhs}).`,
        );
      });
    }
  });

  const conflicts = Object.entries(table).filter(([, values]) => values.length > 1).map(([cell, values]) => ({ cell, values }));
  return { table, steps, conflicts };
}

export function parseLL1(grammar: Grammar, table: Record<string, Production[]>, inputText: string) {
  const input = [...tokenizeInput(inputText), "$"].filter((value, index, arr) => !(value === "$" && index < arr.length - 1));
  const stack = ["$", grammar.start];
  const steps: Ll1TraceStep[] = [{ id: 1, stack: stack.slice().reverse().join(" "), input: input.join(" "), action: `Initialize with ${grammar.start} and end-marker $`, type: "start" }];
  let inputIndex = 0;
  let result: "ACCEPT" | "REJECT" = "REJECT";
  let reason = "";
  let guard = 0;

  while (stack.length && guard++ < 200) {
    const top = stack[stack.length - 1];
    const current = input[inputIndex] ?? "$";
    if (top === "$" && current === "$") {
      steps.push({ id: steps.length + 1, stack: "$", input: "$", action: "ACCEPT — stack and input are both complete", type: "accept" });
      result = "ACCEPT";
      reason = "The parser matched the complete input and reached $.";
      break;
    }
    if (top === "$") {
      reason = `Stack finished, but input still has ${current}.`;
      steps.push({ id: steps.length + 1, stack: stack.slice().reverse().join(" "), input: input.slice(inputIndex).join(" "), action: `REJECT — unexpected input ${current}`, type: "error" });
      break;
    }
    if (!grammar.nonTerminals.includes(top)) {
      if (top === current) {
        stack.pop();
        inputIndex += 1;
        steps.push({ id: steps.length + 1, stack: stack.slice().reverse().join(" ") || "∅", input: input.slice(inputIndex).join(" ") || "∅", action: `MATCH ${current}`, type: "match" });
      } else {
        reason = `Expected terminal ${top}, found ${current}.`;
        steps.push({ id: steps.length + 1, stack: stack.slice().reverse().join(" "), input: input.slice(inputIndex).join(" "), action: `REJECT — expected ${top}, found ${current}`, type: "error" });
        break;
      }
      continue;
    }
    const cell = table[`${top}|${current}`] ?? [];
    if (!cell.length) {
      reason = `No table entry for M[${top}, ${current}].`;
      steps.push({ id: steps.length + 1, stack: stack.slice().reverse().join(" "), input: input.slice(inputIndex).join(" "), action: `REJECT — no entry at M[${top}, ${current}]`, type: "error" });
      break;
    }
    if (cell.length > 1) {
      reason = `Table conflict at M[${top}, ${current}].`;
      steps.push({ id: steps.length + 1, stack: stack.slice().reverse().join(" "), input: input.slice(inputIndex).join(" "), action: `REJECT — conflict at M[${top}, ${current}]`, type: "error" });
      break;
    }
    const production = cell[0];
    stack.pop();
    [...production.rhs].reverse().forEach((symbol) => stack.push(symbol));
    steps.push({ id: steps.length + 1, stack: stack.slice().reverse().join(" ") || "∅", input: input.slice(inputIndex).join(" "), action: `${top} → ${formatSequence(production.rhs)}`, type: "expand" });
  }
  if (guard >= 200) reason = "Stopped after 200 moves to prevent an infinite grammar loop.";
  return { steps, result, reason };
}

export function parseRdp(grammar: Grammar, inputText: string) {
  const input = tokenizeInput(inputText);
  const events: RdpEvent[] = [];
  const stack: string[] = [];
  let inputIndex = 0;
  let nodeId = 0;
  let root: RdpNode | null = null;
  let stopped = false;

  const cloneTree = () => (root ? JSON.parse(JSON.stringify(root)) as RdpNode : null);
  const emit = (kind: RdpEvent["kind"], message: string, production?: Production) => {
    events.push({ index: events.length + 1, kind, message, stack: [...stack], input: [...input], inputIndex, production, tree: cloneTree() });
  };

  const parseNonTerminal = (name: string, parent: RdpNode | null, depth: number): boolean => {
    if (stopped || depth > 35 || events.length > 500) {
      stopped = true;
      emit("reject", "Stopped: grammar expansion exceeded the safety limit.");
      return false;
    }
    if (stack.includes(name)) {
      emit("fail", `Left recursion detected at ${name}; recursive descent cannot expand this call safely.`);
      return false;
    }
    const node: RdpNode = { id: ++nodeId, symbol: name, kind: "nonterminal", status: "active", children: [] };
    if (parent) parent.children.push(node); else root = node;
    stack.push(name);
    emit("enter", `Enter ${name}; descend into a new non-terminal call.`);
    const choices = grammar.productions.filter((production) => production.lhs === name);
    for (let choiceIndex = 0; choiceIndex < choices.length; choiceIndex += 1) {
      const production = choices[choiceIndex];
      const savedInput = inputIndex;
      node.production = production.id;
      emit("try", `Try ${production.id}: ${production.raw}`, production);
      let success = true;
      for (const symbol of production.rhs) {
        if (grammar.nonTerminals.includes(symbol)) {
          const childSuccess = parseNonTerminal(symbol, node, depth + 1);
          if (!childSuccess) { success = false; break; }
        } else {
          const leaf: RdpNode = { id: ++nodeId, symbol, kind: "terminal", status: "active", children: [] };
          node.children.push(leaf);
          const current = input[inputIndex];
          if (current === symbol) {
            leaf.status = "success";
            inputIndex += 1;
            emit("match", `Match terminal ${symbol}. Input pointer advances.`);
          } else {
            leaf.status = "failed";
            emit("fail", `Terminal ${symbol} failed: found ${current ?? "end of input"}.`);
            success = false;
            break;
          }
        }
      }
      if (success) {
        node.status = "success";
        emit("return", `Return success from ${name}; ${production.id} completed.`, production);
        stack.pop();
        return true;
      }
      inputIndex = savedInput;
      node.status = choiceIndex < choices.length - 1 ? "backtrack" : "failed";
      if (choiceIndex < choices.length - 1) {
        emit("backtrack", `Backtrack in ${name}: restore input and try the next alternative.`);
        node.status = "active";
      }
    }
    node.status = "failed";
    emit("return", `Return failure from ${name}; no remaining production can match.`);
    stack.pop();
    return false;
  };

  if (!grammar.productions.some((production) => production.lhs === grammar.start)) {
    emit("reject", `No production found for start symbol ${grammar.start}.`);
    return { events, result: "REJECT" as const, reason: "The start symbol has no production." };
  }
  const success = parseNonTerminal(grammar.start, null, 0);
  if (success && inputIndex === input.length) {
    emit("accept", "ACCEPT — the start symbol succeeded and the input is fully consumed.");
    return { events, result: "ACCEPT" as const, reason: "Input fully consumed." };
  }
  const reason = success ? `The grammar matched a prefix but left ${input.slice(inputIndex).join(" ") || "no tokens"}.` : "Every production path failed for the input.";
  emit("reject", `REJECT — ${reason}`);
  return { events, result: "REJECT" as const, reason };
}

export function setToArray(set?: Set<string>) {
  return [...(set ?? [])].sort((a, b) => (a === "ε" ? 1 : b === "ε" ? -1 : a.localeCompare(b)));
}
