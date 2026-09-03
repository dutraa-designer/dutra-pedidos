import { env } from "cloudflare:workers";

const maxFileSize = 5 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function getBucket() {
  if (!env.BUCKET) throw new Error("O armazenamento de fotos ainda não está disponível.");
  return env.BUCKET;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return Response.json({ error: "Selecione uma imagem." }, { status: 400 });
    if (!allowedTypes.has(file.type)) return Response.json({ error: "Use JPG, PNG, WEBP ou GIF." }, { status: 400 });
    if (file.size > maxFileSize) return Response.json({ error: "A imagem deve ter no máximo 5 MB." }, { status: 400 });

    const extension = file.type.split("/")[1].replace("jpeg", "jpg");
    const key = `pieces/${crypto.randomUUID()}.${extension}`;
    await getBucket().put(key, file.stream(), { httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" } });
    return Response.json({ key });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível enviar a foto.";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  try {
    const key = new URL(request.url).searchParams.get("key");
    if (!key || !key.startsWith("pieces/")) return new Response("Foto não encontrada", { status: 404 });
    const object = await getBucket().get(key);
    if (!object) return new Response("Foto não encontrada", { status: 404 });
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("cache-control", "public, max-age=31536000, immutable");
    return new Response(object.body, { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível abrir a foto.";
    return new Response(message, { status: 400 });
  }
}
