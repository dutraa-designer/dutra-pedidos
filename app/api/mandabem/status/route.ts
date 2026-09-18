import { NextResponse } from "next/server";

function shipmentList(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  const object = value as Record<string, unknown>;
  if ("etiqueta" in object || "envio_id" in object || "destinatario" in object || "status" in object) return [object];
  for (const key of ["envios", "envio", "shipments", "items", "lista", "results", "dados", "data"]) {
    const found = shipmentList(object[key]);
    if (found.length) return found;
  }
  for (const child of Object.values(object)) {
    const found = shipmentList(child);
    if (found.length) return found;
  }
  const values = Object.values(object);
  if (values.length && values.every(item => item && typeof item === "object")) return values as any[];
  return [];
}

function shipmentDate(shipment: any, keys: string[]) {
  for (const key of keys) {
    const value = shipment?.[key];
    if (value) return String(value);
  }
  return null;
}

async function listShipments() {
  const platformId = process.env.MANDABEM_PLATFORM_ID;
  const platformKey = process.env.MANDABEM_PLATFORM_KEY;
  if (!platformId || !platformKey) throw new Error("Credenciais do Manda Bem não configuradas.");
  const end = new Date(); const start = new Date(); start.setDate(start.getDate() - 730);
  const params = new URLSearchParams({ plataforma_id: platformId, plataforma_chave: platformKey, start_date: start.toISOString().slice(0,10), end_date: end.toISOString().slice(0,10) });
  const response = await fetch("https://mandabem.com.br/ws/envios", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: params, cache: "no-store" });
  const raw = await response.text();
  let data: any = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { throw new Error(`Resposta inválida do Manda Bem (${response.status}).`); }
  if (!response.ok || data?.resultado?.sucesso === "false" || data?.resultado?.sucesso === false) throw new Error(data?.resultado?.erro || data?.resultado?.mensagem || `Manda Bem respondeu HTTP ${response.status}.`);
  return shipmentList(data?.resultado?.dados ?? data?.resultado ?? data?.dados ?? data);
}

export async function GET() { try { return NextResponse.json({ shipments: await listShipments() }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível carregar os envios." }, { status: 502 }); } }

export async function POST(request: Request) {
  const body = await request.json() as { id?: number; refId?: string; envioId?: string; label?: string };
  const platformId = process.env.MANDABEM_PLATFORM_ID;
  const platformKey = process.env.MANDABEM_PLATFORM_KEY;
  if (!platformId || !platformKey) return NextResponse.json({ error: "Credenciais do Manda Bem não configuradas." }, { status: 503 });
  if (!body.refId && !body.envioId && !body.label) return NextResponse.json({ error: "Informe a etiqueta, referência ou o ID do envio." }, { status: 400 });
  try {
    const params = new URLSearchParams({ plataforma_id: platformId, plataforma_chave: platformKey });
    let endpoint = "https://mandabem.com.br/ws/envio";
    if (body.envioId) params.set("id", body.envioId); else if (body.refId) params.set("ref_id", body.refId); else { endpoint = "https://mandabem.com.br/ws/envios"; const end = new Date(); const start = new Date(); start.setDate(start.getDate() - 730); params.set("start_date", start.toISOString().slice(0,10)); params.set("end_date", end.toISOString().slice(0,10)); }
    const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: params, cache: "no-store" });
    const raw = await response.text();
    let data: any = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch { throw new Error(`Resposta inválida do Manda Bem (${response.status}).`); }
    const result = data?.resultado;
    const shipments = shipmentList(result?.dados ?? result ?? data?.dados ?? data);
    const shipment = body.label ? shipments.find((item:any)=>String(item?.etiqueta||"").toLowerCase()===body.label!.trim().toLowerCase()) : (shipments[0] || result?.dados);
    if (body.label && !shipment) return NextResponse.json({ error: "Etiqueta não encontrada nos envios recentes do Manda Bem." }, { status: 404 });
    if (!response.ok || result?.sucesso === "false" || result?.sucesso === false) return NextResponse.json({ error: result?.erro || result?.mensagem || `Manda Bem respondeu HTTP ${response.status}.` }, { status: 502 });
    const status = String(shipment?.status || "");
    const posted = status.toLowerCase() === "objeto postado";
    const deliveredAt = shipmentDate(shipment, ["data_entrega", "data_entregue", "entregue_em", "delivered_at", "delivery_date", "data_status"]);
    return NextResponse.json({ posted, status: status || "Não informado", label: shipment?.etiqueta || null, envioId: shipment?.envio_id || body.envioId || null, deliveredAt, checkedAt: new Date().toISOString() });
  } catch { return NextResponse.json({ error: "Não foi possível consultar o Manda Bem agora." }, { status: 502 }); }
}
