type AppHeaderProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
};

export function AppHeader({ title, description, children }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-black/80 backdrop-blur-xl">
      {/* pl-16 reserva espaço para o hamburguer da sidebar (left-4 w-9 = ~52px) em mobile/tablet */}
      <div className="flex h-14 items-center justify-between gap-4 pl-16 pr-6 lg:pl-6">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-medium tracking-tight text-white">{title}</h1>
            {description && (
              <p className="truncate text-xs text-slate-500">{description}</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {children}
        </div>
      </div>
    </header>
  );
}
