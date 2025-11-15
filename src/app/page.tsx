"use client";
import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [url, setUrl] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setProgress(0);

    const tenantId = "bad1ada4-b2d9-4975-9086-4a5ff25ce9c7";
    const projectId = "fd716f3c-8a4f-4679-b244-f57bc83fbc41";
    const userId = "fd4088d8-89e1-4961-be5f-2055c65609bc";

    //
    // 1️⃣ Récupération de l’URL PUT signée
    //
    const params = new URLSearchParams({
      tenantId,
      projectId,
      fileName: file.name,
      mimeType: file.type,
    });

    const uploadUrlRes = await fetch(
      `http://gateway.localhost/file/upload-url?${params.toString()}`
    );

    if (!uploadUrlRes.ok) {
      console.error("❌ Erreur upload-url:", await uploadUrlRes.text());
      setLoading(false);
      return;
    }

    const { uploadUrl, key } = await uploadUrlRes.json();
    console.log("🔐 Signed URL:", uploadUrl);

    //
    // 2️⃣ Upload direct → XMLHttpRequest pour la progression
    //
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);

      // 📊 suivi progression
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Erreur PUT (${xhr.status})`));
      };

      xhr.onerror = () => reject(new Error("Erreur réseau XHR"));
      xhr.send(file);
    });

    //
    // 3️⃣ Notifier le Gateway
    //
    const afterUploadRes = await fetch(
      "http://gateway.localhost/file/after-upload",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          projectId,
          userId,
          key,
          fileName: file.name,
          mimeType: file.type,
        }),
      }
    );

    const afterData = await afterUploadRes.json();
    setUrl(afterData.url);

    setLoading(false);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-10">
      <h1 className="text-2xl font-bold mb-6">Upload direct Cloudflare R2</h1>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mb-4"
      />

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Upload..." : "Envoyer"}
      </button>

      {/* Barre de progression */}
      {loading && (
        <div className="w-full max-w-md mt-4">
          <div className="w-full bg-gray-300 rounded h-4 overflow-hidden">
            <div
              className="bg-green-600 h-4 transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-center mt-1">{progress}%</p>
        </div>
      )}

      {url && (
        <p className="mt-4 text-center break-all">
          <strong>URL finale :</strong> {url}
        </p>
      )}
    </main>
  );
}
