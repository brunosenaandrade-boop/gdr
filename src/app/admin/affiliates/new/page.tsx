import { AdminShell } from "../../layout";
import { NewAffiliateForm } from "./form-client";

export const metadata = {
  title: "Novo afiliado — Admin",
};

export default function NewAffiliatePage() {
  return (
    <AdminShell>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Novo afiliado</h1>
          <p className="text-sm text-zinc-400">
            Cria conta de login e cadastra o afiliado no sistema
          </p>
        </div>
        <NewAffiliateForm />
      </div>
    </AdminShell>
  );
}
