import { BookOpen, ChevronRight, Code2, GitBranch, Home, Layers3 } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function AppShell({ children, eyebrow = "TOP-DOWN PARSING / WORKBENCH" }: { children: React.ReactNode; eyebrow?: string }) {
  const [location] = useLocation();
  return (
    <div className="app-shell">
      <header className="relative z-20 border-b border-white/10 bg-[#071018]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-200/30 bg-cyan-300/10 text-cyan-200 shadow-[0_0_26px_rgba(108,229,232,.12)]">
              <Code2 size={18} strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-display text-sm font-bold tracking-tight text-slate-100">parser<span className="text-cyan-300">.lab</span></div>
              <div className="font-mono text-[9px] uppercase tracking-[.18em] text-slate-500">visual compiler tools</div>
            </div>
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            <NavItem href="/" icon={<Home size={14} />} label="Home" active={location === "/"} />
            <NavItem href="/top-down" icon={<GitBranch size={14} />} label="Top-Down Lab" active={location.startsWith("/top-down")} />
            <NavItem href="/guide" icon={<BookOpen size={14} />} label="User guide" active={location === "/guide"} />
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-emerald-300 sm:inline-flex">LOCAL / READY</span>
            <Link href="/top-down" className="btn-secondary px-3 py-2 text-xs">Open lab <ChevronRight size={14} /></Link>
          </div>
        </div>
      </header>
      <main className="relative z-10">{children}</main>
      <footer className="relative z-10 mx-auto flex max-w-[1480px] items-center justify-between px-5 py-8 font-mono text-[10px] uppercase tracking-[.14em] text-slate-600 lg:px-8">
        <span>parser.lab / deterministic, inspectable, local-first</span>
        <span className="hidden items-center gap-2 sm:flex"><Layers3 size={13} /> rdp + ll(1)</span>
      </footer>
    </div>
  );
}

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return <Link href={href} className={`btn-quiet text-xs ${active ? "bg-white/5 text-cyan-200" : ""}`}>{icon}{label}</Link>;
}
