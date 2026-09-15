import { sql } from "drizzle-orm";
import { getDb } from "../../../db";

async function prepare() {
  await getDb().execute(sql`CREATE TABLE IF NOT EXISTS payments (id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, piece_id integer NOT NULL REFERENCES pieces(id) ON DELETE CASCADE, amount real NOT NULL, paid_at text NOT NULL, created_at text NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
  await getDb().execute(sql`ALTER TABLE payments ADD COLUMN IF NOT EXISTS note text`);
}

export async function GET() {
  try { await prepare(); const rows = await getDb().execute(sql`SELECT id, piece_id AS "pieceId", amount, paid_at AS "paidAt", note FROM payments ORDER BY paid_at DESC, id DESC`); return Response.json({ payments: rows.rows }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Não foi possível carregar pagamentos." }, { status: 500 }); }
}

export async function POST(request: Request) {
  try { await prepare(); const body = await request.json() as { pieceId?: number; amount?: number; paidAt?: string; note?: string }; const pieceId = Number(body.pieceId); const amount = Number(body.amount); const paidAt = typeof body.paidAt === "string" ? body.paidAt : ""; const note = typeof body.note === "string" ? body.note.trim().slice(0, 240) : ""; if (!pieceId || !Number.isFinite(amount) || amount <= 0 || !paidAt) return Response.json({ error: "Informe pedido, valor e data." }, { status: 400 }); const rows = await getDb().execute(sql`INSERT INTO payments (piece_id, amount, paid_at, note) VALUES (${pieceId}, ${amount}, ${paidAt}, ${note || null}) RETURNING id, piece_id AS "pieceId", amount, paid_at AS "paidAt", note`); await getDb().execute(sql`UPDATE pieces SET paid_value = COALESCE(paid_value, 0) + ${amount}, updated_at = ${new Date().toISOString()} WHERE id = ${pieceId}`); return Response.json({ payment: rows.rows[0] }, { status: 201 }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Não foi possível registrar o pagamento." }, { status: 400 }); }
}
