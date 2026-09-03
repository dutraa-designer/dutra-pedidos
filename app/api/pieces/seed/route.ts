import { sql } from "drizzle-orm";
import { getDb } from "../../../../db";
import { pieces } from "../../../../db/schema";

const starterPieces = [
  { code: 1, description: "PINGENTE LETRA M", quantity: 1, productionStatus: "FINALIZADO", productionValue: 35, bathStatus: "FINALIZADO", bathValue: 554.1, shippingStatus: "ENVIO", transportValue: 15, mailStatus: "ENVIADO", billingStatus: "OK", notes: "VALORES REF. AOS BANHOS DE CORRENTES E ARGOLAS INCLUSAS" },
  { code: 2, description: "PINGENTE MULHER FLORES", quantity: 1, productionStatus: "FINALIZADO", productionValue: 35, bathStatus: "FINALIZADO", bathValue: 0, shippingStatus: "ENVIO", transportValue: 15, mailStatus: "ENVIADO", billingStatus: "OK", notes: "VALORES REF. AOS BANHOS DE CORRENTES E ARGOLAS INCLUSAS" },
  { code: 3, description: "PINGENTE CACHORRO", quantity: 1, productionStatus: "FINALIZADO", productionValue: 35, bathStatus: "FINALIZADO", bathValue: 25.94, shippingStatus: "ENVIO", transportValue: 0, mailStatus: "ENVIADO" },
  { code: 4, description: "PINGENTE MULHER MARAVILHA (20 MILESIMOS)", quantity: 1, productionStatus: "FINALIZADO", productionValue: 35, bathStatus: "FINALIZADO", bathValue: 29.66, shippingStatus: "ENVIO", transportValue: 15, mailStatus: "NÃO ENVIADO" },
  { code: 5, description: "PINGENTE MULHER MARAVILHA + CORRENTE (RODIO)", quantity: 1, productionStatus: "EM PRODUÇÃO", productionValue: 35 },
  { code: 6, description: "PINGENTE KS (15 MILESIMOS)", quantity: 1, productionStatus: "FINALIZADO", productionValue: 35, bathStatus: "FINALIZADO" },
  { code: 7, description: "PINGENTE CONTABILIDADE", quantity: 1, productionStatus: "FINALIZADO", productionValue: 35, bathStatus: "FINALIZADO" },
  { code: 8, description: "PINGENTE FLOR DOS DESBRAVADORES", quantity: 1, productionStatus: "EM PRODUÇÃO", productionValue: 35 },
  { code: 9, description: "PINGENTE U.B (20 MILESIMOS)", quantity: 1, productionStatus: "EM PRODUÇÃO", productionValue: 35 },
];

export async function POST() {
  try {
    const db = getDb();
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(pieces);
    if (Number(count) > 0) return Response.json({ seeded: false });
    await db.insert(pieces).values(starterPieces);
    return Response.json({ seeded: true, count: starterPieces.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível carregar os dados iniciais.";
    return Response.json({ error: message }, { status: 400 });
  }
}
