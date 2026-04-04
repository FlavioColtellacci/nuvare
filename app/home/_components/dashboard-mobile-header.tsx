"use client";

type DashboardMobileHeaderProps = {
  onOpenSidebar: () => void;
};

export function DashboardMobileHeader({ onOpenSidebar }: DashboardMobileHeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-center bg-[#0c0e14]/90 backdrop-blur-xl border-b border-white/5 md:hidden">
      <button
        type="button"
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-[#e2e2eb]/40 transition-colors hover:text-[#e2e2eb] focus:outline-none focus-visible:outline-none"
        onClick={onOpenSidebar}
        aria-label="Open sidebar"
      >
        {/* Hamburger */}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <rect y="3" width="20" height="2" rx="1" />
          <rect y="9" width="20" height="2" rx="1" />
          <rect y="15" width="20" height="2" rx="1" />
        </svg>
      </button>
      <span className="text-[11px] font-black tracking-widest uppercase text-white">NUVARE</span>
    </header>
  );
}
