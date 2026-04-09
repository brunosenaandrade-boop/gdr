"use client";

import UnicornScene from "unicornstudio-react";

export default function UnicornBackground() {
  return (
    <div
      className="absolute top-0 left-0 w-full h-[800px] pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <UnicornScene
        projectId="UxWNkF2YKxhhrSnUhqtR"
        width="100%"
        height="100%"
        scale={1}
        dpi={1.5}
        sdkUrl="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@2.1.6/dist/unicornStudio.umd.js"
      />
      {/* Faixa gradiente que cobre a marca d'água na base */}
      <div
        className="absolute bottom-0 left-0 w-full h-[160px] pointer-events-none"
        style={{
          background: "linear-gradient(to top, #000000 0%, #000000 40%, transparent 100%)",
          zIndex: 99999999,
        }}
      />
    </div>
  );
}
