import { getCashFlow } from "@/lib/supabase/queries";
import { FluxoCaixaClient } from "./client";

type Props = {
  searchParams: Promise<{ days?: string }>;
};

export default async function FluxoCaixaPage({ searchParams }: Props) {
  const params = await searchParams;
  const days = parseInt(params.days ?? "30");
  const data = await getCashFlow(days);

  return <FluxoCaixaClient data={data} currentDays={days} />;
}
