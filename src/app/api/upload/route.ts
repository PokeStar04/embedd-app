import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = "bad1ada4-b2d9-4975-9086-4a5ff25ce9c7"; // 🧪 userId fixe pour tes tests

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
    }

    // Convertir le fichier en buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Générer un UUID unique + récupérer l'extension
    const extension = file.name.split(".").pop();
    const uniqueName = `${randomUUID()}.${extension}`;

    // Construire le chemin Cloudflare : userId/uuid.extension
    const key = `${userId}/${uniqueName}`;

    // Envoi du fichier vers R2
    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    // Génération de l’URL publique
    const fileUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    return NextResponse.json({
      success: true,
      url: fileUrl,
      key,
    });
  } catch (err) {
    console.error("❌ Erreur R2 upload:", err);
    return NextResponse.json({ error: "Erreur upload R2" }, { status: 500 });
  }
}
