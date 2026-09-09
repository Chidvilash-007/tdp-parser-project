import { ArrowLeft, Check, Info, Keyboard, MousePointer2, Replace, RotateCcw } from "lucide-react";
import { Link } from "wouter";
import AppShell from "@/components/AppShell";

export default function Guide() {
  return <AppShell>
    <section className="mx-auto max-w-[1180px] px-5 pb-20 pt-12 lg:px-8 lg:pt-20">
      <Link href="/" className="btn-quiet -ml-3 mb-10 text-xs"><ArrowLeft size={14} /> back home</Link>
      <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr]">
        <div><div className="eyebrow">field notes / 002</div><h1 className="mt-4 font-display text-5xl font-semibold leading-none tracking-[-.05em] text-slate-100">A short guide<br /><span className="text-cyan-300">to the lab.</span></h1><p className="mt-7 leading-7 text-slate-500">Everything runs in the browser. The visualizer does not silently “solve” your grammar—it exposes the decisions so you can follow along.</p><Link href="/top-down" className="btn-primary mt-8">Open the workbench <MousePointer2 size={15} /></Link></div>
        <div className="space-y-4">
          <GuideCard icon={<Replace size={17} />} title="1 / Enter a grammar" kicker="INPUT FORMAT"><p>Use one rule per line, with <code>-&gt;</code> or <code>::=</code>. Separate alternatives with <code>|</code>. Put spaces between symbols.</p><pre>{`E  -> T E'\nE' -> + T E' | ε\nT  -> id`}</pre><p className="text-slate-500">The first left-hand symbol becomes the start symbol. Any symbol that appears on a left-hand side is treated as a non-terminal.</p></GuideCard>
          <GuideCard icon={<Keyboard size={17} />} title="2 / Choose a module" kicker="TWO MODES"><p><strong>RDP</strong> is production-order driven: it can backtrack when a chosen alternative fails. <strong>LL(1)</strong> computes predictive sets and uses a single lookahead token to select one cell.</p></GuideCard>
          <GuideCard icon={<Info size={17} />} title="3 / Read the explanation" kicker="EVERY MOVE"><p>RDP events show the call stack, pointer, and growing tree. LL(1) derivation cards show which existing set caused each new symbol to appear. Conflicting table cells are intentionally loud.</p></GuideCard>
          <GuideCard icon={<RotateCcw size={17} />} title="4 / Reset and explore" kicker="SAFE TO EXPERIMENT"><p>Load the sample whenever you want to return to a known working grammar. Change the test string to produce a reject path, then step backward through the explanation by resetting and advancing again.</p></GuideCard>
        </div>
      </div>
      <div className="mt-16 border-t border-white/10 pt-10"><div className="eyebrow">quick reference</div><div className="mt-5 grid gap-3 md:grid-cols-3"><Reference title="ε / epsilon" text="An empty production. It consumes no input and can propagate through First and Follow." /><Reference title="$ / end marker" text="The synthetic token that marks the end of the input and the start symbol’s Follow set." /><Reference title="LL(1) conflict" text="Two productions land in the same table cell. The grammar needs refactoring before predictive parsing." /></div></div>
    </section>
  </AppShell>;
}

function GuideCard({ icon, title, kicker, children }: { icon: React.ReactNode; title: string; kicker: string; children: React.ReactNode }) {
  return <article className="panel p-6"><div className="flex items-start gap-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-300/10 text-amber-300">{icon}</span><div className="min-w-0"><div className="eyebrow text-amber-300/70">{kicker}</div><h2 className="mt-1 font-display text-xl font-semibold text-slate-100">{title}</h2><div className="mt-4 space-y-3 text-sm leading-6 text-slate-400">{children}</div></div></div></article>;
}
function Reference({ title, text }: { title: string; text: string }) { return <div className="panel-soft p-5"><div className="flex items-center gap-2 font-mono text-sm text-cyan-300"><Check size={14} />{title}</div><p className="mt-3 text-sm leading-6 text-slate-500">{text}</p></div>; }
