import type { Plan } from "@prisma/client";
import { formatDate } from "@/lib/format";
import { AdminPlanSelect } from "./AdminPlanSelect";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  plan: Plan;
  transactionCount: number;
};

export function RecentUsersTable({ users }: { users: AdminUserRow[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-semibold text-slate-800">Pengguna Terbaru</p>
        <p className="text-xs text-slate-400">{users.length} terbaru</p>
      </div>

      {users.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">Belum ada pengguna terdaftar</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wide text-slate-400">
                <th className="pb-2 pr-4">Nama</th>
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Bergabung</th>
                <th className="pb-2 pr-4">Paket</th>
                <th className="pb-2 text-right">Transaksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-2.5 pr-4 font-medium text-slate-800">{u.name}</td>
                  <td className="py-2.5 pr-4 text-slate-500">{u.email}</td>
                  <td className="py-2.5 pr-4 whitespace-nowrap text-slate-500">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="py-2.5 pr-4">
                    <AdminPlanSelect userId={u.id} plan={u.plan} />
                  </td>
                  <td className="py-2.5 text-right font-medium text-slate-700">
                    {u.transactionCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
