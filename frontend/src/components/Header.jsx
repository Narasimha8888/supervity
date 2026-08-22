import { Activity } from 'lucide-react';

export default function Header({ activeRulesCount = 0 }) {
  return (
    <header className="flex items-center justify-between px-8 py-4 border-b border-[var(--color-brand-border)] bg-[var(--color-brand-panel)] shrink-0 z-20 shadow-sm relative">
      <div className="flex items-center space-x-6">
        <h1 className="text-xs font-bold tracking-widest text-[var(--color-brand-muted)] uppercase">
          POLICY-DRIVEN APPROVAL AGENT
        </h1>
      </div>
      <div className="flex items-center space-x-8">
        
        <div className="flex space-x-6 border-r border-[var(--color-brand-border)] pr-8">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-bold tracking-widest text-[var(--color-brand-muted)] uppercase mb-0.5">CLAIMS</span>
            <span className="text-xs font-mono font-bold text-white">16</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-bold tracking-widest text-[var(--color-brand-muted)] uppercase mb-0.5">ACTIVE POLICIES</span>
            <span className="text-xs font-mono font-bold text-white">{activeRulesCount}</span>
          </div>
        </div>

        <div className="flex items-center px-3 py-1.5 rounded-full border border-[var(--color-brand-border)] bg-[var(--color-brand-bg)]">
          <Activity className="w-3 h-3 text-[var(--color-brand-muted)] mr-2" />
          <span className="text-[10px] font-bold tracking-widest text-[var(--color-brand-text)] uppercase">
            System Ready
          </span>
        </div>
      </div>
    </header>
  );
}
