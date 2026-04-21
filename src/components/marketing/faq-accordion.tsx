"use client";

import { useCallback } from "react";
import posthog from "posthog-js";
import type { FAQItem } from "@/data/faqs";

type Props = {
  items: FAQItem[];
  page: string;
};

export function FAQAccordion({ items, page }: Props) {
  const handleToggle = useCallback(
    (question: string) => (event: React.SyntheticEvent<HTMLDetailsElement>) => {
      if (!event.currentTarget.open) return;
      try {
        posthog.capture("faq_question_expanded", { question, page });
      } catch {
        // posthog might not be initialized (dev, ad-blocker) — ignore silently
      }
    },
    [page],
  );

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {items.map((item) => (
        <details
          key={item.q}
          className="group rounded-xl border border-white/5 bg-white/[0.02] p-5 transition-colors hover:border-white/10"
          onToggle={handleToggle(item.q)}
        >
          <summary className="flex items-center justify-between cursor-pointer list-none gap-4">
            <span className="text-sm font-semibold pr-2">{item.q}</span>
            <span className="text-emerald-400 transition-transform group-open:rotate-45 shrink-0 text-lg leading-none">+</span>
          </summary>
          <p className="text-sm text-slate-400 mt-3 leading-relaxed whitespace-pre-line">
            {item.a}
          </p>
        </details>
      ))}
    </div>
  );
}
