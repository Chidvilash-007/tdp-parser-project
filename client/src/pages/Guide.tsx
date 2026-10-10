import { ArrowLeft, Check, Info, Keyboard, MousePointer2, Replace, RotateCcw, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import AppShell from "@/components/AppShell";

export default function Guide() {
  return <AppShell>
    <section className="mx-auto max-w-[1180px] px-5 pb-20 pt-12 lg:px-8 lg:pt-20">
      <Link href="/" className="btn-quiet -ml-3 mb-10 text-xs"><ArrowLeft size={14} /> back home</Link>
      <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr]">
        <div><div className="eyebrow">field notes / 002</div><h1 className="mt-4 font-display text-5xl font-semibold leading-none tracking-[-.05em] text-slate-100">A practical guide<br /><span className="text-cyan-300">to the lab.</span></h1><p className="mt-7 leading-7 text-slate-500">Everything runs in the browser. The analyzer does not silently guess when a grammar is unsuitable; it shows the reason, stops safely, and points to a rewrite.</p><Link href="/top-down" className="btn-primary mt-8">Open the workbench <MousePointer2 size={15} /></Link></div>
        <div className="space-y-4">
          <GuideCard icon={<Replace size={17} />} title="1 / Enter a grammar" kicker="INPUT FORMAT"><p>Use one rule per line, with <code>-&gt;</code> or <code>::=</code>. Separate alternatives with <code>|</code>. Put spaces between symbols.</p><pre>{`E  -> T E'
E' -> + T E' | epsilon
T  -> id`}</pre><p className="text-slate-500">The first left-hand symbol becomes the start symbol. Every symbol appearing on a left-hand side is treated as a non-terminal.</p></GuideCard>
          <GuideCard icon={<Keyboard size={17} />} title="2 / Choose a module" kicker="TWO MODES"><p><strong>RDP</strong> follows productions in order and can backtrack. <strong>LL(1)</strong> computes FIRST/FOLLOW, builds a table, and uses one lookahead token. Conflicts are reported instead of guessed.</p></GuideCard>
          <GuideCard icon={<Info size={17} />} title="3 / Read every decision" kicker="EVERY MOVE"><p>RDP events show calls, matches, failed alternatives, input restoration, and the growing tree. LL(1) cards show set derivations, table placements, conflicts, and the stack/input/action trace.</p></GuideCard>
          <GuideCard icon={<RotateCcw size={17} />} title="4 / Reset and compare" kicker="SAFE TO EXPERIMENT"><p>Use the demo buttons for known-good grammars. Try an invalid string, then reset and advance one move at a time. Empty input can be left blank or entered as <code>epsilon</code>.</p></GuideCard>
        </div>
      </div>

      <div className="mt-16 border-t border-white/10 pt-10"><div className="eyebrow">challenge handbook</div><div className="mt-5 grid gap-4 md:grid-cols-2">
        <Challenge title="Left recursion" problem="A → A alpha | beta expands A before consuming input. Direct and indirect cycles are detected before RDP runs." fix="Rewrite as A → beta A' and A' → alpha A' | epsilon. For intentionally left-associative expressions, a Pratt or bottom-up parser may be a better fit." />
        <Challenge title="Common prefixes / left factoring" problem="A → alpha beta1 | alpha beta2 gives both choices the same early lookahead." fix="Factor the shared prefix: A → alpha A' and A' → beta1 | beta2. The workbench highlights common prefixes and table conflicts." />
        <Challenge title="Ambiguity" problem="More than one parse tree can exist for the same input, often with dangling-else or unclear operator precedence." fix="Rewrite the grammar with explicit precedence and associativity levels. An LL(1) conflict is a warning that the parser must not guess." />
        <Challenge title="Epsilon and FOLLOW overlap" problem="When a nullable rule uses epsilon and a lookahead belongs to both FIRST and FOLLOW, two placements can target one table cell." fix="Separate nullable and non-nullable branches, then inspect the highlighted M[A, token] conflict." />
        <Challenge title="Multiple epsilon alternatives" problem="Two alternatives that both derive epsilon map to the same FOLLOW columns." fix="Remove redundant empty branches or consolidate the nullable path into one production." />
        <Challenge title="Backtracking cost" problem="RDP may retry many alternatives with a shared prefix; repeated rollback can become expensive." fix="Left-factor the grammar or use LL(1) when the grammar can be made predictive. The safety cap prevents runaway expansion." />
        <Challenge title="Expression nesting" problem="Naive recursive descent can become very deep for long nested expressions." fix="Use layered non-terminals for precedence, or use an iterative/Pratt parser for production-scale expression parsing." />
        <Challenge title="Error recovery and depth" problem="A teaching parser reports the first decisive mismatch; very deep or unproductive grammars can also exhaust work." fix="Use the exact rejection reason, add synchronization points in a production parser, and simplify deep grammar nesting. This lab stops after a bounded number of moves rather than hanging." />
      </div></div>

      <div className="mt-16 border-t border-white/10 pt-10"><div className="eyebrow">quick reference</div><div className="mt-5 grid gap-3 md:grid-cols-3"><Reference title="epsilon" text="Type the word epsilon for an empty production. Unicode ε and ϵ, eps, and a blank alternative are also accepted. It consumes no input." /><Reference title="$ / end marker" text="The synthetic token marking end of input. FOLLOW(start) receives $ automatically; normally you do not type it in the test string." /><Reference title="LL(1) conflict" text="Two productions land in one table cell. Refactor the grammar instead of accepting an arbitrary choice." /></div></div>
      <div className="mt-6 flex items-start gap-3 rounded-xl border border-cyan-300/15 bg-cyan-300/5 p-4 text-sm leading-6 text-slate-400"><ShieldAlert size={17} className="mt-1 shrink-0 text-cyan-300" /><p><strong className="text-slate-200">Accuracy promise:</strong> the lab accepts ordinary context-free grammar notation, but no single top-down strategy can correctly and efficiently resolve every ambiguous or non-LL(1) grammar without rewriting or using a different parser family. When a challenge is detected, the interface explains the limitation rather than producing a misleading answer.</p></div>
    </section>
  </AppShell>;
}

function GuideCard({ icon, title, kicker, children }: { icon: React.ReactNode; title: string; kicker: string; children: React.ReactNode }) {
  return <article className="panel p-6"><div className="flex items-start gap-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-300/10 text-amber-300">{icon}</span><div className="min-w-0"><div className="eyebrow text-amber-300/70">{kicker}</div><h2 className="mt-1 font-display text-xl font-semibold text-slate-100">{title}</h2><div className="mt-4 space-y-3 text-sm leading-6 text-slate-400">{children}</div></div></div></article>;
}
function Challenge({ title, problem, fix }: { title: string; problem: string; fix: string }) { return <article className="panel-soft p-5"><h3 className="font-display text-lg font-semibold text-slate-100">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-400"><strong className="text-amber-200">Problem:</strong> {problem}</p><p className="mt-2 text-sm leading-6 text-slate-400"><strong className="text-cyan-200">Repair:</strong> {fix}</p></article>; }
function Reference({ title, text }: { title: string; text: string }) { return <div className="panel-soft p-5"><div className="flex items-center gap-2 font-mono text-sm text-cyan-300"><Check size={14} />{title}</div><p className="mt-3 text-sm leading-6 text-slate-500">{text}</p></div>; }
