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
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/[0.08]">
      <div>
        <div className="flex items-center gap-2.5">
          {tag && (
            <span className="rounded-full bg-brand-500/15 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-brand-300 border border-brand-500/30 backdrop-blur-md">
              {tag}
            </span>
          )}
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-display">
            {title}
          </h1>
        </div>
        {subtitle && <p className="mt-1 text-xs sm:text-sm text-slate-400 font-normal leading-relaxed">{subtitle}</p>}
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
    <div className="card-hover p-5 relative overflow-hidden group">
      {/* Top micro subtle light reflection */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-display">
          {label}
        </span>
        {icon && (
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.04] text-slate-300 group-hover:bg-brand-500/20 group-hover:text-brand-300 transition-all duration-300 text-base border border-white/[0.08] shadow-sm">
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
              className={`inline-flex items-center font-bold rounded-lg px-2 py-0.5 text-[11px] shadow-sm backdrop-blur-md ${
                trend.positive !== false
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
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
    <div className="card grid place-items-center p-10 text-center border-dashed border border-white/[0.12] bg-white/[0.01] rounded-2xl">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.04] border border-white/[0.08] text-xl text-slate-400 mb-3 shadow-inner">
        📂
      </div>
      <h3 className="text-sm font-bold text-white font-display">{title}</h3>
      {children && <p className="mt-1 max-w-sm text-xs text-slate-400 font-normal leading-relaxed">{children}</p>}
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] bg-slate-950/40 px-5 py-3.5 gap-2 backdrop-blur-md">
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
    bg: "bg-emerald-500/10",
    text: "text-emerald-300",
    border: "border-emerald-500/25",
    dot: "bg-emerald-400",
  },
  red: {
    bg: "bg-rose-500/10",
    text: "text-rose-300",
    border: "border-rose-500/25",
    dot: "bg-rose-400",
  },
  amber: {
    bg: "bg-sky-500/10",
    text: "text-sky-300",
    border: "border-sky-500/25",
    dot: "bg-sky-400",
  },
  blue: {
    bg: "bg-brand-500/10",
    text: "text-brand-300",
    border: "border-brand-500/25",
    dot: "bg-brand-400",
  },
  slate: {
    bg: "bg-white/[0.05]",
    text: "text-slate-300",
    border: "border-white/[0.1]",
    dot: "bg-slate-400",
  },
  indigo: {
    bg: "bg-indigo-500/10",
    text: "text-indigo-300",
    border: "border-indigo-500/25",
    dot: "bg-indigo-400",
  },
  purple: {
    bg: "bg-purple-500/10",
    text: "text-purple-300",
    border: "border-purple-500/25",
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
