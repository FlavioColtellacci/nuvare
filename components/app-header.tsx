"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface AppHeaderProps {
  userEmail?: string;
  jurisdictions?: string[]; // e.g. ["USA", "UK", "UAE"] — optional, shown as pills
  className?: string; // extra classes for the outermost <header> element
}

const NAV_ITEMS = [
  { label: "Dashboard", href: "/home" },
  { label: "Vault", href: "/vault" },
  { label: "Intelligence", href: "/home" },
  { label: "Profile", href: "/onboarding" },
] as const;

export function AppHeader({ userEmail: _userEmail, jurisdictions, className }: AppHeaderProps) {
  const pathname = usePathname();

  function isActive(href: string, label: string): boolean {
    if (label === "Dashboard") return pathname === "/home";
    if (label === "Intelligence") return false; // same href as Dashboard; Intelligence only active on its own route
    return pathname.startsWith(href);
  }

  return (
    <header
      className={`fixed top-0 w-full z-50 bg-[#111319]/70 backdrop-blur-xl flex justify-between items-center px-12 py-6${className ? ` ${className}` : ""}`}
    >
      {/* Left: wordmark + nav */}
      <div className="flex items-center gap-8">
        <span className="text-xl font-black tracking-widest uppercase text-white">NUVARE</span>
        <nav className="hidden md:flex gap-8">
          {NAV_ITEMS.map(({ label, href }) => {
            const active = isActive(href, label);
            return (
              <Link
                key={label}
                href={href}
                className={
                  active
                    ? "text-white border-b-2 border-white pb-1 font-bold tracking-tight"
                    : "text-[#e2e2eb]/60 hover:text-white transition-colors tracking-tight"
                }
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: jurisdiction pills + icon buttons */}
      <div className="flex items-center gap-6">
        {jurisdictions && jurisdictions.length > 0 && (
          <div className="flex gap-2 items-center px-4 py-2 bg-[#1e1f26] border border-white/5">
            <span className="text-[10px] uppercase tracking-widest opacity-40 text-white mr-2">
              Active Jurisdictions
            </span>
            {jurisdictions.map((j, i) => (
              <span
                key={j}
                className={
                  i === 0
                    ? "bg-white text-black text-[10px] font-bold px-2 py-0.5"
                    : "bg-[#33343b] text-white text-[10px] font-medium px-2 py-0.5"
                }
              >
                {j}
              </span>
            ))}
          </div>
        )}

        {/* Notification bell */}
        <button
          type="button"
          aria-label="Notifications"
          className="hover:bg-white/5 transition-all p-2 rounded-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
            aria-hidden="true"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        {/* Settings gear */}
        <button
          type="button"
          aria-label="Settings"
          className="hover:bg-white/5 transition-all p-2 rounded-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
