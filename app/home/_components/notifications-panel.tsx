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
      <button
        type="button"
        onClick={() => onToggle()}
        className="relative inline-flex h-10 w-full items-center gap-2.5 rounded-lg border border-white/20 bg-[#101010] px-3 text-sm text-white transition-colors hover:bg-white/10"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4 shrink-0" />
        <span>Notifications</span>
        {unreadCount > 0 ? (
          <span className="absolute left-5 top-2 inline-flex h-2 w-2 items-center justify-center rounded-full bg-red-500 text-[8px] leading-none text-white">
            {unreadCount >= 10 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>
      {isOpen ? (
        <div className="absolute left-0 top-12 z-30 w-[232px] rounded-2xl border border-white/12 bg-[#0b0b0b] p-3 text-sm">
          <p className="font-editorial text-sm text-white">Notifications</p>
          <div className="mt-2 space-y-2">
            {notifications.length === 0 ? (
              <p className="text-white/40">No notifications yet</p>
            ) : (
              notifications.slice(0, 20).map((notification) => (
                <article
                  key={notification.id}
                  className="rounded-lg border border-white/12 bg-[#101010] p-2"
                >
                  <p className="text-white">{notification.title}</p>
                  <p className="mt-1 text-white/55">{notification.body}</p>
                  <p className="mt-1 text-xs text-white/40">
                    {formatRelativeTime(notification.created_at)}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
