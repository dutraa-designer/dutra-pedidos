import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "node:crypto";

export async function POST(request:Request){
  const {password}=await request.json();
  const configuredPassword=process.env.INTERNAL_PASSWORD;
  if(!configuredPassword)return Response.json({error:"Senha financeira não configurada."},{status:503});
  const received=createHash("sha256").update(String(password||"")).digest("hex");
  const expected=createHash("sha256").update(configuredPassword).digest("hex");
  const ok=timingSafeEqual(Buffer.from(received),Buffer.from(expected));
  if(!ok)return Response.json({error:"Senha financeira inválida."},{status:401});
  (await cookies()).set("dutra_internal_session","1",{httpOnly:true,secure:true,sameSite:"lax",path:"/controle-interno",maxAge:60*60*12});
  return Response.json({ok:true});
}
