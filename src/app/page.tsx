/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";

type UploadMode = "single" | "multi";

interface UploadedFile {
  key: string;
  fileName: string;
  url: string;
  transcriptionQueued: boolean;
}

interface Config {
  apiBaseUrl: string;
  tenantId: string;
  projectId: string;
  userId: string;
  questionnaireId: string;
}

interface ResearchStatus {
  analysisRunning: boolean;
  analysisComplete: boolean;
  insightsGenerated: boolean;
  recommendationsGenerated: boolean;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  questionnaires: Array<{
    id: string;
    name: string;
  }>;
}

export default function Home() {
  const [config, setConfig] = useState<Config>({
    apiBaseUrl: "http://gateway.localhost",
    // apiBaseUrl: "https://api.dev.embedd.fr",
    tenantId: "",
    projectId: "",
    userId: "",
    questionnaireId: "",
  });

  const [mode, setMode] = useState<UploadMode>("single");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ [key: string]: number }>({});
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [setupLoading, setSetupLoading] = useState(false);
  const [researchStatus, setResearchStatus] = useState<ResearchStatus>({
    analysisRunning: false,
    analysisComplete: false,
    insightsGenerated: false,
    recommendationsGenerated: false,
  });
  const [researchLoading, setResearchLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  // 📋 Récupérer les projets du tenant
  async function fetchProjects() {
    if (!config.tenantId) {
      alert("Veuillez d'abord créer une inscription !");
      return;
    }

    setProjectsLoading(true);
    try {
      const res = await fetch(
        `${config.apiBaseUrl}/research/projects?tenantId=${config.tenantId}`
      );

      if (!res.ok) {
        throw new Error(`Erreur récupération projets: ${await res.text()}`);
      }

      const data = await res.json();
      setProjects(data.data || []);
      console.log("✅ Projets récupérés:", data);
    } catch (error) {
      console.error("❌ Erreur:", error);
      alert(`Erreur: ${error instanceof Error ? error.message : "Unknown"}`);
    } finally {
      setProjectsLoading(false);
    }
  }

  // 🎯 Sélectionner un questionnaire
  function selectQuestionnaire(projectId: string, questionnaireId: string) {
    setConfig((prev) => ({
      ...prev,
      projectId,
      questionnaireId,
    }));
    alert(`Projet et questionnaire sélectionnés !\nProject ID: ${projectId}\nQuestionnaire ID: ${questionnaireId}`);
  }

  // 🆕 Générer une inscription (tenant + user)
  async function createInscription() {
    setSetupLoading(true);
    try {
      const res = await fetch(`${config.apiBaseUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: `test-${Date.now()}@embedd.test`,
          password: "Test123456!",
          username: "JohnDoe",
          referralCode: "REF1234"
        }),
      });

      if (!res.ok) {
        throw new Error(`Erreur inscription: ${await res.text()}`);
      }

      const data = await res.json();

      setConfig((prev) => ({
        ...prev,
        tenantId: data.tenantId,
        userId: data.userId,
      }));

      console.log("✅ Inscription créée:", data);
      alert(`Inscription créée !\nTenant: ${data.tenantId}\nUser: ${data.userId}`);
    } catch (error) {
      console.error("❌ Erreur:", error);
      alert(`Erreur: ${error instanceof Error ? error.message : "Unknown"}`);
    } finally {
      setSetupLoading(false);
    }
  }

  // 🆕 Créer un projet de recherche
  async function createProject() {
    if (!config.tenantId || !config.userId) {
      alert("Veuillez d'abord créer une inscription !");
      return;
    }

    setSetupLoading(true);
    try {
      const projectData = {
        name: "Diagnostic du cycle d'analyse UX & discovery",
        description: "Identifier les douleurs, lenteurs et inefficiences dans l'analyse UX.",
        researchContext: "Dans le cadre du développement d'Embedd, nous réalisons une série d'entretiens semi-directifs auprès de 5 Product Designers en environnement. L'objectif principal est de cartographier leurs processus actuels d'analyse de recherche utilisateur, d'identifier les inefficiences structurelles, et de valider notre proposition de valeur autour de l'automatisation de l'analyse.\n\nLes interviews durent 20-25 minutes et suivent un guide structuré de 9 questions couvrant : le workflow complet de recherche, les temps consacrés à chaque phase, les pain points majeurs, les formats de restitution actuels, les priorités d'automatisation, et la sensibilité au prix.",
        tenantId: config.tenantId,
        createdBy: config.userId,
        questions: [
          { id: "h1", contextType: "HYPOTHESIS", text: "Je pense que c'est l'analyse qui prend le plus de temps lors de la recherche utilisateur." },
          { id: "h2", contextType: "HYPOTHESIS", text: "Je pense qu'un cycle de recherche utilisateur prend en moyenne 2 semaines." },
          { id: "h3", contextType: "HYPOTHESIS", text: "Je pense que les utilisateurs ne sont pas satisfaits de leur processus d'analyse actuel." },
          { id: "h4", contextType: "HYPOTHESIS", text: "Je pense que les utilisateurs veulent automatiser en priorité l'analyse / la restitution des recherches utilisateurs." },
          { id: "h5", contextType: "HYPOTHESIS", text: "Je pense que les utilisateurs voudront tester notre solution Embedd." },
          { id: "h6", contextType: "HYPOTHESIS", text: "Je pense que les utilisateurs ont besoin de partager leurs découvertes avant de les montrer à un décisionnaire." },
          { id: "a1", contextType: "ATTENTION_POINT", text: "Friction" },
          { id: "a2", contextType: "ATTENTION_POINT", text: "Flemme" },
          { id: "a3", contextType: "ATTENTION_POINT", text: "Temps" }
        ],
        questionnaires: [
          {
            id: "interview-janvier-2025",
            name: "Interview UX — Janvier 2025",
            description: "Guide d'entretien semi-directif pour analyser le cycle d'analyse UX.",
            questions: [
              { id: "q1", contextType: "INTERVIEW_QUESTION", text: "Décris-moi ton dernier cycle de recherche utilisateur, du début à la fin. Quelles sont les grandes étapes ?" },
              { id: "q2", contextType: "INTERVIEW_QUESTION", text: "Combien de temps ça t'a pris entre la collecte des données et la présentation des insights ?" },
              { id: "q3", contextType: "INTERVIEW_QUESTION", text: "Qu'est-ce qui prend le plus de temps dans ce processus ?" },
              { id: "q4", contextType: "INTERVIEW_QUESTION", text: "Comment tu partages tes découvertes avec les décideurs actuellement ? (slides, Notion, Confluence, etc.)" },
              { id: "q5", contextType: "INTERVIEW_QUESTION", text: "Qui est impliqué dans la validation de tes recommandations ?" },
              { id: "q6", contextType: "INTERVIEW_QUESTION", text: "Si tu pouvais automatiser UNE étape de ton process, ce serait laquelle ?" },
              { id: "q7", contextType: "INTERVIEW_QUESTION", text: "Quel budget ou combien de temps tu es prêt à investir pour réduire ce temps d'analyse ?" },
              { id: "q8", contextType: "INTERVIEW_QUESTION", text: "Sur une échelle de 1 à 10, à quel point tu es satisfait de ton process actuel d'analyse ?" },
              { id: "q9", contextType: "INTERVIEW_QUESTION", text: "Notre solution Embedd permet d'automatiser tout le processus d'analyse et de formulation des conclusions en 15 minutes. Est-ce que tu voudrais l'essayer ?" }
            ]
          }
        ]
      };

      const res = await fetch(`${config.apiBaseUrl}/research/project`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });

      if (!res.ok) {
        throw new Error(`Erreur création projet: ${await res.text()}`);
      }

      const data = await res.json();

      // Récupérer l'ID du projet et le questionnaireId
      const projectId = data.data.id;
      const questionnaireId = data.data.questionnaires?.[0]?.id || "";

      setConfig((prev) => ({
        ...prev,
        projectId,
        questionnaireId,
      }));

      console.log("✅ Projet créé:", data);
      alert(`Projet créé !\nProject ID: ${projectId}\nQuestionnaire ID: ${questionnaireId}`);
    } catch (error) {
      console.error("❌ Erreur:", error);
      alert(`Erreur: ${error instanceof Error ? error.message : "Unknown"}`);
    } finally {
      setSetupLoading(false);
    }
  }

  // 📤 Single Upload
  async function handleSingleUpload() {
    if (files.length === 0) return;
    if (!config.tenantId || !config.projectId || !config.userId) {
      alert("Veuillez d'abord créer une inscription et un projet !");
      return;
    }

    const file = files[0];
    setLoading(true);
    setProgress({ [file.name]: 0 });

    try {
      const params = new URLSearchParams({
        tenantId: config.tenantId,
        projectId: config.projectId,
        fileName: file.name,
        mimeType: file.type,
      });

      const uploadUrlRes = await fetch(
        `${config.apiBaseUrl}/file/upload-url?${params.toString()}`
      );

      if (!uploadUrlRes.ok) {
        throw new Error(`Erreur upload-url: ${await uploadUrlRes.text()}`);
      }

      const { uploadUrl, key } = await uploadUrlRes.json();
      await uploadToR2(file, uploadUrl, file.name);

      const afterUploadRes = await fetch(
        `${config.apiBaseUrl}/file/after-upload`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: config.tenantId,
            projectId: config.projectId,
            userId: config.userId,
            key,
            fileName: file.name,
            mimeType: file.type,
            questionnaireId: config.questionnaireId,
          }),
        }
      );

      const afterData = await afterUploadRes.json();

      setUploadedFiles([
        {
          key,
          fileName: file.name,
          url: afterData.url,
          transcriptionQueued: afterData.transcriptionQueued,
        },
      ]);

      console.log("✅ Upload terminé:", afterData);
    } catch (error) {
      console.error("❌ Erreur:", error);
      alert(`Erreur: ${error instanceof Error ? error.message : "Unknown"}`);
    } finally {
      setLoading(false);
    }
  }

  // 📦 Multi Upload
  async function handleMultiUpload() {
    if (files.length === 0) return;
    if (!config.tenantId || !config.projectId || !config.userId) {
      alert("Veuillez d'abord créer une inscription et un projet !");
      return;
    }

    setLoading(true);
    setProgress({});

    try {
      const batchUrlsRes = await fetch(
        `${config.apiBaseUrl}/file/upload-urls`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: config.tenantId,
            projectId: config.projectId,
            files: files.map((f) => ({
              fileName: f.name,
              mimeType: f.type,
            })),
            questionnaireId: config.questionnaireId,
          }),
        }
      );

      if (!batchUrlsRes.ok) {
        throw new Error(`Erreur batch URLs: ${await batchUrlsRes.text()}`);
      }

      const { uploadUrls } = await batchUrlsRes.json();

      const uploadPromises = uploadUrls.map(
        (urlData: { uploadUrl: string; key: string; fileName: string }, idx: number) => {
          const file = files[idx];
          return uploadToR2(file, urlData.uploadUrl, file.name);
        }
      );

      await Promise.all(uploadPromises);

      const afterUploadsRes = await fetch(
        `${config.apiBaseUrl}/file/after-uploads`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: config.tenantId,
            projectId: config.projectId,
            userId: config.userId,
            uploads: uploadUrls.map((urlData: any, idx: number) => ({
              key: urlData.key,
              fileName: files[idx].name,
              mimeType: files[idx].type,
            })),
            questionnaireId: config.questionnaireId,
          }),
        }
      );

      const afterData = await afterUploadsRes.json();

      setUploadedFiles(
        afterData.processedFiles.map((f: any) => ({
          key: f.key,
          fileName: f.fileName,
          url: f.url,
          transcriptionQueued: f.transcriptionQueued,
        }))
      );

      console.log(`✅ ${afterData.totalProcessed} fichiers traités`);
    } catch (error) {
      console.error("❌ Erreur:", error);
      alert(`Erreur: ${error instanceof Error ? error.message : "Unknown"}`);
    } finally {
      setLoading(false);
    }
  }

  // 🚀 Upload vers R2 avec progression
  async function uploadToR2(
    file: File,
    uploadUrl: string,
    fileName: string
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setProgress((prev) => ({ ...prev, [fileName]: percent }));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setProgress((prev) => ({ ...prev, [fileName]: 100 }));
          resolve();
        } else {
          reject(new Error(`Erreur PUT (${xhr.status})`));
        }
      };

      xhr.onerror = () => reject(new Error("Erreur réseau XHR"));
      xhr.send(file);
    });
  }

  // 🔁 Rejouer after-upload
  async function resendAfterUpload(uploadedFile: UploadedFile) {
    try {
      const res = await fetch(`${config.apiBaseUrl}/file/after-upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: config.tenantId,
          projectId: config.projectId,
          userId: config.userId,
          key: uploadedFile.key,
          fileName: uploadedFile.fileName,
          mimeType: "video/mp4",
          questionnaireId: config.questionnaireId,
        }),
      });

      const data = await res.json();
      console.log("🔥 After-upload rejoué :", data);
      alert(`After-upload relancé pour ${uploadedFile.fileName}!`);
    } catch (error) {
      console.error("❌ Erreur replay:", error);
      alert(`Erreur: ${error instanceof Error ? error.message : "Unknown"}`);
    }
  }

  // 🔍 Lancer l'analyse complète du projet
  async function runFullAnalysis() {
    if (!config.projectId || !config.tenantId) {
      alert("Veuillez d'abord créer une inscription et un projet !");
      return;
    }

    setResearchLoading(true);
    setResearchStatus((prev) => ({ ...prev, analysisRunning: true }));

    try {
      const res = await fetch(
        `${config.apiBaseUrl}/qdrant/search/full`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: config.projectId,
            tenantId: config.tenantId,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`Erreur analyse: ${await res.text()}`);
      }

      const data = await res.json();
      console.log("✅ Analyse lancée:", data);

      setResearchStatus((prev) => ({
        ...prev,
        analysisRunning: false,
        analysisComplete: true,
      }));

      alert(`Analyse complète lancée avec succès !`);
    } catch (error) {
      console.error("❌ Erreur:", error);
      alert(`Erreur: ${error instanceof Error ? error.message : "Unknown"}`);
      setResearchStatus((prev) => ({ ...prev, analysisRunning: false }));
    } finally {
      setResearchLoading(false);
    }
  }

  // 💡 Générer les insights
  async function generateInsights() {
    if (!config.projectId || !config.tenantId || !config.userId) {
      alert("Veuillez d'abord créer une inscription et un projet !");
      return;
    }

    setResearchLoading(true);

    try {
      const res = await fetch(
        `${config.apiBaseUrl}/research/insights/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: config.projectId,
            tenantId: config.tenantId,
            userId: config.userId,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`Erreur insights: ${await res.text()}`);
      }

      const data = await res.json();
      console.log("✅ Insights générés:", data);

      setResearchStatus((prev) => ({
        ...prev,
        insightsGenerated: true,
      }));

      alert(`Insights générés avec succès !`);
    } catch (error) {
      console.error("❌ Erreur:", error);
      alert(`Erreur: ${error instanceof Error ? error.message : "Unknown"}`);
    } finally {
      setResearchLoading(false);
    }
  }

  // 🎯 Générer les recommandations
  async function generateRecommendations() {
    if (!config.projectId || !config.tenantId || !config.userId) {
      alert("Veuillez d'abord créer une inscription et un projet !");
      return;
    }

    setResearchLoading(true);

    try {
      const res = await fetch(
        `${config.apiBaseUrl}/research/recommendations/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: config.projectId,
            tenantId: config.tenantId,
            userId: config.userId,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`Erreur recommandations: ${await res.text()}`);
      }

      const data = await res.json();
      console.log("✅ Recommandations générées:", data);

      setResearchStatus((prev) => ({
        ...prev,
        recommendationsGenerated: true,
      }));

      alert(`Recommandations générées avec succès !`);
    } catch (error) {
      console.error("❌ Erreur:", error);
      alert(`Erreur: ${error instanceof Error ? error.message : "Unknown"}`);
    } finally {
      setResearchLoading(false);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
    setUploadedFiles([]);
    setProgress({});
  };

  const isConfigured = config.tenantId && config.projectId && config.userId;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-10 bg-gray-50">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900">
          Embedd - Test Complet
        </h1>

        {/* Setup Section */}
        <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-lg font-semibold mb-3 text-blue-900">
            🔧 Configuration initiale
          </h2>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-900">
              <span className={`w-3 h-3 rounded-full ${config.tenantId ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              <span>Tenant ID: {config.tenantId || "Non défini"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-900">
              <span className={`w-3 h-3 rounded-full ${config.userId ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              <span>User ID: {config.userId || "Non défini"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-900">
              <span className={`w-3 h-3 rounded-full ${config.projectId ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              <span>Project ID: {config.projectId || "Non défini"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-900">
              <span className={`w-3 h-3 rounded-full ${config.questionnaireId ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              <span>Questionnaire ID: {config.questionnaireId || "Non défini"}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={createInscription}
              disabled={setupLoading || !!config.tenantId}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition text-sm"
            >
              {config.tenantId ? "✅ Inscription créée" : "👤 Créer inscription"}
            </button>

            <button
              onClick={createProject}
              disabled={setupLoading || !config.tenantId || !!config.projectId}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition text-sm"
            >
              {config.projectId ? "✅ Projet créé" : "📁 Créer projet"}
            </button>
          </div>

          {setupLoading && (
            <p className="text-sm text-gray-600 mt-2 text-center">Chargement...</p>
          )}
        </div>

        {/* Project Selection Section */}
        {config.tenantId && (
          <div className="mb-8 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h2 className="text-lg font-semibold mb-3 text-amber-900">
              📋 {config.projectId ? "Changer de projet" : "Sélectionner un projet existant"}
            </h2>

            <button
              onClick={fetchProjects}
              disabled={projectsLoading}
              className="w-full bg-amber-600 text-white px-4 py-2 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-700 transition text-sm mb-3"
            >
              {projectsLoading ? "Chargement..." : "🔍 Charger mes projets"}
            </button>

            {/* Manual Questionnaire ID Input */}
            <div className="mt-4 p-3 bg-white rounded border border-amber-200">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                ✏️ Ou saisir un Questionnaire ID manuellement :
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={config.questionnaireId}
                  onChange={(e) => setConfig((prev) => ({ ...prev, questionnaireId: e.target.value }))}
                  placeholder="Entrez le questionnaire ID"
                  className="flex-1 text-sm text-gray-900 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              {config.questionnaireId && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Questionnaire ID défini: {config.questionnaireId}
                </p>
              )}
            </div>

            {projects.length > 0 && (
              <div className="space-y-3 mt-4">
                <p className="text-sm font-medium text-gray-900">
                  {projects.length} projet{projects.length > 1 ? "s" : ""} trouvé{projects.length > 1 ? "s" : ""} :
                </p>
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white p-3 rounded border border-amber-200"
                  >
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-xs text-gray-600 mb-2">
                        {project.description}
                      </p>
                    )}

                    {project.questionnaires && project.questionnaires.length > 0 ? (
                      <div className="space-y-2 mt-2">
                        <p className="text-xs font-medium text-gray-700">
                          Questionnaires disponibles :
                        </p>
                        {project.questionnaires.map((questionnaire) => (
                          <button
                            key={questionnaire.id}
                            onClick={() => selectQuestionnaire(project.id, questionnaire.id)}
                            className="w-full text-left bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-2 rounded text-sm transition"
                          >
                            ✓ {questionnaire.name}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic mt-2">
                        Aucun questionnaire disponible
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {projects.length === 0 && !projectsLoading && (
              <p className="text-sm text-gray-600 text-center mt-2">
                Cliquez sur le bouton ci-dessus pour charger vos projets
              </p>
            )}
          </div>
        )}

        {/* Research Actions Section */}
        {config.projectId && (
          <div className="mb-8 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h2 className="text-lg font-semibold mb-3 text-purple-900">
              🔬 Actions de recherche
            </h2>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-900">
                <span className={`w-3 h-3 rounded-full ${researchStatus.analysisComplete ? 'bg-green-500' : researchStatus.analysisRunning ? 'bg-yellow-500' : 'bg-gray-300'}`}></span>
                <span>Analyse: {researchStatus.analysisRunning ? "En cours..." : researchStatus.analysisComplete ? "Terminée" : "Non lancée"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-900">
                <span className={`w-3 h-3 rounded-full ${researchStatus.insightsGenerated ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                <span>Insights: {researchStatus.insightsGenerated ? "Générés" : "Non générés"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-900">
                <span className={`w-3 h-3 rounded-full ${researchStatus.recommendationsGenerated ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                <span>Recommandations: {researchStatus.recommendationsGenerated ? "Générées" : "Non générées"}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={runFullAnalysis}
                disabled={researchLoading || researchStatus.analysisRunning}
                className="bg-purple-600 text-white px-4 py-2 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition text-sm"
              >
                🔍 Analyser
              </button>

              <button
                onClick={generateInsights}
                disabled={researchLoading || !researchStatus.analysisComplete}
                className="bg-blue-600 text-white px-4 py-2 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition text-sm"
              >
                💡 Insights
              </button>

              <button
                onClick={generateRecommendations}
                disabled={researchLoading || !researchStatus.insightsGenerated}
                className="bg-green-600 text-white px-4 py-2 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition text-sm"
              >
                🎯 Recommandations
              </button>
            </div>

            {researchLoading && (
              <p className="text-sm text-gray-600 mt-2 text-center">Traitement en cours...</p>
            )}
          </div>
        )}

        {/* Mode Selector */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => {
              setMode("single");
              setFiles([]);
              setUploadedFiles([]);
            }}
            className={`flex-1 py-2 px-4 rounded font-semibold transition ${
              mode === "single"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            📄 Single Upload
          </button>
          <button
            onClick={() => {
              setMode("multi");
              setFiles([]);
              setUploadedFiles([]);
            }}
            className={`flex-1 py-2 px-4 rounded font-semibold transition ${
              mode === "multi"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            📦 Multi Upload
          </button>
        </div>

        {/* File Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-900">
            {mode === "single"
              ? "Sélectionner un fichier"
              : "Sélectionner plusieurs fichiers"}
          </label>
          <input
            type="file"
            multiple={mode === "multi"}
            onChange={handleFileChange}
            disabled={!isConfigured}
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none p-2 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {files.length > 0 && (
            <p className="text-sm text-gray-900 mt-2">
              {files.length} fichier{files.length > 1 ? "s" : ""} sélectionné
              {files.length > 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Upload Button */}
        <button
          onClick={mode === "single" ? handleSingleUpload : handleMultiUpload}
          disabled={files.length === 0 || loading || !isConfigured}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition"
        >
          {loading
            ? "Upload en cours..."
            : mode === "single"
            ? "🚀 Envoyer"
            : `🚀 Envoyer ${files.length} fichier${files.length > 1 ? "s" : ""}`}
        </button>

        {/* Progress Bars */}
        {loading && Object.keys(progress).length > 0 && (
          <div className="mt-6 space-y-3">
            {Object.entries(progress).map(([fileName, percent]) => (
              <div key={fileName}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium truncate">{fileName}</span>
                  <span className="text-gray-600">{percent}%</span>
                </div>
                <div className="w-full bg-gray-300 rounded h-2 overflow-hidden">
                  <div
                    className="bg-green-600 h-2 transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="mt-8 border-t pt-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              ✅ Fichiers uploadés ({uploadedFiles.length})
            </h2>
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div
                  key={file.key}
                  className="bg-gray-50 p-4 rounded border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {file.fileName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 break-all">
                        Key: {file.key}
                      </p>
                      {file.transcriptionQueued && (
                        <span className="inline-block mt-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          🎙️ En transcription
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => resendAfterUpload(file)}
                      className="ml-4 bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition flex-shrink-0"
                    >
                      🔁 Replay
                    </button>
                  </div>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline mt-2 block"
                  >
                    Voir le fichier →
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Config Info */}
        <div className="mt-8 border-t pt-6">
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-gray-900">
              🔧 Configuration complète
            </summary>
            <pre className="mt-2 bg-gray-100 p-3 rounded text-xs overflow-auto">
              {JSON.stringify(config, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </main>
  );
}