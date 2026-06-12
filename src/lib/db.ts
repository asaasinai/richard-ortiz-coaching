// Lightweight Neon HTTP client — no native pg binaries required on Vercel edge
const NEON_URL = process.env.DATABASE_URL!

interface QueryResult<T = Record<string, unknown>> {
  rows: T[]
  rowCount: number | null
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: (string | number | boolean | null)[]
): Promise<QueryResult<T>> {
  const body: Record<string, unknown> = { query: sql }
  if (params?.length) body.params = params

  const res = await fetch(`${process.env.NEON_HOST}/sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Neon-Connection-String": NEON_URL,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`DB error: ${err}`)
  }

  return res.json() as Promise<QueryResult<T>>
}
