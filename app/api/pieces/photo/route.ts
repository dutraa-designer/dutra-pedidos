import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { photos } from "../../../../db/schema";

const maxFileSize = 5 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return Response.json({ error: "Selecione uma imagem." }, { status: 400 });
    if (!allowedTypes.has(file.type)) return Response.json({ error: "Use JPG, PNG, WEBP ou GIF." }, { status: 400 });
    if (file.size > maxFileSize) return Response.json({ error: "A imagem deve ter no máximo 5 MB." }, { status: 400 });

    const extension = file.type.split("/")[1].replace("jpeg", "jpg");
    const key = `pieces/${crypto.randomUUID()}.${extension}`;
    const data = Buffer.from(await file.arrayBuffer()).toString("base64");
    await getDb().insert(photos).values({ key, contentType: file.type, data });
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
    const [photo] = await getDb().select().from(photos).where(eq(photos.key, key));
    if (!photo) return new Response("Foto não encontrada", { status: 404 });
    return new Response(Buffer.from(photo.data, "base64"), { headers: { "content-type": photo.contentType, "cache-control": "public, max-age=31536000, immutable" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível abrir a foto.";
    return new Response(message, { status: 400 });
  }
}
