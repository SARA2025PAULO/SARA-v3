
"use client";

import { FileUploadManager } from "@/components/archivos/FileUploadManager";

export default function ArchivosPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 font-headline">Gestión de Archivos</h1>
      <FileUploadManager />
    </div>
  );
}
