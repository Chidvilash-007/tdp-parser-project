import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, CircleDot, GitBranch, Info, Layers3, Play, RotateCcw, Table2, Terminal, TreePine, Zap } from "lucide-react";
import { Link } from "wouter";
import AppShell from "@/components/AppShell";
import { analyzeGrammar, buildParseTable, computeFirst, computeFollow, eliminateLeftRecursion, formatSequence, parseGrammar, parseLL1, parseRdp, setToArray, type Grammar, type RdpNode } from "@/lib/parser";

const LL1_SAMPLE = `E  -> T E'\nE' -> + T E' | ε\nT  -> id`;
const RDP_SAMPLE = `S -> a A | a B\nA -> b\nB -> c`;

type Module = "rdp" | "ll1";

export default function TopDown() {
  const [module, setModule] = useState<Module>("rdp");
  const [grammarText, setGrammarText] = useState(RDP_SAMPLE);
  const [inputText, setInputText] = useState("a c");
  const [rdpStep, setRdpStep] = useState(-1);
  const [firstStep, setFirstStep] = useState(-1);
  const [followStep, setFollowStep] = useState(-1);
  const [tableStep, setTableStep] = useState(-1);
  const [ll1Step, setLl1Step] = useState(0);
  const [error, setError] = useState("");
  const parsed = useMemo(() => { try { return { grammar: parseGrammar(grammarText), error: "" }; } catch (err) { return { grammar: null, error: err instanceof Error ? err.message : "Could not parse grammar." }; } }, [grammarText]);
  const grammar = parsed.grammar;
  const analysis = useMemo(() => {
    if (!grammar) return null;
    const diagnostics = analyzeGrammar(grammar);
    const safeGrammar = eliminateLeftRecursion(grammar);
    const first = computeFirst(safeGrammar);
    const follow = computeFollow(safeGrammar, first.sets);
    const table = buildParseTable(safeGrammar, first.sets, follow.sets);
    const rdp = parseRdp(safeGrammar, inputText);
    const ll1 = parseLL1(safeGrammar, table.table, inputText);
    return { first, follow, table, diagnostics, rdp, ll1, grammar: safeGrammar };
  }, [grammar, inputText]);

  const changeGrammar = (value: string) => { setGrammarText(value); setRdpStep(-1); setFirstStep(-1); setFollowStep(-1); setTableStep(-1); setLl1Step(0); setError(""); };
  const loadPreset = (preset: Module) => {
    setModule(preset);
    if (preset === "rdp") { setGrammarText(RDP_SAMPLE); setInputText("a c"); }
    else { setGrammarText(LL1_SAMPLE); setInputText("id + id"); }
    setRdpStep(-1); setFirstStep(-1); setFollowStep(-1); setTableStep(-1); setLl1Step(0); setError("");
  };
  const runAll = () => {
    if (!analysis) { setError(parsed.error); return; }
    if (module === "rdp") setRdpStep(analysis.rdp.events.length - 1);
    else { setFirstStep(analysis.first.steps.length - 1); setFollowStep(analysis.follow.steps.length - 1); setTableStep(analysis.table.steps.length - 1); setLl1Step(analysis.ll1.steps.length - 1); }
  };

  return <AppShell eyebrow={`TOP-DOWN PARSING / ${module === "rdp" ? "RECURSIVE DESCENT" : "LL(1) PREDICTIVE"}`}>
    <section className="mx-auto max-w-[1480px] px-5 pb-16 pt-8 lg:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div><Link href="/" className="btn-quiet -ml-3 mb-4 text-xs"><ArrowLeft size={14} /> home</Link><div className="eyebrow">workbench / interactive trace</div><h1 className="mt-2 font-display text-4xl font-semibold tracking-[-.045em] text-slate-100 sm:text-5xl">Top-down <span className="text-cyan-300">parsing.</span></h1></div>
        <div className="flex items-center gap-2"><button className="btn-quiet text-xs" onClick={() => loadPreset("rdp")}>RDP demo</button><button className="btn-quiet text-xs" onClick={() => loadPreset("ll1")}>LL(1) demo</button><button className="btn-primary text-xs" onClick={runAll}><Play size={14} /> Run all</button></div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[290px_1fr]">
        <aside className="space-y-4">
          <div className="panel p-4">
            <div className="eyebrow mb-3">01 / choose engine</div>
            <div className="space-y-2"><ModuleButton active={module === "rdp"} onClick={() => { setModule("rdp"); setRdpStep(-1); }} icon={<GitBranch size={16} />} title="Recursive descent" caption="calls + backtracking" /><ModuleButton active={module === "ll1"} onClick={() => { setModule("ll1"); setLl1Step(0); }} icon={<Table2 size={16} />} title="LL(1) predictive" caption="sets + table + trace" /></div>
          </div>
          <div className="panel p-4">
            <div className="mb-3 flex items-center justify-between"><div className="eyebrow">02 / grammar</div><span className="font-mono text-[10px] text-slate-600">{grammar?.productions.length ?? 0} rules</span></div>
            <textarea aria-label="Grammar" className="textarea-dark font-mono text-xs" value={grammarText} onChange={(e) => changeGrammar(e.target.value)} spellCheck={false} />
            <div className="mt-3 flex items-center justify-between font-mono text-[10px] text-slate-600"><span>first LHS = start symbol</span><button className="text-cyan-300 hover:text-cyan-100" onClick={() => changeGrammar(LL1_SAMPLE)}>load LL(1)</button></div>
          </div>
          <div className="panel p-4">
            <div className="eyebrow mb-3">03 / test string</div>
            <div className="relative"><Terminal size={14} className="absolute left-3 top-3 text-slate-600" /><input aria-label="Test string" className="input-dark pl-9 font-mono text-sm" value={inputText} onChange={(e) => { setInputText(e.target.value); setRdpStep(-1); setLl1Step(0); }} /></div>
            <div className="mt-3 flex gap-2"><button className="btn-secondary flex-1 text-xs" onClick={() => { setRdpStep(-1); setLl1Step(0); setFirstStep(-1); setFollowStep(-1); setTableStep(-1); }}><RotateCcw size={13} /> Reset trace</button></div>
            {parsed.error && <div className="mt-3 flex gap-2 rounded-lg border border-red-300/20 bg-red-300/7 p-3 text-xs leading-5 text-red-200"><AlertTriangle size={14} className="mt-0.5 shrink-0" />{parsed.error}</div>}
            {error && <div className="mt-3 text-xs text-red-300">{error}</div>}
          </div>
          <div className="panel-soft p-4 text-xs leading-5 text-slate-500"><Info size={15} className="mb-2 text-cyan-300" /><strong className="text-slate-300">Notation</strong><br />Use spaces between terminals. For an empty production, type <span className="font-mono text-amber-300">epsilon</span> (the Unicode symbols <span className="font-mono text-amber-300">ε</span> and <span className="font-mono text-amber-300">ϵ</span> also work). To test the empty string, leave the input blank or type <span className="font-mono text-amber-300">epsilon</span>. Add <span className="font-mono text-amber-300">$</span> only if you want it visible in a test string.</div>
        </aside>

        <div className="min-w-0 space-y-5">
          {!grammar || !analysis ? <div className="panel grid min-h-[600px] place-items-center p-10 text-center"><div><AlertTriangle className="mx-auto text-amber-300" size={28} /><h2 className="mt-4 font-display text-xl font-semibold">Grammar needs a small repair</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{parsed.error || "Enter a grammar to begin."}</p></div></div> : <><GrammarDiagnostics analysis={analysis} module={module} originalGrammar={grammar} /><div className="mt-5">{module === "rdp" ? <RdpWorkspace analysis={analysis} step={rdpStep} setStep={setRdpStep} /> : <Ll1Workspace analysis={analysis} firstStep={firstStep} setFirstStep={setFirstStep} followStep={followStep} setFollowStep={setFollowStep} tableStep={tableStep} setTableStep={setTableStep} ll1Step={ll1Step} setLl1Step={setLl1Step} grammar={analysis.grammar} />}</div></>}
        </div>
      </div>
    </section>
  </AppShell>;
}

function GrammarDiagnostics({ analysis, module, originalGrammar }: { analysis: any; module: Module; originalGrammar: Grammar }) {
  const { diagnostics, table } = analysis;
  const hasWarnings = diagnostics.leftRecursion.length || diagnostics.leftFactoring.length || diagnostics.epsilonAlternatives.length || table.conflicts.length;
  if (!hasWarnings) return <div className="panel-soft flex items-start gap-3 border-emerald-300/20 bg-emerald-300/5 p-4 text-xs leading-5 text-emerald-100"><CheckCircle2 size={16} className="mt-0.5 shrink-0" /><div><strong>Grammar health check passed.</strong> No left-recursion cycle, common-prefix warning, duplicate epsilon alternative, or LL(1) table conflict was detected for this grammar.</div></div>;
  return <div className="space-y-3">
    {diagnostics.leftRecursion.length > 0 && <TransformedGrammarBlock original={originalGrammar} transformed={analysis.grammar} />}
    {diagnostics.leftRecursion.map((cycle: any, index: number) => <div key={`lr-${index}`} className="panel border-red-300/25 bg-red-300/8 p-4 text-xs leading-5 text-red-100"><div className="flex items-start gap-3"><AlertTriangle size={16} className="mt-0.5 shrink-0" /><div><strong>Left recursion detected ({cycle.kind}).</strong> <span className="font-mono">{cycle.symbols.join(" → ")}</span><p className="mt-1 text-red-100/75">{module === "rdp" ? "Recursive descent would keep expanding before consuming input, so the run is stopped safely." : "A predictive LL(1) parser can loop or build an invalid table for this shape."} Rewrite A → A α | β as A → β A' and A' → α A' | epsilon, or use a bottom-up/Pratt parser when the grammar is intentionally left-recursive.</p></div></div></div>)}
    {diagnostics.leftFactoring.map((item: any) => <div key={`lf-${item.lhs}-${item.prefix}`} className="panel border-amber-300/25 bg-amber-300/8 p-4 text-xs leading-5 text-amber-100"><strong>Common prefix detected in {item.lhs}.</strong> Productions {item.alternatives.join(" and ")} begin with <span className="font-mono">{item.prefix}</span>. Left-factor them so one lookahead token can choose the rule.</div>)}
    {diagnostics.epsilonAlternatives.map((item: any) => <div key={`eps-${item.lhs}`} className="panel border-violet-300/25 bg-violet-300/8 p-4 text-xs leading-5 text-violet-100"><strong>Multiple epsilon alternatives in {item.lhs}.</strong> {item.productionIds.join(", ")} all derive the empty string. Consolidate them before relying on FOLLOW-based table placement.</div>)}
    {table.conflicts.length > 0 && <div className="panel border-red-300/25 bg-red-300/8 p-4 text-xs leading-5 text-red-100"><strong>{table.conflicts.length} LL(1) table conflict{table.conflicts.length > 1 ? "s" : ""}.</strong> More than one production wants the same lookahead cell. This can come from ambiguity, missing left factoring, or an epsilon/FOLLOW overlap; the table marks the cell and the trace rejects it instead of guessing.</div>}
  </div>;
}

function TransformedGrammarBlock({ original, transformed }: { original: Grammar; transformed: Grammar }) {
  const grouped = (grammar: Grammar) => grammar.nonTerminals.map((lhs) => {
    const rules = grammar.productions.filter((production) => production.lhs === lhs);
    return `${lhs} → ${rules.map((production) => formatSequence(production.rhs)).join(" | ")}`;
  });
  return <div className="panel border-cyan-300/25 bg-cyan-300/6 p-5"><div className="flex items-start gap-3"><GitBranch size={17} className="mt-0.5 shrink-0 text-cyan-300" /><div className="min-w-0 flex-1"><div className="eyebrow text-cyan-300/80">generated repair / left recursion removed</div><h3 className="mt-1 font-display text-lg font-semibold text-slate-100">Grammar used by the parser</h3><p className="mt-2 text-xs leading-5 text-slate-400">The original grammar contained a left-recursive cycle. The lab created helper non-terminals, replaced recursive prefixes with right-recursive tails, and runs RDP/LL(1) on the generated grammar below.</p><div className="mt-4 grid gap-3 lg:grid-cols-2"><div className="rounded-lg border border-red-300/15 bg-red-300/5 p-3"><div className="font-mono text-[10px] uppercase tracking-[.14em] text-red-200/70">original input</div><pre className="mt-2 whitespace-pre-wrap font-mono text-xs leading-6 text-red-100/80">{grouped(original).join("\n")}</pre></div><div className="rounded-lg border border-emerald-300/15 bg-emerald-300/5 p-3"><div className="font-mono text-[10px] uppercase tracking-[.14em] text-emerald-200/80">generated safe grammar</div><pre className="mt-2 whitespace-pre-wrap font-mono text-xs leading-6 text-emerald-100">{grouped(transformed).join("\n")}</pre></div></div></div></div></div>;
}

function ModuleButton({ active, onClick, icon, title, caption }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; caption: string }) { return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${active ? "border-cyan-300/40 bg-cyan-300/10" : "border-transparent bg-white/[.02] hover:border-white/10 hover:bg-white/[.04]"}`}><span className={`grid h-9 w-9 place-items-center rounded-lg ${active ? "bg-cyan-300 text-[#061014]" : "bg-white/5 text-slate-500"}`}>{icon}</span><span className="min-w-0"><span className={`block font-display text-sm font-semibold ${active ? "text-cyan-100" : "text-slate-300"}`}>{title}</span><span className="mt-0.5 block font-mono text-[10px] text-slate-600">{caption}</span></span>{active && <CircleDot size={14} className="ml-auto text-cyan-300" />}</button>; }

function RdpWorkspace({ analysis, step, setStep }: { analysis: any; step: number; setStep: (value: number) => void }) {
  const event = analysis.rdp.events[Math.max(0, step)];
  const visibleTree = event?.tree;
  return <>
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <div className="panel grid-texture min-h-[520px] overflow-hidden p-5 sm:p-7"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4"><div><div className="eyebrow">recursive descent / parse tree</div><h2 className="mt-1 font-display text-xl font-semibold text-slate-100">The tree grows as calls return</h2></div><Verdict result={analysis.rdp.result} /></div><div className="mt-6 min-h-[380px] overflow-auto rounded-xl border border-white/10 bg-[#071018]/60 p-5">{visibleTree ? <Tree node={visibleTree} depth={0} /> : <EmptyTrace icon={<TreePine size={24} />} text="Press Next step to enter the start symbol." />}</div></div>
      <div className="panel flex min-h-[520px] flex-col p-5"><div className="eyebrow">live machine state</div><div className="mt-4 rounded-xl border border-cyan-300/15 bg-cyan-300/5 p-4"><div className="font-mono text-[10px] uppercase tracking-[.15em] text-slate-600">event {step < 0 ? 0 : step + 1} / {analysis.rdp.events.length}</div><div className="mt-3 font-display text-xl font-semibold text-cyan-100">{event?.message || "Waiting to start"}</div></div><div className="mt-4 grid grid-cols-2 gap-3"><StateBox label="call stack" value={event?.stack.length ? event.stack.join(" → ") : "—"} /><StateBox label="input pointer" value={event ? `${event.inputIndex} / ${event.input.length}` : "0 / 0"} /></div><div className="mt-4 flex-1 rounded-xl border border-white/10 bg-[#071018]/55 p-4"><div className="eyebrow text-slate-600">tokens ahead</div><div className="mt-4 flex flex-wrap gap-2">{(event?.input ?? []).map((token: string, index: number) => <span key={`${token}-${index}`} className={`rounded-md border px-2 py-1 font-mono text-xs ${index === event?.inputIndex ? "border-amber-300/50 bg-amber-300/10 text-amber-200" : index < (event?.inputIndex ?? 0) ? "border-white/5 text-slate-700 line-through" : "border-white/10 text-slate-400"}`}>{token}</span>)}{!event?.input.length && <span className="text-xs text-slate-600">No tokens yet.</span>}</div></div><div className="mt-4 flex gap-2"><button className="btn-secondary flex-1 text-xs" onClick={() => setStep(-1)}><RotateCcw size={13} /> reset</button><button className="btn-primary flex-1 text-xs" onClick={() => setStep(Math.min(step + 1, analysis.rdp.events.length - 1))}><ArrowRight size={14} /> next step</button></div></div>
    </div>
    <EventRail events={analysis.rdp.events} current={step} onSelect={setStep} />
  </>;
}

function Ll1Workspace({ analysis, firstStep, setFirstStep, followStep, setFollowStep, tableStep, setTableStep, ll1Step, setLl1Step, grammar }: { analysis: any; firstStep: number; setFirstStep: (v: number) => void; followStep: number; setFollowStep: (v: number) => void; tableStep: number; setTableStep: (v: number) => void; ll1Step: number; setLl1Step: (v: number) => void; grammar: Grammar }) {
  const firstVisible = firstStep < 0 ? [] : analysis.first.steps.slice(0, firstStep + 1);
  const followVisible = followStep < 0 ? [] : analysis.follow.steps.slice(0, followStep + 1);
  const tableVisible = tableStep < 0 ? [] : analysis.table.steps.slice(0, tableStep + 1);
  const firstSets = visibleSets(grammar.nonTerminals, firstVisible);
  const followSets = visibleFollowSets(grammar.nonTerminals, followVisible);
  const visibleCells = tableVisible.reduce((acc: Record<string, any[]>, placement: any) => { acc[placement.cell] = [...(acc[placement.cell] ?? []), placement.production]; return acc; }, {});
  const llEvent = analysis.ll1.steps[Math.min(Math.max(ll1Step, 0), analysis.ll1.steps.length - 1)];
  return <>
    <div className="panel p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5"><div><div className="eyebrow">ll(1) predictive analysis</div><h2 className="mt-1 font-display text-xl font-semibold text-slate-100">Build the machine in four passes</h2></div><div className="flex flex-wrap gap-2"><SmallAction label="First next" onClick={() => setFirstStep(Math.min(firstStep + 1, analysis.first.steps.length - 1))} /><SmallAction label="Follow next" onClick={() => setFollowStep(Math.min(followStep + 1, analysis.follow.steps.length - 1))} /><SmallAction label="Table next" onClick={() => setTableStep(Math.min(tableStep + 1, analysis.table.steps.length - 1))} /></div></div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
        <SetPanel title="FIRST sets" accent="text-amber-300" icon={<Zap size={15} />} sets={firstSets} step={firstStep} total={analysis.first.steps.length} onNext={() => setFirstStep(Math.min(firstStep + 1, analysis.first.steps.length - 1))} onAll={() => setFirstStep(analysis.first.steps.length - 1)} steps={firstVisible.map((step: any) => step.reason)} />
        <SetPanel title="FOLLOW sets" accent="text-violet-300" icon={<Layers3 size={15} />} sets={followSets} step={followStep} total={analysis.follow.steps.length} onNext={() => setFollowStep(Math.min(followStep + 1, analysis.follow.steps.length - 1))} onAll={() => setFollowStep(analysis.follow.steps.length - 1)} steps={followVisible.map((step: any) => step.reason)} />
      </div>
    </div>
    <div className="panel p-5 sm:p-7"><div className="flex flex-wrap items-end justify-between gap-3"><div><div className="eyebrow">parse table / cell placement</div><h2 className="mt-1 font-display text-xl font-semibold text-slate-100">Where does each production go?</h2></div><div className="flex items-center gap-2"><span className={`rounded-full border px-2.5 py-1 font-mono text-[10px] ${analysis.table.conflicts.length ? "border-red-300/30 bg-red-300/10 text-red-200" : "border-emerald-300/30 bg-emerald-300/10 text-emerald-200"}`}>{analysis.table.conflicts.length ? `${analysis.table.conflicts.length} conflict${analysis.table.conflicts.length > 1 ? "s" : ""}` : "LL(1) compatible"}</span><button className="btn-secondary text-xs" onClick={() => setTableStep(analysis.table.steps.length - 1)}>build all</button></div></div><div className="mt-5 overflow-x-auto rounded-xl border border-white/10"><table className="w-full min-w-[650px] border-collapse text-left"><thead><tr className="bg-white/[.03] text-[10px] uppercase tracking-[.13em] text-slate-600"><th className="p-3">M[A, a]</th>{[...grammar.terminals, "$"].map((terminal) => <th key={terminal} className="p-3 font-mono">{terminal}</th>)}</tr></thead><tbody>{grammar.nonTerminals.map((nt) => <tr key={nt} className="border-t border-white/10"><th className="p-3 font-mono text-sm font-medium text-cyan-300">{nt}</th>{[...grammar.terminals, "$"].map((terminal) => { const values = visibleCells[`${nt}|${terminal}`] ?? []; const conflict = values.length > 1; return <td key={terminal} className={`border-l border-white/10 p-3 align-top ${conflict ? "bg-red-300/10" : ""}`}>{values.length ? values.map((p: any) => <div key={p.id} className={`font-mono text-xs ${conflict ? "text-red-200" : "text-slate-300"}`}>{p.id}: {formatSequence(p.rhs)}</div>) : <span className="font-mono text-xs text-slate-700">·</span>}</td>; })}</tr>)}</tbody></table></div><div className="mt-4 flex items-center justify-between gap-3"><div className="text-xs text-slate-500">{tableStep < 0 ? "No placements yet. Advance one rule at a time." : tableVisible.length ? tableVisible[tableVisible.length - 1].reason : ""}</div><button className="btn-primary text-xs" onClick={() => setTableStep(Math.min(tableStep + 1, analysis.table.steps.length - 1))}><ArrowRight size={14} /> next placement</button></div></div>
    <div className="panel p-5 sm:p-7"><div className="flex flex-wrap items-end justify-between gap-3"><div><div className="eyebrow">string parsing / stack trace</div><h2 className="mt-1 font-display text-xl font-semibold text-slate-100">One predictive move at a time</h2></div><Verdict result={analysis.ll1.result} /></div><div className="mt-5 overflow-x-auto rounded-xl border border-white/10"><table className="w-full min-w-[620px] border-collapse text-left"><thead><tr className="bg-white/[.03] text-[10px] uppercase tracking-[.13em] text-slate-600"><th className="p-3">#</th><th className="p-3">stack</th><th className="p-3">input</th><th className="p-3">action</th></tr></thead><tbody>{analysis.ll1.steps.slice(0, ll1Step + 1).map((step: any) => <tr key={step.id} className={`border-t border-white/10 ${step.type === "error" ? "bg-red-300/8" : step.type === "accept" ? "bg-emerald-300/8" : ""}`}><td className="p-3 font-mono text-xs text-slate-600">{String(step.id).padStart(2, "0")}</td><td className="p-3 font-mono text-xs text-cyan-200">{step.stack}</td><td className="p-3 font-mono text-xs text-amber-200">{step.input}</td><td className={`p-3 text-xs ${step.type === "error" ? "text-red-200" : step.type === "accept" ? "text-emerald-200" : "text-slate-400"}`}>{step.action}</td></tr>)}</tbody></table></div><div className="mt-4 flex items-center justify-between gap-3"><span className="text-xs text-slate-500">{llEvent?.action || "Ready to begin."}</span><button className="btn-primary text-xs" onClick={() => setLl1Step(Math.min(ll1Step + 1, analysis.ll1.steps.length - 1))}><ArrowRight size={14} /> next move</button></div></div>
  </>;
}

function SetPanel({ title, accent, icon, sets, step, total, onNext, onAll, steps }: { title: string; accent: string; icon: React.ReactNode; sets: Record<string, string[]>; step: number; total: number; onNext: () => void; onAll: () => void; steps: string[] }) {
  return <div className="panel-soft p-4">
    <div className="flex items-center justify-between"><div className={`flex items-center gap-2 font-display font-semibold ${accent}`}>{icon}{title}</div><span className="font-mono text-[10px] text-slate-600">{step < 0 ? 0 : step + 1} / {total}</span></div>
    <div className="mt-4 grid gap-2 sm:grid-cols-2">{Object.entries(sets).map(([name, values]) => <div key={name} className="rounded-lg border border-white/8 bg-[#071018]/55 p-3"><div className="font-mono text-xs text-slate-500">{title.split(" ")[0]}({name})</div><div className="mt-2 min-h-5 font-mono text-sm text-slate-200"><span>{"{"}</span>{values.length ? values.join(", ") : <span className="text-slate-700">∅</span>}<span>{"}"}</span></div></div>)}</div>
    <div className="mt-4 min-h-12 rounded-lg bg-white/[.03] p-3 text-xs leading-5 text-slate-500">{steps.length ? steps[steps.length - 1] : "Advance to reveal why each symbol enters a set."}</div>
    <div className="mt-3 flex justify-end gap-2"><button className="btn-quiet text-xs" onClick={onAll}>all at once</button><button className="btn-secondary text-xs" onClick={onNext}><ArrowRight size={13} /> next</button></div>
  </div>;
}
function visibleSets(names: string[], steps: any[]) { const sets: Record<string, string[]> = Object.fromEntries(names.map((name) => [name, []])); steps.forEach((step) => { sets[step.target] = [...new Set([...(sets[step.target] ?? []), ...step.additions])]; }); return sets; }
function visibleFollowSets(names: string[], steps: any[]) { const sets: Record<string, string[]> = Object.fromEntries(names.map((name) => [name, []])); steps.forEach((step) => { sets[step.target] = [...new Set([...(sets[step.target] ?? []), ...step.additions])]; }); return sets; }
function SmallAction({ label, onClick }: { label: string; onClick: () => void }) { return <button className="btn-quiet border border-white/10 text-[10px]" onClick={onClick}>{label}</button>; }
function StateBox({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/10 bg-white/[.025] p-3"><div className="font-mono text-[10px] uppercase tracking-[.12em] text-slate-600">{label}</div><div className="mt-2 break-words font-mono text-xs text-slate-300">{value}</div></div>; }
function Verdict({ result }: { result: "ACCEPT" | "REJECT" }) { return <span className={`flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] font-semibold tracking-[.12em] ${result === "ACCEPT" ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-300" : "border-red-300/30 bg-red-300/10 text-red-300"}`}>{result === "ACCEPT" ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}{result}</span>; }
function EmptyTrace({ icon, text }: { icon: React.ReactNode; text: string }) { return <div className="grid h-full min-h-[320px] place-items-center text-center text-slate-600"><div>{icon}<p className="mt-3 text-sm">{text}</p></div></div>; }
function Tree({ node, depth }: { node: RdpNode; depth: number }) { const stateClass = node.status === "success" ? "border-emerald-300/30 bg-emerald-300/8 text-emerald-200" : node.status === "failed" ? "border-red-300/30 bg-red-300/8 text-red-200" : node.status === "backtrack" ? "border-amber-300/30 bg-amber-300/8 text-amber-200" : "border-cyan-300/25 bg-cyan-300/7 text-cyan-100"; return <div className="relative" style={{ marginLeft: depth * 24 }}><div className={`my-2 inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-xs ${stateClass}`}><span className="text-slate-600">{node.kind === "nonterminal" ? "N" : "T"}</span><span>{node.symbol}</span>{node.production && <span className="text-[10px] text-slate-500">{node.production}</span>}<span className="text-[10px] uppercase tracking-[.1em] opacity-60">{node.status}</span></div>{node.children.map((child) => <Tree key={child.id} node={child} depth={depth + 1} />)}</div>; }
function EventRail({ events, current, onSelect }: { events: any[]; current: number; onSelect: (value: number) => void }) { return <div className="panel overflow-hidden p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2 font-display text-sm font-semibold text-slate-200"><ChevronDown size={15} className="text-cyan-300" /> event rail</div><span className="font-mono text-[10px] text-slate-600">click any event to inspect</span></div><div className="mt-4 flex gap-2 overflow-x-auto pb-1">{events.map((event: any, index: number) => <button key={event.index} onClick={() => onSelect(index)} className={`min-w-[120px] rounded-lg border p-3 text-left transition ${current === index ? "border-cyan-300/45 bg-cyan-300/10" : "border-white/10 bg-white/[.02] hover:border-white/20"}`}><div className="font-mono text-[10px] text-slate-600">{String(event.index).padStart(2, "0")}</div><div className={`mt-2 text-xs font-medium ${event.kind === "backtrack" ? "text-amber-200" : event.kind === "fail" || event.kind === "reject" ? "text-red-200" : event.kind === "accept" ? "text-emerald-200" : "text-slate-300"}`}>{event.kind}</div></button>)}</div></div>; }
