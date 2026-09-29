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
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
      <div>
        <div className="flex items-center gap-2.5">
          {tag && (
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-brand-700 border border-brand-200">
              {tag}
            </span>
          )}
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-display">
            {title}
          </h1>
        </div>
        {subtitle && <p className="mt-1 text-xs sm:text-sm text-slate-500 font-normal">{subtitle}</p>}
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
    <div className="card p-5 group hover:border-brand-300 hover:shadow-card-hover transition-all relative overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 font-display">
          {label}
        </span>
        {icon && (
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100/90 text-slate-700 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors shadow-subtle text-base">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-display">
        {value}
      </div>

      {(hint || trend) && (
        <div className="mt-2.5 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={`inline-flex items-center font-bold rounded-lg px-2 py-0.5 text-[11px] shadow-subtle ${
                trend.positive !== false
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80"
                  : "bg-rose-50 text-rose-800 border border-rose-200/80"
              }`}
            >
              {trend.positive !== false ? "↑" : "↓"} {trend.value}
            </span>
          )}
          {hint && <span className="text-slate-500 font-medium text-[11px]">{hint}</span>}
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
    <div className="card grid place-items-center p-10 text-center border-dashed border-2 border-slate-200 bg-slate-50/50 rounded-2xl">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-subtle border border-slate-200 text-xl text-slate-400 mb-3">
        📂
      </div>
      <h3 className="text-sm font-bold text-slate-800 font-display">{title}</h3>
      {children && <p className="mt-1 max-w-sm text-xs text-slate-500 font-normal">{children}</p>}
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-3.5 gap-2">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-slate-900 font-display">{title}</h2>
          {subtitle && <p className="text-[11px] text-slate-500 font-normal mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

const badgeColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  green: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200/80",
    dot: "bg-emerald-500",
  },
  red: {
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-200/80",
    dot: "bg-rose-500",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200/80",
    dot: "bg-amber-500",
  },
  blue: {
    bg: "bg-brand-50",
    text: "text-brand-800",
    border: "border-brand-200/80",
    dot: "bg-brand-500",
  },
  slate: {
    bg: "bg-slate-100",
    text: "text-slate-800",
    border: "border-slate-200/80",
    dot: "bg-slate-400",
  },
  indigo: {
    bg: "bg-indigo-50",
    text: "text-indigo-800",
    border: "border-indigo-200/80",
    dot: "bg-indigo-500",
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
