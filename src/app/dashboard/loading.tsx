export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <p className="text-xs text-slate-500">Carregando...</p>
      </div>
    </div>
  );
}
