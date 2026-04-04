"use client";

import type { RefObject } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Globe, Shield } from "lucide-react";

import { countryFlag } from "@/app/home/_lib/format";
import type {
  ConversationSummary,
  DashboardDeadline,
  NotificationItem,
  SubscriptionTier,
  ViewedCountry,
} from "@/app/home/_lib/types";

import { NotificationsPanel } from "./notifications-panel";
import { SidebarDeadlinesSection } from "./deadlines/sidebar-deadlines-section";

type DashboardSidebarProps = {
  isSidebarOpen: boolean;
  onCloseSidebar: () => void;
  onNewChat: () => void;
  notificationsPanelRef: RefObject<HTMLDivElement | null>;
  notifications: NotificationItem[];
  unreadCount: number;
  isNotificationsOpen: boolean;
  onToggleNotifications: () => void;
  subscriptionTier: SubscriptionTier;
  viewedCountries: ViewedCountry[];
  isLoadingConversations: boolean;
  chatSessions: ConversationSummary[];
  selectedConversationId: string | null;
  renamingConversationId: string | null;
  renamingConversationDraft: string;
  onRenamingDraftChange: (value: string) => void;
  openConversationMenuId: string | null;
  onToggleConversationMenu: (sessionId: string) => void;
  onSelectConversation: (sessionId: string) => void;
  onStartRename: (conversationId: string, currentTitle: string) => void;
  onCancelRename: () => void;
  onSaveRename: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  userEmail: string;
  onSignOut: () => void;
  isSigningOut: boolean;
  allDeadlines: DashboardDeadline[];
  onOpenAddDeadlineModal: () => void;
};

/* ─── Inline SVG icons — no icon library required ─── */

function IconBell({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 2a6 6 0 0 1 6 6v3l1.5 2.5H2.5L4 11V8a6 6 0 0 1 6-6Z" />
      <path d="M8 16.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

function IconTrendingUp({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="2 14 7 9 11 13 18 6" />
      <polyline points="14 6 18 6 18 10" />
    </svg>
  );
}

function IconShield({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 2L3 5v5c0 4.418 3.134 8.015 7 9 3.866-.985 7-4.582 7-9V5l-7-3Z" />
    </svg>
  );
}

function IconGavel({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="4" y1="16" x2="16" y2="16" />
      <path d="M7 13L3 9l4-4 4 4-4 4Z" />
      <line x1="11" y1="5" x2="17" y2="11" />
    </svg>
  );
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M1 1l16 16M17 1L1 17" />
    </svg>
  );
}

export function DashboardSidebar({
  isSidebarOpen,
  onCloseSidebar,
  onNewChat,
  notificationsPanelRef,
  notifications,
  unreadCount,
  isNotificationsOpen,
  onToggleNotifications,
  subscriptionTier,
  viewedCountries,
  isLoadingConversations,
  chatSessions,
  selectedConversationId,
  renamingConversationId,
  renamingConversationDraft,
  onRenamingDraftChange,
  openConversationMenuId,
  onToggleConversationMenu,
  onSelectConversation,
  onStartRename,
  onCancelRename,
  onSaveRename,
  onDeleteConversation,
  userEmail,
  onSignOut,
  isSigningOut,
  allDeadlines,
  onOpenAddDeadlineModal,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  /* ── Nav items: map mockup intelligence items to real app routes ── */
  const navItems = [
    {
      label: "Real-time Alerts",
      icon: <IconBell className="h-4 w-4 shrink-0" />,
      href: null, // opens notifications panel
      onClick: () => {
        onToggleNotifications();
      },
      isActive: isNotificationsOpen,
      badge: unreadCount > 0 ? unreadCount : null,
    },
    {
      label: "Market Shifts",
      icon: <IconTrendingUp className="h-4 w-4 shrink-0" />,
      href: "/countries",
      onClick: null,
      isActive: pathname === "/countries",
      badge: null,
    },
    {
      label: "Risk Score",
      icon: <IconShield className="h-4 w-4 shrink-0" />,
      href: "/home",
      onClick: null,
      isActive: pathname === "/home",
      badge: null,
    },
    {
      label: "Regulatory Feed",
      icon: <IconGavel className="h-4 w-4 shrink-0" />,
      href: "/countries",
      onClick: null,
      isActive: false,
      badge: null,
    },
  ] as const;

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-white/5 bg-[#0c0e14] transition-transform duration-300 ease-in-out",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0 md:z-20",
      )}
    >
      {/* ── Close button (mobile only) ── */}
      <button
        type="button"
        className="absolute right-4 top-4 p-1 text-white/40 transition-colors hover:text-white md:hidden"
        onClick={onCloseSidebar}
        aria-label="Close sidebar"
      >
        <IconClose className="h-[18px] w-[18px]" />
      </button>

      {/* ── Top: wordmark + intelligence header ── */}
      <div className="px-6 pt-6 pb-0">
        <span className="hidden text-[11px] font-black tracking-widest uppercase text-white md:block">
          NUVARE
        </span>

        <div className="mt-8">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white">
            Intelligence
          </h2>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-[#e2e2eb]/20">
            Global Compliance Ops
          </p>
        </div>
      </div>

      {/* ── Intelligence nav items ── */}
      <nav className="mt-6 px-3" aria-label="Intelligence navigation">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const sharedClassName = cn(
              "flex w-full items-center gap-3 p-3 transition-all text-[10px] uppercase tracking-[0.2em]",
              item.isActive
                ? "bg-white text-[#111319] font-bold"
                : "text-[#e2e2eb]/40 hover:text-[#e2e2eb] hover:bg-[#1e1f26]",
            );

            if (item.onClick) {
              return (
                <button
                  key={item.label}
                  type="button"
                  className={sharedClassName}
                  onClick={item.onClick}
                >
                  {item.icon}
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge !== null ? (
                    <span
                      className={cn(
                        "flex h-4 min-w-[1rem] items-center justify-center px-1 text-[9px] font-bold",
                        item.isActive
                          ? "bg-[#111319] text-white"
                          : "bg-white text-[#111319]",
                      )}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href ?? "#"}
                className={sharedClassName}
                onClick={onCloseSidebar}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Notifications panel (rendered inline, toggled by nav item) ── */}
      <div className="px-3 mt-1">
        <NotificationsPanel
          panelRef={notificationsPanelRef}
          notifications={notifications}
          unreadCount={unreadCount}
          isOpen={isNotificationsOpen}
          onToggle={onToggleNotifications}
        />
      </div>

      {/* ── Secondary nav: Vault + Countries ── */}
      <div className="mt-4 px-3 space-y-0.5">
        <Link
          href="/vault"
          className={cn(
            "flex w-full items-center gap-3 p-3 text-[10px] uppercase tracking-[0.2em] transition-all",
            subscriptionTier === "professional"
              ? "text-[#e2e2eb]/40 hover:text-[#e2e2eb] hover:bg-[#1e1f26]"
              : "text-[#e2e2eb]/20 hover:text-[#e2e2eb]/40 hover:bg-[#1e1f26]",
          )}
          onClick={onCloseSidebar}
        >
          <Shield className="h-4 w-4 shrink-0" />
          <span>Document Vault</span>
        </Link>

        {subscriptionTier !== "none" ? (
          <Link
            href="/countries"
            className="flex w-full items-center gap-3 p-3 text-[10px] uppercase tracking-[0.2em] text-[#e2e2eb]/40 transition-all hover:text-[#e2e2eb] hover:bg-[#1e1f26]"
            onClick={onCloseSidebar}
          >
            <Globe className="h-4 w-4 shrink-0" />
            <span>Countries</span>
          </Link>
        ) : null}
      </div>

      {/* ── Viewed countries ── */}
      {subscriptionTier !== "none" && viewedCountries.length > 0 ? (
        <div className="mt-4 px-4">
          <p className="mb-2 text-[9px] uppercase tracking-[0.2em] text-[#e2e2eb]/20">
            Your Countries
          </p>
          <div className="space-y-0.5">
            {viewedCountries.map((country) => (
              <Link
                key={`${country.slug}-${country.countryName}`}
                href={`/countries/${country.slug}`}
                className="block px-2 py-1.5 text-[10px] text-[#e2e2eb]/40 transition-colors hover:bg-[#1e1f26] hover:text-[#e2e2eb]"
                onClick={onCloseSidebar}
              >
                {countryFlag(country.countryName)} {country.countryName}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {/* ── Divider ── */}
      <div className="mx-4 mt-6 border-t border-white/5" />

      {/* ── Past chats (scrollable flex-1 region) ── */}
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-4">
        <p className="mb-2 text-[9px] uppercase tracking-[0.2em] text-[#e2e2eb]/20">
          Past Chats
        </p>
        <div className="space-y-0.5">
          {isLoadingConversations ? (
            <p className="text-[10px] text-[#e2e2eb]/30">Loading chats…</p>
          ) : chatSessions.length === 0 ? (
            <p className="text-[10px] text-[#e2e2eb]/30">No past chats yet.</p>
          ) : (
            chatSessions.map((session) => (
              <div
                key={session.id}
                data-conversation-menu-root={session.id}
                className="group relative"
              >
                {renamingConversationId === session.id ? (
                  <Input
                    autoFocus
                    value={renamingConversationDraft}
                    onChange={(event) => onRenamingDraftChange(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void onSaveRename(session.id);
                      }
                      if (event.key === "Escape") {
                        event.preventDefault();
                        onCancelRename();
                      }
                    }}
                    className="h-9 w-full border border-white/10 bg-[#111319] px-3 pr-10 text-xs text-white shadow-none focus-visible:ring-0"
                    aria-label="Rename conversation"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectConversation(session.id);
                      onCloseSidebar();
                    }}
                    className={cn(
                      "w-full px-3 py-2 pr-10 text-left text-[10px] uppercase tracking-[0.15em] transition-all",
                      selectedConversationId === session.id
                        ? "bg-white/10 text-[#e2e2eb] font-bold"
                        : "text-[#e2e2eb]/40 hover:bg-[#1e1f26] hover:text-[#e2e2eb]",
                    )}
                  >
                    {session.title}
                  </button>
                )}

                {renamingConversationId === session.id ? null : (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleConversationMenu(session.id);
                    }}
                    className={cn(
                      "absolute right-1 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center border border-white/10 bg-[#0c0e14] text-xs text-white/50 transition-all hover:border-white/20 hover:text-white",
                      openConversationMenuId === session.id
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100",
                    )}
                    aria-label="Conversation options"
                    title="More"
                  >
                    •••
                  </button>
                )}

                {openConversationMenuId === session.id ? (
                  <div className="absolute right-1 top-8 z-30 min-w-[120px] border border-white/10 bg-[#0c0e14] p-1 shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onStartRename(session.id, session.title);
                      }}
                      className="w-full px-3 py-1.5 text-left text-[10px] uppercase tracking-[0.15em] text-[#e2e2eb]/70 transition-colors hover:bg-[#1e1f26] hover:text-[#e2e2eb]"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        void onDeleteConversation(session.id);
                      }}
                      className="w-full px-3 py-1.5 text-left text-[10px] uppercase tracking-[0.15em] text-red-300/70 transition-colors hover:bg-red-500/15 hover:text-red-200"
                    >
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Deadlines section ── */}
      <div className="px-0">
        <SidebarDeadlinesSection
          allDeadlines={allDeadlines}
          onOpenAddModal={onOpenAddDeadlineModal}
        />
      </div>

      {/* ── Bottom pinned section ── */}
      <div className="mt-auto border-t border-white/5">
        {/* ASK ANYTHING primary CTA */}
        <div className="px-4 pt-4">
          <button
            type="button"
            onClick={() => {
              onNewChat();
              onCloseSidebar();
            }}
            className="w-full py-4 bg-white text-[#111319] text-[10px] font-bold uppercase tracking-[0.2em] transition-all active:scale-[0.98] hover:opacity-90"
          >
            Ask Anything
          </button>
        </div>

        {/* Support + Logs */}
        <div className="px-4 pt-3 space-y-0.5">
          <a
            href="/support"
            className="flex items-center gap-3 px-1 py-1.5 text-[9px] uppercase tracking-widest text-[#e2e2eb]/30 transition-colors hover:text-[#e2e2eb]/70"
          >
            <svg
              className="h-3.5 w-3.5 shrink-0"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="8" cy="8" r="6" />
              <path d="M8 5.5a1.5 1.5 0 1 1 0 3" />
              <circle cx="8" cy="11" r="0.5" fill="currentColor" />
            </svg>
            <span>Support</span>
          </a>
          <a
            href="/home"
            className="flex items-center gap-3 px-1 py-1.5 text-[9px] uppercase tracking-widest text-[#e2e2eb]/30 transition-colors hover:text-[#e2e2eb]/70"
          >
            <svg
              className="h-3.5 w-3.5 shrink-0"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <rect x="2" y="2" width="12" height="3" rx="0.5" />
              <rect x="2" y="7" width="12" height="3" rx="0.5" />
              <rect x="2" y="12" width="7" height="2" rx="0.5" />
            </svg>
            <span>Logs</span>
          </a>
        </div>

        {/* User email + subscription status + sign out */}
        <div className="px-4 pt-3 pb-4 border-t border-white/5 mt-3">
          <p className="truncate text-[9px] uppercase tracking-[0.15em] text-[#e2e2eb]/30">
            {userEmail}
          </p>

          {subscriptionTier === "none" ? (
            <Link
              href="/pricing"
              className="mt-1.5 inline-flex text-[9px] uppercase tracking-widest text-[#e2e2eb]/30 transition-colors hover:text-[#e2e2eb]/60"
            >
              Start your plan →
            </Link>
          ) : null}
          {subscriptionTier === "core" ? (
            <Link
              href="/pricing"
              className="mt-1.5 inline-flex text-[9px] uppercase tracking-widest text-[#e2e2eb]/30 transition-colors hover:text-[#e2e2eb]/60"
            >
              Upgrade to Professional →
            </Link>
          ) : null}
          {subscriptionTier === "professional" ? (
            <span className="mt-1.5 inline-flex border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-widest text-[#e2e2eb]/30">
              Professional
            </span>
          ) : null}

          <Button
            variant="ghost"
            size="lg"
            onClick={() => {
              onCloseSidebar();
              void onSignOut();
            }}
            disabled={isSigningOut}
            className="mt-2 h-8 w-full justify-start px-1 text-[9px] uppercase tracking-widest text-[#e2e2eb]/30 hover:bg-white/5 hover:text-[#e2e2eb]/70"
          >
            {isSigningOut ? "Signing out…" : "Sign Out"}
          </Button>
        </div>
      </div>
    </aside>
  );
}
