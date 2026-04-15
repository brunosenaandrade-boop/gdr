#!/usr/bin/env python3
"""
Comprime PDF reduzindo resolução de imagens embutidas.
Preserva texto e vetores.

Uso:
    python scripts/compress-pdf.py <input.pdf> <output.pdf> [dpi]

Padrão: dpi = 150 (bom equilíbrio qualidade/tamanho).
Pra mais compressão: dpi = 100.
"""
import sys
from io import BytesIO
from pathlib import Path

try:
    import pypdf
    from PIL import Image
except ImportError:
    print("Instale: pip install pypdf pillow", file=sys.stderr)
    sys.exit(1)


def compress_pdf(input_path: str, output_path: str, target_dpi: int = 150) -> None:
    reader = pypdf.PdfReader(input_path)
    writer = pypdf.PdfWriter()

    total_images = 0
    reduced = 0

    for page_num, page in enumerate(reader.pages):
        # Tentar reduzir imagens embutidas
        for img in page.images:
            total_images += 1
            try:
                pil = Image.open(BytesIO(img.data))
                orig_w, orig_h = pil.size

                # Estimar DPI a partir do tamanho (assumindo página A4)
                # A4 = 210 x 297 mm; em polegadas ~ 8.27 x 11.69
                est_dpi = max(orig_w / 8.27, orig_h / 11.69)

                if est_dpi <= target_dpi * 1.1:
                    continue  # Já está ok

                scale = target_dpi / est_dpi
                new_w = int(orig_w * scale)
                new_h = int(orig_h * scale)

                if new_w < 50 or new_h < 50:
                    continue  # Imagem muito pequena, nao mexe

                resized = pil.resize((new_w, new_h), Image.LANCZOS)

                # Salva como JPEG com qualidade 75 se não tem alpha
                if pil.mode in ("RGBA", "LA"):
                    buf = BytesIO()
                    resized.save(buf, format="PNG", optimize=True)
                else:
                    buf = BytesIO()
                    resized.convert("RGB").save(buf, format="JPEG", quality=75, optimize=True)

                new_data = buf.getvalue()
                if len(new_data) < len(img.data):
                    img.replace(resized, quality=75)
                    reduced += 1
            except Exception as e:
                # Algumas imagens não podem ser editadas; ignora
                pass

        writer.add_page(page)

    # Compressão geral de streams
    for page in writer.pages:
        page.compress_content_streams(level=9)

    with open(output_path, "wb") as f:
        writer.write(f)

    orig_size = Path(input_path).stat().st_size
    new_size = Path(output_path).stat().st_size
    pct = 100 * (1 - new_size / orig_size)

    print(f"Imagens totais: {total_images}")
    print(f"Imagens reduzidas: {reduced}")
    print(f"Tamanho original: {orig_size / (1024*1024):.2f} MB")
    print(f"Tamanho comprimido: {new_size / (1024*1024):.2f} MB")
    print(f"Redução: {pct:.1f}%")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    dpi = int(sys.argv[3]) if len(sys.argv) > 3 else 150
    compress_pdf(input_path, output_path, dpi)
