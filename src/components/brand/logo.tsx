/**
 * Brand mark oficial do Guarda Dinheiro — círculo emerald + escudo branco + dot.
 *
 * Mesmo visual do favicon (src/app/icon.tsx), apple-icon (src/app/apple-icon.tsx),
 * foto de perfil do WhatsApp e template de confirmação de email.
 * Use este componente SEMPRE que precisar da marca — não usar `<Shield>` do
 * lucide-react como brand mark (shape heráldico diferente).
 *
 * Proporções derivadas do canvas canônico 32×32 e escalam linearmente.
 */
type LogoProps = {
  /** Diâmetro do círculo em px. Default 24. */
  size?: number;
  /** Renderiza o texto "Guarda Dinheiro" ao lado. */
  withText?: boolean;
  /** Classe custom pro texto (quando withText). Default branco + semibold. */
  textClassName?: string;
  /** Classe no wrapper externo. */
  className?: string;
  /** Sombra emerald. Default `true` pra tamanhos ≥ 32px. */
  glow?: boolean;
};

export function Logo({
  size = 24,
  withText = false,
  textClassName,
  className,
  glow,
}: LogoProps) {
  const shieldW = size * 0.5;
  const shieldH = size * 0.5625;
  const borderW = Math.max(1, Math.round(size / 16));
  const topR = Math.max(1, Math.round(size * 0.09));
  const bottomR = Math.max(3, Math.round(size * 0.25));
  const dotSize = Math.max(2, Math.round(size * 0.1875));
  const showGlow = glow ?? size >= 32;

  return (
    <span
      className={`inline-flex items-center gap-2 ${className ?? ""}`}
      aria-label="Guarda Dinheiro"
    >
      <span
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #34D399 0%, #10B981 50%, #059669 100%)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: showGlow
            ? `0 0 ${Math.round(size * 0.6)}px rgba(16, 185, 129, 0.35)`
            : undefined,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            width: shieldW,
            height: shieldH,
            border: `${borderW}px solid #ffffff`,
            borderRadius: `${topR}px ${topR}px ${bottomR}px ${bottomR}px`,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
          }}
        >
          <span
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: "50%",
              background: "#ffffff",
              display: "inline-block",
            }}
          />
        </span>
      </span>
      {withText && (
        <span
          className={
            textClassName ??
            "text-sm font-semibold tracking-tight text-white"
          }
        >
          Guarda Dinheiro
        </span>
      )}
    </span>
  );
}
