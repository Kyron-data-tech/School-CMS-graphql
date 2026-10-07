import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
  tag,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  tag?: string;
}) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800/80">
      <div>
        <div className="flex items-center gap-2.5">
          {tag && (
            <span className="rounded-full bg-brand-950/70 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-brand-300 border border-brand-800/80">
              {tag}
            </span>
          )}
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-display">
            {title}
          </h1>
        </div>
        {subtitle && <p className="mt-1 text-xs sm:text-sm text-slate-400 font-normal">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2.5 shrink-0">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  trend,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  trend?: { value: string; positive?: boolean };
}) {
  return (
    <div className="card p-5 group hover:border-brand-500/50 hover:shadow-card-hover transition-all relative overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 font-display">
          {label}
        </span>
        {icon && (
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-800/90 text-slate-300 group-hover:bg-brand-950 group-hover:text-brand-400 transition-colors shadow-subtle text-base border border-slate-700/60">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-white font-display">
        {value}
      </div>

      {(hint || trend) && (
        <div className="mt-2.5 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={`inline-flex items-center font-bold rounded-lg px-2 py-0.5 text-[11px] shadow-subtle ${
                trend.positive !== false
                  ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/80"
                  : "bg-rose-950/60 text-rose-400 border border-rose-800/80"
              }`}
            >
              {trend.positive !== false ? "↑" : "↓"} {trend.value}
            </span>
          )}
          {hint && <span className="text-slate-400 font-medium text-[11px]">{hint}</span>}
        </div>
      )}
    </div>
  );
}

export function Empty({
  title = "No records found",
  children,
  action,
}: {
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="card grid place-items-center p-10 text-center border-dashed border-2 border-slate-800 bg-slate-900/40 rounded-2xl">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-800 shadow-subtle border border-slate-700 text-xl text-slate-400 mb-3">
        📂
      </div>
      <h3 className="text-sm font-bold text-white font-display">{title}</h3>
      {children && <p className="mt-1 max-w-sm text-xs text-slate-400 font-normal">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Section({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 bg-slate-950/60 px-5 py-3.5 gap-2">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-white font-display">{title}</h2>
          {subtitle && <p className="text-[11px] text-slate-400 font-normal mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

const badgeColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  green: {
    bg: "bg-emerald-950/70",
    text: "text-emerald-300",
    border: "border-emerald-800/70",
    dot: "bg-emerald-400",
  },
  red: {
    bg: "bg-rose-950/70",
    text: "text-rose-300",
    border: "border-rose-800/70",
    dot: "bg-rose-400",
  },
  amber: {
    bg: "bg-amber-950/70",
    text: "text-amber-300",
    border: "border-amber-800/70",
    dot: "bg-amber-400",
  },
  blue: {
    bg: "bg-brand-950/70",
    text: "text-brand-300",
    border: "border-brand-800/70",
    dot: "bg-brand-400",
  },
  slate: {
    bg: "bg-slate-800/80",
    text: "text-slate-300",
    border: "border-slate-700/80",
    dot: "bg-slate-400",
  },
  indigo: {
    bg: "bg-indigo-950/70",
    text: "text-indigo-300",
    border: "border-indigo-800/70",
    dot: "bg-indigo-400",
  },
  purple: {
    bg: "bg-purple-950/70",
    text: "text-purple-300",
    border: "border-purple-800/70",
    dot: "bg-purple-400",
  },
};

export function Badge({
  color = "slate",
  children,
  dot = true,
}: {
  color?: keyof typeof badgeColors;
  children: ReactNode;
  dot?: boolean;
}) {
  const scheme = badgeColors[color] ?? badgeColors.slate;
  return (
    <span className={`badge ${scheme.bg} ${scheme.text} ${scheme.border}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${scheme.dot}`} />}
      {children}
    </span>
  );
}
