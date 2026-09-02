/**
 * Uploads the file from the client to the server.
 * Receives the File and the endpoint url to post the file to
 * Must return an object with a { storageId: string }
 * @param file - File
 * @param uploadUrl - string upload url for the file to be posted
 * @returns { storageId: string } the id of the storage in the storage adapter
 */
export async function uploadFile(file: File, uploadUrl: string) {
  const res = await fetch(uploadUrl, { method: "POST", body: file });
  if (!res.ok) throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
  const data = (await res.json()) as { storageId: string };
  return { storageId: data.storageId };
}
