"use client";

import { useRef, useState, type ReactNode } from "react";
import { CheckCircle2, FileText, Film, Image as ImageIcon, Music, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadedFile {
  name: string;
  progress: number;
}

export function FileUploader({
  label,
  accept,
  icon = "file",
  hint,
  className,
}: {
  label: string;
  accept?: string;
  icon?: "video" | "audio" | "image" | "doc" | "file";
  hint?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const icons = { video: Film, audio: Music, image: ImageIcon, doc: FileText, file: FileText };
  const Icon = icons[icon];

  const addFiles = (names: string[]) => {
    const next = names.map((name) => ({ name, progress: 0 }));
    setFiles((prev) => [...prev, ...next]);
    next.forEach((f, i) => {
      setTimeout(() => {
        setFiles((prev) =>
          prev.map((p) => (p.name === f.name ? { ...p, progress: 100 } : p))
        );
      }, 900 + i * 500);
    });
  };

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={0}
        aria-label={label}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(Array.from(e.dataTransfer.files).map((f) => f.name));
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition-colors",
          dragOver ? "border-accent bg-accent-dim" : "border-line-strong bg-surface-alt hover:border-white/25"
        )}
      >
        <Icon aria-hidden="true" className="h-5 w-5 text-accent" />
        <p className="text-sm font-medium text-fg">{label}</p>
        <p className="text-xs text-faint">{hint ?? "Drag and drop or click to browse"}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        hidden
        onChange={(e) => {
          addFiles(Array.from(e.target.files ?? []).map((f) => f.name));
          e.target.value = "";
        }}
      />
      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((f) => (
            <li key={f.name} className="flex items-center gap-2.5 text-xs">
              {f.progress === 100 ? (
                <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-accent" />
              ) : (
                <UploadCloud aria-hidden="true" className="h-3.5 w-3.5 shrink-0 animate-pulse text-muted" />
              )}
              <span className="flex-1 truncate text-fg">{f.name}</span>
              <div className="h-1 w-20 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-700"
                  style={{ width: `${f.progress}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function UrlInputRow({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="url"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="h-10 w-full rounded-xl border border-line bg-surface-alt px-3.5 text-sm text-fg placeholder:text-faint focus:border-accent/60 focus:outline-none"
    />
  );
}

export function UploadGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}
