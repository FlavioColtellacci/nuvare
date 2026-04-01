"use client";

import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type AssistantMarkdownProps = {
  children: string;
};

export function AssistantMarkdown({ children }: AssistantMarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children: c }: ComponentPropsWithoutRef<"h1">) => (
          <h1 className="mb-3 text-lg font-semibold text-white">{c}</h1>
        ),
        h2: ({ children: c }: ComponentPropsWithoutRef<"h2">) => (
          <h2 className="mb-2 text-base font-semibold text-white">{c}</h2>
        ),
        h3: ({ children: c }: ComponentPropsWithoutRef<"h3">) => (
          <h3 className="mb-2 text-sm font-semibold text-white">{c}</h3>
        ),
        p: ({ children: c }: ComponentPropsWithoutRef<"p">) => (
          <p className="mb-2 text-sm leading-6 text-white/90 last:mb-0">{c}</p>
        ),
        strong: ({ children: c }: ComponentPropsWithoutRef<"strong">) => (
          <strong className="font-semibold text-white">{c}</strong>
        ),
        ul: ({ children: c }: ComponentPropsWithoutRef<"ul">) => (
          <ul className="mb-2 list-disc space-y-1 pl-5 text-sm text-white/90">{c}</ul>
        ),
        ol: ({ children: c }: ComponentPropsWithoutRef<"ol">) => (
          <ol className="mb-2 list-decimal space-y-1 pl-5 text-sm text-white/90">{c}</ol>
        ),
        li: ({ children: c }: ComponentPropsWithoutRef<"li">) => <li>{c}</li>,
        hr: () => <hr className="my-3 border-white/15" />,
        table: ({ children: c }: ComponentPropsWithoutRef<"table">) => (
          <div className="my-2 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-white/90">{c}</table>
          </div>
        ),
        thead: ({ children: c }: ComponentPropsWithoutRef<"thead">) => (
          <thead className="bg-white/5 text-white">{c}</thead>
        ),
        tbody: ({ children: c }: ComponentPropsWithoutRef<"tbody">) => <tbody>{c}</tbody>,
        tr: ({ children: c }: ComponentPropsWithoutRef<"tr">) => (
          <tr className="border-b border-white/10 last:border-b-0">{c}</tr>
        ),
        th: ({ children: c }: ComponentPropsWithoutRef<"th">) => (
          <th className="border border-white/10 px-2 py-1.5 font-medium">{c}</th>
        ),
        td: ({ children: c }: ComponentPropsWithoutRef<"td">) => (
          <td className="border border-white/10 px-2 py-1.5">{c}</td>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
