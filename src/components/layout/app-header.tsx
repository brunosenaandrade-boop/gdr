type AppHeaderProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
};

export function AppHeader({ title, description, children }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-black/80 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-base font-medium tracking-tight text-white">{title}</h1>
            {description && (
              <p className="text-xs text-slate-500">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {children}
        </div>
      </div>
    </header>
  );
}
