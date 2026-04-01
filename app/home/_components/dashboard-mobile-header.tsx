"use client";

type DashboardMobileHeaderProps = {
  onOpenSidebar: () => void;
};

export function DashboardMobileHeader({ onOpenSidebar }: DashboardMobileHeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-center md:hidden">
      <button
        type="button"
        className="absolute left-4 top-1/2 -translate-y-1/2 border-0 p-2 text-white/60 shadow-none outline-none ring-0 hover:text-white focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        onClick={onOpenSidebar}
        aria-label="Open sidebar"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <rect y="3" width="20" height="2" rx="1" />
          <rect y="9" width="20" height="2" rx="1" />
          <rect y="15" width="20" height="2" rx="1" />
        </svg>
      </button>
      <span className="font-light text-sm tracking-[0.3em] text-white">NUVARE</span>
    </header>
  );
}
