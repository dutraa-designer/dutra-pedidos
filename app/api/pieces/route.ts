import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { pieces } from "../../../db/schema";

const allowedStatuses = {
  productionStatus: ["EM PRODUÇÃO", "FINALIZADO", "CANCELADO"],
  bathStatus: ["AGUARDANDO", "EM BANHO", "FINALIZADO"],
  shippingStatus: ["ENVIO", "RETIRADA"],
  bathSendStatus: ["PENDENTE", "ENVIADO"],
  bathReturnStatus: ["PENDENTE", "RECEBIDO"],
  mailStatus: ["NÃO ENVIADO", "ENVIADO"],
  billingStatus: ["PENDENTE", "OK"],
} as const;

async function ensureMaterialColumns() { await getDb().execute(sql`ALTER TABLE pieces ADD COLUMN IF NOT EXISTS gold_gram_value real`); await getDb().execute(sql`ALTER TABLE pieces ADD COLUMN IF NOT EXISTS gold_factor real`); await getDb().execute(sql`ALTER TABLE pieces ADD COLUMN IF NOT EXISTS custom_material text`); await getDb().execute(sql`ALTER TABLE pieces ADD COLUMN IF NOT EXISTS mail_posted_confirmed integer NOT NULL DEFAULT 0`); await getDb().execute(sql`ALTER TABLE pieces ADD COLUMN IF NOT EXISTS mail_posted_at text`); }

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : null;
}

function cleanNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function validatePayload(payload: Record<string, unknown>, partial = false) {
  const description = cleanText(payload.description);
  if (!partial && !description) throw new Error("Informe a descrição da peça.");
  if (description && description.length > 160) throw new Error("A descrição é muito longa.");

  for (const [field, values] of Object.entries(allowedStatuses)) {
    if (payload[field] && !values.includes(payload[field] as never)) {
      throw new Error(`Valor inválido em ${field}.`);
    }
  }

  return {
    ...(description !== null ? { description } : {}),
    ...(payload.code !== undefined ? { code: Math.max(1, Math.floor(cleanNumber(payload.code, 1))) } : {}),
    ...(payload.quantity !== undefined ? { quantity: Math.max(1, Math.floor(cleanNumber(payload.quantity, 1))) } : {}),
    ...(payload.material !== undefined ? { material: cleanText(payload.material) ?? "Sem prata maciça" } : {}),
    ...(payload.weightGrams !== undefined ? { weightGrams: payload.weightGrams === "" || payload.weightGrams === null ? null : Math.max(0, cleanNumber(payload.weightGrams)) } : {}),
    ...(payload.silverGramValue !== undefined ? { silverGramValue: payload.silverGramValue === "" || payload.silverGramValue === null ? null : Math.max(0, cleanNumber(payload.silverGramValue)) } : {}),
    ...(payload.goldGramValue !== undefined ? { goldGramValue: payload.goldGramValue === "" || payload.goldGramValue === null ? null : Math.max(0, cleanNumber(payload.goldGramValue)) } : {}),
    ...(payload.goldFactor !== undefined ? { goldFactor: payload.goldFactor === "" || payload.goldFactor === null ? null : Math.max(0, cleanNumber(payload.goldFactor)) } : {}),
    ...(payload.customMaterial !== undefined ? { customMaterial: cleanText(payload.customMaterial) } : {}),
    ...(typeof payload.createdAt === "string" && payload.createdAt.trim() ? { createdAt: payload.createdAt.trim() } : {}),
    ...(payload.productionStatus !== undefined ? { productionStatus: cleanText(payload.productionStatus) ?? "EM PRODUÇÃO" } : {}),
    ...(payload.productionValue !== undefined ? { productionValue: Math.max(0, cleanNumber(payload.productionValue)) } : {}),
    ...(payload.bathStatus !== undefined ? { bathStatus: cleanText(payload.bathStatus) } : {}),
    ...(payload.bathValue !== undefined ? { bathValue: payload.bathValue === "" || payload.bathValue === null ? null : Math.max(0, cleanNumber(payload.bathValue)) } : {}),
    ...(payload.shippingStatus !== undefined ? { shippingStatus: cleanText(payload.shippingStatus) } : {}),
    ...(payload.transportValue !== undefined ? { transportValue: payload.transportValue === "" || payload.transportValue === null ? null : Math.max(0, cleanNumber(payload.transportValue)) } : {}),
    ...(payload.bathSendStatus !== undefined ? { bathSendStatus: cleanText(payload.bathSendStatus) } : {}),
    ...(payload.bathSendValue !== undefined ? { bathSendValue: payload.bathSendValue === "" || payload.bathSendValue === null ? null : Math.max(0, cleanNumber(payload.bathSendValue)) } : {}),
    ...(payload.bathReturnStatus !== undefined ? { bathReturnStatus: cleanText(payload.bathReturnStatus) } : {}),
    ...(payload.bathReturnValue !== undefined ? { bathReturnValue: payload.bathReturnValue === "" || payload.bathReturnValue === null ? null : Math.max(0, cleanNumber(payload.bathReturnValue)) } : {}),
    ...(payload.mailValue !== undefined ? { mailValue: payload.mailValue === "" || payload.mailValue === null ? null : Math.max(0, cleanNumber(payload.mailValue)) } : {}),
    ...(payload.mailStatus !== undefined ? { mailStatus: cleanText(payload.mailStatus) } : {}),
    ...(payload.mailPostedConfirmed !== undefined ? { mailPostedConfirmed: payload.mailPostedConfirmed ? 1 : 0 } : {}),
    ...(payload.mailPostedAt !== undefined ? { mailPostedAt: cleanText(payload.mailPostedAt) } : {}),
    ...(payload.billingStatus !== undefined ? { billingStatus: cleanText(payload.billingStatus) } : {}),
    ...(payload.photoKey !== undefined ? { photoKey: cleanText(payload.photoKey) } : {}),
    ...(payload.paidValue !== undefined ? { paidValue: payload.paidValue === "" || payload.paidValue === null ? 0 : Math.max(0, cleanNumber(payload.paidValue)) } : {}),
    ...(payload.notes !== undefined ? { notes: cleanText(payload.notes) } : {}),
    updatedAt: new Date().toISOString(),
  };
}

function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Não foi possível concluir a operação.";
  if (message.includes("no such table")) return "O banco ainda não foi preparado. Publique novamente para aplicar a estrutura.";
  return message;
}

export async function GET() {
  try { await ensureMaterialColumns();
    const rows = await getDb().select().from(pieces).orderBy(desc(pieces.code), desc(pieces.id));
    return Response.json({ pieces: rows });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try { await ensureMaterialColumns();
    const payload = (await request.json()) as Record<string, unknown>;
    const values = validatePayload(payload);
    const [piece] = await getDb().insert(pieces).values(values as any).returning();
    return Response.json({ piece }, { status: 201 });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try { await ensureMaterialColumns();
    const payload = (await request.json()) as Record<string, unknown>;
    const id = Math.floor(cleanNumber(payload.id, 0));
    if (!id) return Response.json({ error: "ID inválido." }, { status: 400 });
    const values = validatePayload(payload, true);
    const [piece] = await getDb().update(pieces).set(values).where(eq(pieces.id, id)).returning();
    if (!piece) return Response.json({ error: "Peça não encontrada." }, { status: 404 });
    return Response.json({ piece });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = (await request.json()) as { id?: number };
    const id = Math.floor(cleanNumber(payload.id, 0));
    if (!id) return Response.json({ error: "ID inválido." }, { status: 400 });
    await getDb().delete(pieces).where(eq(pieces.id, id));
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 400 });
  }
}
