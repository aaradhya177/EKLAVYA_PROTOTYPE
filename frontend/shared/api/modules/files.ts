import { getClient } from "../client";
import type { FileRecord } from "../../types";

export const requestUploadUrl = async (data: Record<string, unknown>): Promise<{ uploadUrl: string; fileId: string }> =>
  (await getClient().post<{ uploadUrl: string; fileId: string }>("/files/upload-url", data)).data;
export const confirmUpload = async (fileId: string): Promise<FileRecord> => (await getClient().post<FileRecord>(`/files/${fileId}/confirm`)).data;
export const getFiles = async (athleteId: string, params: Record<string, string | number | undefined>): Promise<FileRecord[]> =>
  (await getClient().get<FileRecord[]>(`/files/athletes/${athleteId}`, { params })).data;
export const getDownloadUrl = async (fileId: string): Promise<string> => (await getClient().get<string>(`/files/${fileId}/download-url`)).data;
export const deleteFile = async (fileId: string): Promise<void> => {
  await getClient().delete(`/files/${fileId}`);
};
