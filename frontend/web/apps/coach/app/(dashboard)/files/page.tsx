"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useFilesQuery } from "@/hooks/use-coach-data";
import { coachApi } from "@/lib/api";
import { athletes } from "@/lib/mock-data";

export default function FilesPage() {
  const filesQuery = useFilesQuery();
  const [fileType, setFileType] = useState("all");
  const [athleteId, setAthleteId] = useState("all");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState("");

  const filtered = useMemo(
    () =>
      (filesQuery.data ?? []).filter(
        (file) => (fileType === "all" || file.file_type === fileType) && (athleteId === "all" || file.athlete_id === athleteId)
      ),
    [athleteId, fileType, filesQuery.data]
  );

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Select value={fileType} onChange={(event) => setFileType(event.target.value)}>
            <option value="all">All file types</option>
            <option value="video">Video</option>
            <option value="document">Document</option>
            <option value="medical_report">Medical report</option>
          </Select>
          <Select value={athleteId} onChange={(event) => setAthleteId(event.target.value)}>
            <option value="all">All athletes</option>
            {athletes.map((athlete) => (
              <option key={athlete.id} value={athlete.id}>
                {athlete.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-xl font-bold">Upload new file</h2>
        <div className="rounded-[24px] border border-dashed border-[#AFA9EC] bg-[#EEEDFE] p-8 text-center">
          <p className="text-sm text-[#3C3489]">Drag and drop zone</p>
          <Input value={uploadedName} onChange={(event) => setUploadedName(event.target.value)} placeholder="Enter filename to simulate upload" />
          <Button
            className="mt-4"
            onClick={async () => {
              if (!uploadedName) return;
              const upload = await coachApi.createUploadUrl(uploadedName);
              await coachApi.confirmUpload(upload.fileId);
            }}
          >
            Upload via presigned URL
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((file) => (
          <Card key={file.id} className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{file.original_filename}</p>
                <p className="text-xs text-[#5F5E5A]">{file.file_type}</p>
              </div>
              <Button variant="ghost" onClick={() => setPreviewId(file.id)}>
                Preview
              </Button>
            </div>
            {previewId === file.id ? (
              file.mime_type.includes("image") ? (
                <img src="https://placehold.co/400x220" alt={file.original_filename} className="h-48 w-full rounded-2xl object-cover" />
              ) : file.mime_type.includes("pdf") ? (
                <iframe title={file.original_filename} src="https://example.org/mock.pdf" className="h-48 w-full rounded-2xl" />
              ) : (
                <video controls className="h-48 w-full rounded-2xl bg-black" />
              )
            ) : null}
            <Button
              variant="secondary"
              onClick={async () => {
                const response = await coachApi.downloadUrl(file.id);
                window.open(response.downloadUrl, "_blank");
              }}
            >
              Download
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
