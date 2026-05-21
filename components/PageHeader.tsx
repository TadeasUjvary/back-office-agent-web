type Props = {
  num: string;
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  right?: React.ReactNode;
};

export function PageHeader({ num, eyebrow, title, description, right }: Props) {
  return (
    <header className="border-b border-hairline px-10 py-9">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-start justify-between gap-8">
          <div className="flex-1">
            <p className="font-mono text-[11px] uppercase tracking-wider text-copper">
              {num} · <span className="text-ink-muted">{eyebrow}</span>
            </p>
            <h1 className="display mt-3 text-[44px] leading-[1.02] tracking-tight text-ink">
              {title}
            </h1>
            {description && (
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
                {description}
              </p>
            )}
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </div>
      </div>
    </header>
  );
}
