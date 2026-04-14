"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { admin2FASetupConfirm } from "@/lib/admin/actions";
import { ShieldCheck, Smartphone, Key, Copy, CheckCheck, AlertTriangle } from "lucide-react";

type Props = {
  email: string;
  totpEnabled: boolean;
  qrDataUri: string | null;
  secret: string | null;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  recoveryCodesCount: number;
};

export function SecurityClient({
  email,
  totpEnabled,
  qrDataUri,
  secret,
  lastLoginAt,
  lastLoginIp,
  recoveryCodesCount,
}: Props) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await admin2FASetupConfirm(code);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setRecoveryCodes(res.recoveryCodes);
    });
  }

  function handleCopySecret() {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  }

  function handleFinish() {
    router.push("/admin");
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">Segurança da conta</h1>
        <p className="text-sm text-zinc-400">Proteja seu acesso administrativo com 2FA</p>
      </div>

      {/* Info da conta */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h2 className="text-sm font-medium mb-3">Conta</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500">Email</dt>
            <dd className="font-mono">{email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">Último login</dt>
            <dd>
              {lastLoginAt ? new Date(lastLoginAt).toLocaleString("pt-BR") : "—"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">IP do último login</dt>
            <dd className="font-mono text-xs">{lastLoginIp ?? "—"}</dd>
          </div>
        </dl>
      </div>

      {/* 2FA */}
      {totpEnabled ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-emerald-300">2FA ativo</h2>
              <p className="text-sm text-zinc-400 mt-1">
                Seu acesso admin está protegido com autenticação de dois fatores.
              </p>
              <div className="mt-4 text-sm">
                <span className="text-zinc-500">Códigos de recuperação restantes: </span>
                <span className="font-mono">{recoveryCodesCount}</span>
                {recoveryCodesCount < 3 && (
                  <span className="ml-2 text-xs text-amber-400">
                    <AlertTriangle className="inline h-3 w-3" /> Considere gerar novos códigos
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : recoveryCodes ? (
        // Passo 3: Mostrar códigos de recuperação
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-emerald-300">✅ 2FA ativado com sucesso!</h2>
              <p className="text-sm text-zinc-300 mt-2">
                Guarde estes <strong>códigos de recuperação</strong> em local seguro. Você pode usá-los
                uma única vez cada se perder acesso ao seu autenticador:
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-sm">
                {recoveryCodes.map((c, i) => (
                  <div
                    key={i}
                    className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-center"
                  >
                    {c}
                  </div>
                ))}
              </div>
              <div className="mt-5 p-3 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-200">
                ⚠️ Esses códigos só aparecem <strong>uma vez</strong>. Copie e guarde em lugar seguro
                (gerenciador de senhas, papel offline, etc).
              </div>
              <button
                onClick={handleFinish}
                className="mt-5 w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg"
              >
                Já guardei, ir para o painel
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Passo 1 + 2: QR code e confirmação
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold">Ativar 2FA (autenticação de dois fatores)</h2>
              <p className="text-sm text-zinc-400 mt-1">
                Use Google Authenticator, Authy ou 1Password pra proteger seu acesso.
              </p>
            </div>
          </div>

          {/* Step 1 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-300">
              1. Escaneie o QR code com seu app autenticador
            </h3>
            {qrDataUri ? (
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="bg-white p-3 rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUri} alt="QR code 2FA" className="w-48 h-48" />
                </div>
                <div className="flex-1 text-sm text-zinc-400 space-y-2">
                  <p>Ou insira manualmente esse código secreto no app:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs font-mono break-all">
                      {secret}
                    </code>
                    <button
                      onClick={handleCopySecret}
                      className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded"
                      aria-label="Copiar"
                    >
                      {copiedSecret ? (
                        <CheckCheck className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Recomendado: Google Authenticator, Authy, 1Password, Bitwarden
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-red-400">Erro ao gerar QR code. Recarregue a página.</p>
            )}
          </div>

          {/* Step 2 */}
          <form onSubmit={handleConfirm} className="space-y-3 border-t border-zinc-800 pt-5">
            <h3 className="text-sm font-medium text-zinc-300">
              2. Digite o código de 6 dígitos que o app gerou
            </h3>
            <div className="relative max-w-xs">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                autoFocus
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2.5 text-lg font-mono tracking-[0.3em] text-center focus:border-red-500 focus:outline-none"
                placeholder="000000"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={pending || code.length < 6}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium rounded-lg"
            >
              {pending ? "Ativando..." : "Ativar 2FA"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
