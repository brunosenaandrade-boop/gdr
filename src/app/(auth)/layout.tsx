export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-emerald-500/10 blur-[100px] opacity-50" />
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}
