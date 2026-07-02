import { del } from "@vercel/blob"
import { query } from "@/lib/db"

// Full progress-photo teardown for a client: removes the actual files from
// Vercel Blob (privacy — "delete forever" must include the photos themselves),
// then the index rows. Best-effort on the blob side; rows always go.
export async function deleteClientPhotos(email: string) {
  if (!email) return
  const found = await query<{ url: string }>(
    `SELECT url FROM roc.client_photos WHERE lower(client_email) = lower($1)`,
    [email],
  ).catch(() => ({ rows: [] as { url: string }[] }))
  const urls = found.rows.map(r => r.url).filter(Boolean)
  if (urls.length) await del(urls).catch(err => console.error("[photos] blob delete", err))
  await query(`DELETE FROM roc.client_photos WHERE lower(client_email) = lower($1)`, [email]).catch(() => {})
}
