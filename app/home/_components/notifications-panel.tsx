"use client";

import type { RefObject } from "react";
import { Bell } from "lucide-react";

import type { NotificationItem } from "@/app/home/_lib/types";
import { formatRelativeTime } from "@/app/home/_lib/format";

type NotificationsPanelProps = {
  panelRef: RefObject<HTMLDivElement | null>;
  notifications: NotificationItem[];
  unreadCount: number;
  isOpen: boolean;
  onToggle: () => void;
};

export function NotificationsPanel({
  panelRef,
  notifications,
  unreadCount,
  isOpen,
  onToggle,
}: NotificationsPanelProps) {
  return (
    <div ref={panelRef} className="relative mt-3">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => onToggle()}
        className="relative inline-flex h-10 w-full items-center gap-2.5 border border-white/10 bg-[#0c0e14] px-3 text-[10px] uppercase tracking-widest text-[#c4c7c8] transition-colors hover:bg-[#1e1f26] hover:text-white"
        aria-label="Notifications"
      >
        <Bell className="h-3.5 w-3.5 shrink-0" />
        <span>Notifications</span>
        {unreadCount > 0 ? (
          <span className="absolute left-5 top-2 inline-flex h-2 w-2 items-center justify-center rounded-full bg-white text-[8px] leading-none text-[#111319]">
            {unreadCount >= 10 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {/* Dropdown panel */}
      {isOpen ? (
        <div className="absolute left-0 top-12 z-30 w-[260px] border border-white/5 bg-[#0c0e14]">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-[#c4c7c8]">
              Notifications
            </p>
          </div>

          {/* Items */}
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-5">
                <p className="text-[10px] uppercase tracking-widest text-[#c4c7c8]/40">
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.slice(0, 20).map((notification) => (
                <article
                  key={notification.id}
                  className={`flex items-start gap-3 px-4 py-4 hover:bg-[#1e1f26] transition-all border-b border-white/5 last:border-b-0 ${
                    notification.read ? "" : "border-l-2 border-l-white"
                  }`}
                >
                  {/* Unread dot */}
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                      notification.read ? "bg-transparent" : "bg-white"
                    }`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-white leading-snug">
                      {notification.title}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#c4c7c8]/70 leading-snug">
                      {notification.body}
                    </p>
                    <p className="mt-1.5 text-[9px] uppercase tracking-widest text-[#c4c7c8]/40">
                      {formatRelativeTime(notification.created_at)}
                    </p>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
