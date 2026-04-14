import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { AdminShell } from "../../../layout";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ page?: string }>;

export default async function AdminUserConversationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam ?? "1", 10);
  const perPage = 50;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const supabase = await createServiceClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("name")
    .eq("id", id)
    .maybeSingle();

  const { data: messages, count } = await supabase
    .from("whatsapp_conversation_log")
    .select("*", { count: "exact" })
    .eq("tenant_id", id)
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = Math.ceil((count ?? 0) / perPage);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <Link
            href={`/admin/users/${id}`}
            className="text-sm text-zinc-400 hover:text-white"
          >
            ← Voltar para o usuário
          </Link>
          <h1 className="text-2xl font-semibold mt-2">
            Conversas — {tenant?.name ?? "?"}
          </h1>
          <p className="text-sm text-zinc-400">{count ?? 0} mensagens registradas</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-xs text-zinc-400 uppercase">
              <tr>
                <th className="text-left p-3 w-24">Direção</th>
                <th className="text-left p-3 w-24">Tipo</th>
                <th className="text-left p-3">Conteúdo</th>
                <th className="text-left p-3 w-44">Quando</th>
              </tr>
            </thead>
            <tbody>
              {(messages ?? []).map((m) => (
                <tr key={m.id} className="border-t border-zinc-800 align-top">
                  <td className="p-3">
                    {m.direction === "in" ? (
                      <span className="inline-block px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs">
                        ← IN
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-xs">
                        OUT →
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-xs uppercase text-zinc-400">{m.message_type}</td>
                  <td className="p-3 whitespace-pre-wrap text-zinc-200">{m.content}</td>
                  <td className="p-3 text-xs text-zinc-500">
                    {m.created_at
                      ? new Date(m.created_at).toLocaleString("pt-BR")
                      : "—"}
                  </td>
                </tr>
              ))}
              {(messages ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-500">
                    Nenhuma mensagem registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-zinc-400">
            <span>
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/users/${id}/conversations?page=${page - 1}`}
                  className="px-3 py-1.5 border border-zinc-800 rounded-lg hover:bg-white/5"
                >
                  ← Anterior
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/users/${id}/conversations?page=${page + 1}`}
                  className="px-3 py-1.5 border border-zinc-800 rounded-lg hover:bg-white/5"
                >
                  Próxima →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
