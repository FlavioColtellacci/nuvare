"use client";

export function DashboardThinkingStyles() {
  return (
    <style jsx>{`
      .thinking-dots-loop {
        animation: thinking-dots-loop 1.15s linear infinite;
      }

      @keyframes thinking-dots-loop {
        0%,
        24.9% {
          width: 0ch;
        }
        25%,
        49.9% {
          width: 1ch;
        }
        50%,
        74.9% {
          width: 2ch;
        }
        75%,
        100% {
          width: 0ch;
        }
      }
    `}</style>
  );
}
