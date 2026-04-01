"use client";

import type { RefObject } from "react";
import Link from "next/link";

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
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-[260px] border-r border-white/12 bg-[#070707]/95 backdrop-blur-sm flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:z-20`}
    >
      <div className="flex h-full flex-col p-4">
        <button
          className="absolute right-4 top-4 p-1 text-white/40 hover:text-white md:hidden"
          onClick={onCloseSidebar}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
            <path
              d="M1 1l16 16M17 1L1 17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <span className="hidden font-light text-sm tracking-[0.3em] text-white md:block">NUVARE</span>
        <Button
          onClick={() => {
            onNewChat();
            onCloseSidebar();
          }}
          className="mt-6 h-10 w-full border border-white/20 bg-transparent text-white hover:bg-white/10"
        >
          New Chat
        </Button>
        <NotificationsPanel
          panelRef={notificationsPanelRef}
          notifications={notifications}
          unreadCount={unreadCount}
          isOpen={isNotificationsOpen}
          onToggle={onToggleNotifications}
        />
        <Link
          href="/vault"
          className={cn(
            "mt-3 inline-flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-lg border px-3 text-sm transition-colors",
            subscriptionTier === "professional"
              ? "border-white/20 bg-[#101010] text-white hover:bg-white/10"
              : "border-white/10 bg-[#0d0d0d] text-white/45 hover:bg-white/5 hover:text-white/70",
          )}
        >
          <Shield className="h-4 w-4 shrink-0" />
          <span>Document Vault</span>
        </Link>
        {subscriptionTier !== "none" ? (
          <Link
            href="/countries"
            className="mt-3 inline-flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-lg border border-white/20 bg-[#101010] px-3 text-sm text-white transition-colors hover:bg-white/10"
          >
            <Globe className="h-4 w-4 shrink-0" />
            <span>Countries</span>
          </Link>
        ) : null}
        {subscriptionTier !== "none" && viewedCountries.length > 0 ? (
          <section className="mt-3 rounded-lg border border-white/12 bg-[#0d0d0d] p-3">
            <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-white/45">
              Your Countries
            </p>
            <div className="space-y-1.5">
              {viewedCountries.map((country) => (
                <Link
                  key={`${country.slug}-${country.countryName}`}
                  href={`/countries/${country.slug}`}
                  className="block rounded px-1.5 py-1 text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {countryFlag(country.countryName)} {country.countryName}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
          <p className="mb-3 text-xs uppercase tracking-[0.16em] text-white/45">Past chats</p>
          <div className="space-y-2">
            {isLoadingConversations ? (
              <p className="text-xs text-white/50">Loading chats...</p>
            ) : chatSessions.length === 0 ? (
              <p className="text-xs text-white/50">No past chats yet.</p>
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
                      className="h-10 w-full rounded-lg border border-white/25 bg-[#0f0f0f] px-3 pr-10 text-sm text-white shadow-none focus-visible:ring-0"
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
                        "w-full rounded-lg border px-3 py-2 pr-10 text-left text-sm transition-colors",
                        selectedConversationId === session.id
                          ? "border-white/30 bg-white/12 text-white"
                          : "border-white/12 bg-[#111111] text-white/85 hover:bg-white/10",
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
                        "absolute right-1.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md border border-white/10 bg-[#0d0d0d] text-sm text-white/65 transition-all hover:border-white/25 hover:bg-[#171717] hover:text-white",
                        openConversationMenuId === session.id
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100",
                      )}
                      aria-label="Conversation options"
                      title="More"
                    >
                      ...
                    </button>
                  )}

                  {openConversationMenuId === session.id ? (
                    <div className="absolute right-1.5 top-9 z-30 min-w-[124px] rounded-lg border border-white/15 bg-[#0a0a0a] p-1 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onStartRename(session.id, session.title);
                        }}
                        className="w-full rounded-md px-2.5 py-1.5 text-left text-xs text-white/85 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void onDeleteConversation(session.id);
                        }}
                        className="w-full rounded-md px-2.5 py-1.5 text-left text-xs text-red-200 transition-colors hover:bg-red-500/20 hover:text-red-100"
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

        <SidebarDeadlinesSection
          allDeadlines={allDeadlines}
          onOpenAddModal={onOpenAddDeadlineModal}
        />

        <section className="mt-4 border-t border-white/10 pt-4">
          <p className="truncate text-xs text-white/55">{userEmail}</p>
          {subscriptionTier === "none" ? (
            <Link
              href="/pricing"
              className="mt-2 inline-flex cursor-pointer text-xs text-white/45 transition-colors hover:text-white/75"
            >
              Start your plan →
            </Link>
          ) : null}
          {subscriptionTier === "core" ? (
            <Link
              href="/pricing"
              className="mt-2 inline-flex cursor-pointer text-xs text-white/45 transition-colors hover:text-white/75"
            >
              Upgrade to Professional →
            </Link>
          ) : null}
          {subscriptionTier === "professional" ? (
            <span className="mt-2 inline-flex rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-white/55">
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
            className="mt-2 h-9 w-full justify-start px-2 text-white/80 hover:bg-white/10 hover:text-white"
          >
            {isSigningOut ? "Signing out..." : "Sign Out"}
          </Button>
        </section>
      </div>
    </aside>
  );
}
