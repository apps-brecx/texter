import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-line px-6 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-10 sm:py-10">
      <div className="max-w-2xl">
        {eyebrow ? <p className="u-eyebrow mb-2">{eyebrow}</p> : null}
        <h1 className="u-display text-[2.25rem] text-ink sm:text-[2.5rem]">{title}</h1>
        {description ? (
          <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
