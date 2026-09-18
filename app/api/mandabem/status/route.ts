import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json() as { id?: number; refId?: string; envioId?: string; label?: string };
  const platformId = process.env.MANDABEM_PLATFORM_ID;
  const platformKey = process.env.MANDABEM_PLATFORM_KEY;
  if (!platformId || !platformKey) return NextResponse.json({ error: "Credenciais do Manda Bem não configuradas." }, { status: 503 });
  if (!body.refId && !body.envioId && !body.label) return NextResponse.json({ error: "Informe a etiqueta, referência ou o ID do envio." }, { status: 400 });
  try {
    const params = new URLSearchParams({ plataforma_id: platformId, plataforma_chave: platformKey });
    let endpoint = "https://mandabem.com.br/ws/envio";
    if (body.envioId) params.set("id", body.envioId); else if (body.refId) params.set("ref_id", body.refId); else { endpoint = "https://mandabem.com.br/ws/envios"; const end = new Date(); const start = new Date(); start.setDate(start.getDate() - 120); params.set("start_date", start.toISOString().slice(0,10)); params.set("end_date", end.toISOString().slice(0,10)); }
    const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: params, cache: "no-store" });
    const data = await response.json();
    const result = data?.resultado;
    const shipment = body.label ? (Array.isArray(result?.dados) ? result.dados.find((item:any)=>String(item?.etiqueta||"").toLowerCase()===body.label!.trim().toLowerCase()) : null) : result?.dados;
    if (body.label && !shipment) return NextResponse.json({ error: "Etiqueta não encontrada nos envios recentes do Manda Bem." }, { status: 404 });
    if (!response.ok || result?.sucesso === "false" || result?.sucesso === false) return NextResponse.json({ error: result?.erro || result?.mensagem || "O Manda Bem não encontrou esse envio." }, { status: 502 });
    const status = String(shipment?.status || "");
    const posted = status.toLowerCase() === "objeto postado";
    return NextResponse.json({ posted, status: status || "Não informado", label: shipment?.etiqueta || null, envioId: shipment?.envio_id || body.envioId || null, checkedAt: new Date().toISOString() });
  } catch { return NextResponse.json({ error: "Não foi possível consultar o Manda Bem agora." }, { status: 502 }); }
}
