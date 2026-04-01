"use client";

import { useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

import { toggleSelection } from "../_lib/utils";

export function SearchableMultiSelect({
  options,
  selected,
  onChange,
  searchPlaceholder,
}: {
  options: string[];
  selected: string[];
  onChange: (value: string[]) => void;
  searchPlaceholder: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = options.filter((option) =>
    option.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-3">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={searchPlaceholder}
        className="h-11"
      />
      <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border border-white/15 bg-black/35 p-3">
        {filtered.map((option) => (
          <label
            key={option}
            className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-white/85 transition-colors hover:bg-white/10"
          >
            <Checkbox
              checked={selected.includes(option)}
              onCheckedChange={() => onChange(toggleSelection(selected, option))}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-white/45">
          Selected: {selected.length}{" "}
          {selected.length === 1 ? "country" : "countries"}
        </p>
      )}
    </div>
  );
}
