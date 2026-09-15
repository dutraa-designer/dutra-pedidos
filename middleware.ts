import { NextRequest, NextResponse } from "next/server";
export function middleware(req:NextRequest){const path=req.nextUrl.pathname;if(path.startsWith("/_next")||path==="/login"||path==="/api/login"||path==="/favicon.svg")return NextResponse.next();if(!req.cookies.get("dutra_session"))return path.startsWith("/api/")?NextResponse.json({error:"Não autenticado"},{status:401}):NextResponse.redirect(new URL("/login",req.url));return NextResponse.next()}
export const config={matcher:["/((?!.*\\.).*)"]};
