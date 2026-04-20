"use client";

import { useState } from "react";
import { Download, FileText, Table2, Image, File, Loader2 } from "lucide-react";

type BumpFile = {
  storage_path?: string;
  filename: string;
  size_bytes?: number;
};

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return FileText;
  if (ext === "xlsx" || ext === "xls" || ext === "csv") return Table2;
  if (ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "webp") return Image;
  return File;
}

function formatSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MateriaisClient({ files }: { files: BumpFile[] }) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleDownload(file: BumpFile) {
    if (!file.storage_path) return;
    setLoading(file.filename);

    try {
      const res = await fetch(`/api/materiais/download?path=${encodeURIComponent(file.storage_path)}`);
      const data = await res.json();

      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch {
      alert("Erro ao gerar link de download. Tente novamente.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="divide-y divide-white/5">
      {files.map((file) => {
        const Icon = getFileIcon(file.filename);
        const size = formatSize(file.size_bytes);

        return (
          <button
            key={file.filename}
            onClick={() => handleDownload(file)}
            disabled={loading === file.filename || !file.storage_path}
            className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-white/[0.03] transition-colors disabled:opacity-50"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{file.filename}</p>
              {size && <p className="text-xs text-slate-500">{size}</p>}
            </div>
            {loading === file.filename ? (
              <Loader2 className="h-4 w-4 text-slate-400 animate-spin shrink-0" />
            ) : (
              <Download className="h-4 w-4 text-slate-400 shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
}
