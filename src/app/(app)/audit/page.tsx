import { getAuthContext } from "@/lib/auth/context";
import { assertCan } from "@/lib/permissions/engine";
import { db } from "@/lib/db";
import { PageHeader, Empty, Badge } from "@/components/ui";
import { fmtDate } from "@/lib/dates";

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ module?: string }> }) {
  const ctx = (await getAuthContext())!;
  assertCan(ctx, "admin", "audit", "view");
  const sp = await searchParams;

  const [logs, modules] = await Promise.all([
    db.auditLog.findMany({
      where: { schoolId: ctx.schoolId, ...(sp.module ? { module: sp.module } : {}) },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.auditLog.findMany({ where: { schoolId: ctx.schoolId }, distinct: ["module"], select: { module: true } }),
  ]);

  return (
    <div>
      <PageHeader title="Audit Log" subtitle="Immutable record of critical actions" />
      <div className="mb-4 flex flex-wrap gap-2">
        <a href="/audit" className={`badge ${!sp.module ? "bg-brand-600 text-white" : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"}`}>All</a>
        {modules.map((m) => (
          <a key={m.module} href={`/audit?module=${m.module}`} className={`badge ${sp.module === m.module ? "bg-brand-600 text-white" : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"}`}>{m.module}</a>
        ))}
      </div>

      {logs.length === 0 ? (
        <Empty>No audit entries recorded yet.</Empty>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/90 border-b border-slate-800"><tr><th className="th">When</th><th className="th">Actor</th><th className="th">Action</th><th className="th">Summary</th></tr></thead>
            <tbody className="divide-y divide-slate-800">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="td whitespace-nowrap text-xs text-slate-400">{fmtDate(l.createdAt)}</td>
                  <td className="td font-medium text-white">{l.actorName ?? "system"}</td>
                  <td className="td"><Badge color="blue">{l.action}</Badge></td>
                  <td className="td text-slate-300">{l.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
