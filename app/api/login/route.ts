import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";
export async function POST(request:Request){const body=await request.json();const u=process.env.APP_USERNAME;const p=process.env.APP_PASSWORD;const ok=typeof u==="string"&&typeof p==="string"&&body.username===u&&body.password===p;if(!ok)return Response.json({error:"Credenciais inválidas"},{status:401});const token=Buffer.from(`${u}:${p}`).toString("base64url");(await cookies()).set("dutra_session",token,{httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:60*60*24*30});return Response.json({ok:true})}
