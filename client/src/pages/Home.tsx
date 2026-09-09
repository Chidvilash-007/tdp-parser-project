import { ArrowRight, Check, GitBranch, Layers3, ListTree, Sparkles, Terminal, WandSparkles } from "lucide-react";
import { Link } from "wouter";
import AppShell from "@/components/AppShell";

const features = [
  { icon: <GitBranch size={18} />, number: "01", title: "Recursive descent", body: "Watch calls descend into a parse tree, then rewind visibly when an alternative fails." },
  { icon: <Layers3 size={18} />, number: "02", title: "First / Follow", body: "Derive sets one rule at a time with an explanation of where every symbol came from." },
  { icon: <ListTree size={18} />, number: "03", title: "LL(1) table", body: "Place productions into cells, expose conflicts, and explain the First/Follow choice." },
  { icon: <Terminal size={18} />, number: "04", title: "String trace", body: "Run the classic stack / input / action trace until the parser accepts or rejects." },
];

export default function Home() {
  return (
    <AppShell eyebrow="TOP-DOWN PARSING / HOME">
      <section className="mx-auto max-w-[1480px] px-5 pb-20 pt-14 lg:px-8 lg:pt-24">
        <div className="grid items-end gap-12 lg:grid-cols-[1fr_430px]">
          <div>
            <div className="eyebrow mb-6 flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300 pulse-line" /> interactive compiler lab</div>
            <h1 className="font-display max-w-4xl text-balance text-5xl font-semibold leading-[.98] tracking-[-.055em] text-slate-50 sm:text-7xl lg:text-[6.6rem]">
              See the grammar<br /><span className="text-cyan-300">think.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-400">A hands-on visualizer for top-down parsing. Feed it a grammar, move one decision at a time, and inspect exactly why a parser descends, backtracks, expands, matches—or stops.</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/top-down" className="btn-primary">Launch top-down lab <ArrowRight size={16} /></Link>
              <Link href="/guide" className="btn-quiet">Read the 2-minute guide</Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 font-mono text-[10px] uppercase tracking-[.13em] text-slate-600">
              <span className="flex items-center gap-2"><Check size={13} className="text-emerald-300" /> no setup</span>
              <span className="flex items-center gap-2"><Check size={13} className="text-emerald-300" /> every step inspectable</span>
              <span className="flex items-center gap-2"><Check size={13} className="text-emerald-300" /> syntax-light input</span>
            </div>
          </div>
          <div className="panel relative min-h-[350px] overflow-hidden p-6 lg:min-h-[420px]">
            <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-cyan-300/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-12 h-44 w-44 rounded-full bg-violet-400/10 blur-3xl" />
            <div className="relative flex items-center justify-between border-b border-white/10 pb-4"><span className="eyebrow">live concept / 001</span><Sparkles size={16} className="text-amber-300" /></div>
            <div className="relative mt-7 space-y-4 font-mono text-sm">
              <Line color="text-cyan-300" label="grammar" value="E → T E'" />
              <Line color="text-cyan-300" label="rule" value="E' → + T E' | ε" />
              <Line color="text-amber-300" label="input" value="id + id $" />
              <div className="my-6 h-px bg-gradient-to-r from-cyan-300/50 via-violet-300/25 to-transparent" />
              <div className="flex items-center gap-3 text-slate-500"><span className="text-amber-300">→</span> <span>FIRST(E') = {'{'}+, ε{'}'}</span></div>
              <div className="flex items-center gap-3 text-slate-500"><span className="text-cyan-300">→</span> <span>M[E', +] = E' → + T E'</span></div>
              <div className="mt-8 rounded-xl border border-emerald-300/20 bg-emerald-300/7 px-4 py-3 text-emerald-300"><span className="mr-2 text-[10px] uppercase tracking-[.18em] text-emerald-400/70">status</span> deterministic enough to teach</div>
            </div>
          </div>
        </div>

        <div className="mt-24 grid gap-4 border-t border-white/10 pt-7 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => <div key={feature.number} className="group panel-soft p-5 transition hover:-translate-y-1 hover:border-cyan-300/25">
            <div className="flex items-center justify-between"><span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-300/10 text-cyan-300">{feature.icon}</span><span className="font-mono text-[10px] text-slate-600">{feature.number}</span></div>
            <h2 className="mt-6 font-display text-xl font-semibold text-slate-100">{feature.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{feature.body}</p>
          </div>)}
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-[.82fr_1.18fr] lg:items-center">
          <div>
            <div className="eyebrow mb-4">the teaching loop</div>
            <h2 className="font-display text-3xl font-semibold tracking-[-.03em] text-slate-100 sm:text-4xl">From symbols to decisions.</h2>
            <p className="mt-4 max-w-xl leading-7 text-slate-500">Top-down parsing is easier to learn when the invisible choices become visible. The lab keeps the grammar, the current pointer, the stack, and the explanation in the same frame.</p>
          </div>
          <div className="grid-texture rounded-2xl border border-white/10 p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[.15em] text-slate-500"><span>four inspectable layers</span><span className="text-cyan-300">01 → 04</span></div>
            <div className="mt-7 grid gap-3 sm:grid-cols-4">
              {["grammar", "derivation", "decision", "verdict"].map((label, index) => <div key={label} className="relative rounded-xl border border-white/10 bg-[#091722]/80 p-4"><div className="font-mono text-[10px] text-cyan-300">0{index + 1}</div><div className="mt-8 font-display text-sm font-semibold text-slate-200">{label}</div>{index < 3 && <span className="absolute -right-2 top-1/2 hidden text-slate-600 sm:block">→</span>}</div>)}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function Line({ color, label, value }: { color: string; label: string; value: string }) {
  return <div className="flex items-center gap-4"><span className="w-14 text-[10px] uppercase tracking-[.16em] text-slate-600">{label}</span><span className={color}>{value}</span></div>;
}
