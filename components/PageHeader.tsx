type Props = {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  right?: React.ReactNode;
};

export function PageHeader({ eyebrow, title, description, right }: Props) {
  return (
    <header className="border-b border-border bg-bg/80 px-8 py-7 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-start justify-between gap-8">
          <div className="flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-text-faint">
              {eyebrow}
            </p>
            <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.02em] text-text">
              {title}
            </h1>
            {description && (
              <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-text-muted">
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
