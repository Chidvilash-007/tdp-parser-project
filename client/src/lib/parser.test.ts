import { describe, expect, it } from "vitest";
import { analyzeGrammar, buildParseTable, computeFirst, computeFollow, eliminateLeftRecursion, parseGrammar, parseLL1, parseRdp, tokenizeInput } from "./parser";

describe("top-down parser edge cases", () => {
  it("accepts epsilon written as a word and treats epsilon input as empty", () => {
    const grammar = parseGrammar("S -> A\nA -> a A | epsilon");
    expect(grammar.productions[grammar.productions.length - 1]?.rhs).toEqual([]);
    expect(tokenizeInput("epsilon")).toEqual([]);
    const first = computeFirst(grammar);
    expect(first.sets.A).toEqual(new Set(["a", "ε"]));
  });

  it("accepts a nullable LL(1) expression with the word epsilon", () => {
    const grammar = parseGrammar("S -> A\nA -> a A | epsilon");
    const first = computeFirst(grammar);
    const follow = computeFollow(grammar, first.sets);
    const table = buildParseTable(grammar, first.sets, follow.sets);
    expect(parseLL1(grammar, table.table, "a a").result).toBe("ACCEPT");
    expect(parseLL1(grammar, table.table, "epsilon").result).toBe("ACCEPT");
  });

  it("shows RDP backtracking and still accepts the correct alternative", () => {
    const grammar = parseGrammar("S -> a A | a B\nA -> b\nB -> c");
    const result = parseRdp(grammar, "a c");
    expect(result.result).toBe("ACCEPT");
    expect(result.events.some((event) => event.kind === "backtrack")).toBe(true);
  });

  it("detects and eliminates direct and indirect left recursion before parsing", () => {
    const direct = parseGrammar("E -> E + T | T\nT -> id");
    const indirect = parseGrammar("A -> B a | c\nB -> A b | d");
    expect(analyzeGrammar(direct).leftRecursion[0].kind).toBe("direct");
    expect(analyzeGrammar(indirect).leftRecursion.some((cycle) => cycle.kind === "indirect")).toBe(true);
    expect(analyzeGrammar(eliminateLeftRecursion(direct)).leftRecursion).toHaveLength(0);
    expect(analyzeGrammar(eliminateLeftRecursion(indirect)).leftRecursion).toHaveLength(0);
    expect(parseRdp(direct, "id + id").result).toBe("ACCEPT");
    expect(parseRdp(indirect, "d a").result).toBe("ACCEPT");
  });

  it("reports common-prefix and LL(1) conflicts instead of guessing", () => {
    const grammar = parseGrammar("S -> a A | a B\nA -> b\nB -> c");
    const analysis = analyzeGrammar(grammar);
    const first = computeFirst(grammar);
    const follow = computeFollow(grammar, first.sets);
    const table = buildParseTable(grammar, first.sets, follow.sets);
    expect(analysis.leftFactoring).toHaveLength(1);
    expect(table.conflicts.length).toBeGreaterThan(0);
    expect(parseLL1(grammar, table.table, "a c").result).toBe("REJECT");
  });

  it("rejects malformed and incomplete input without hanging", () => {
    const grammar = parseGrammar("S -> a S | epsilon");
    const first = computeFirst(grammar);
    const follow = computeFollow(grammar, first.sets);
    const table = buildParseTable(grammar, first.sets, follow.sets);
    expect(parseLL1(grammar, table.table, "a b").result).toBe("REJECT");
    expect(parseRdp(grammar, "a a").result).toBe("ACCEPT");
  });
});
