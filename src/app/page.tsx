"use client";
import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const [lastKey, setLastKey] = useState<string | null>(null); // <-- 🔥 important !

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setProgress(0);

    const tenantId = "836eaed4-f7cb-4b03-8767-ef8323d330bc";
    const projectId = "a393ac07-cd66-47d0-a542-2a4376ac277c";
    const userId = "34c51a32-c07a-4a84-97ce-c55909b5c08e";
    const questionnaireId = "93e11a45-3351-48c1-ab60-a02e66b3cdab";

    //
    // 1️⃣ Obtenir l’URL signée PUT
    //
    const params = new URLSearchParams({
      tenantId,
      projectId,
      fileName: file.name,
      mimeType: file.type,
      questionnaireId,
    });

    const uploadUrlRes = await fetch(
      `https://api.dev.embedd.fr/file/upload-url?${params.toString()}`
      // `http://gateway.localhost/file/upload-url?${params.toString()}`
    );

    if (!uploadUrlRes.ok) {
      console.error("❌ Erreur upload-url:", await uploadUrlRes.text());
      setLoading(false);
      return;
    }

    const { uploadUrl, key } = await uploadUrlRes.json();
    console.log("🔐 Signed URL:", uploadUrl);

    //
    // 2️⃣ Upload direct vers Cloudflare R2
    //
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
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
    // 3️⃣ Appel à after-upload
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
          questionnaireId,
        }),
      }
    );

    const afterData = await afterUploadRes.json();

    //
    // 💾 On sauvegarde le key pour le deuxième bouton
    //
    setLastKey(key);
    setUrl(afterData.url);

    setLoading(false);
  }

  //
  // 🎯 2️⃣ Ce bouton relance *uniquement* after-upload
  // sans réuploader la vidéo dans R2.
  //
  async function resendAfterUpload() {
    if (!lastKey) {
      alert("Aucun fichier uploadé");
      return;
    }

    const tenantId = "7a0eb7d5-d2cd-4f7e-8f72-78ea46d1a595";
    const projectId = "cdc7d1d5-b01a-4c90-9d15-f75c55053e7f";
    const userId = "9ed96e8c-7f8d-479c-a398-a49e78e9db85";
    const questionnaireId = "4443b661-5174-40fd-b56c-09a1791f704a";

    console.log("🔁 Relance du after-upload...");

    const res = await fetch("http://gateway.localhost/file/after-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId,
        projectId,
        userId,
        key: lastKey,          // <-- 🎯 IMPORTANT
        fileName: "REPLAY.mp4", // valeur peu importante
        mimeType: "video/mp4",  // idem
        questionnaireId,
      }),
    });

    const data = await res.json();
    console.log("🔥 After-upload rejoué :", data);
    alert("After-upload relancé !");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-10">
      <h1 className="text-2xl font-bold mb-6">Upload + Replay Flow</h1>

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

      {loading && (
        <>
          <div className="w-full max-w-md mt-4">
            <div className="w-full bg-gray-300 rounded h-4 overflow-hidden">
              <div
                className="bg-green-600 h-4 transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          <p className="text-center mt-1">{progress}%</p>
        </>
      )}

      {lastKey && (
        <button
          onClick={resendAfterUpload}
          className="mt-4 bg-purple-600 text-white px-4 py-2 rounded"
        >
          🔁 Rejouer le flow (sans re-upload)
        </button>
      )}

      {url && (
        <p className="mt-4 text-center break-all">
          <strong>URL finale :</strong> {url}
        </p>
      )}
    </main>
  );
}
