"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"

export default function CompanyDashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [cvFiles, setCvFiles] = useState<{ name: string; text: string }[]>([])
  const [requirements, setRequirements] = useState("")
  const [analysis, setAnalysis] = useState("")
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/"); return }

      const { data } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      setProfile(data)
    }
    loadProfile()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/")
  }

  async function handleUploadCVs(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setUploading(true)
    const parsed: { name: string; text: string }[] = []

    for (const file of files) {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/parse-cv", { method: "POST", body: formData })
      const data = await res.json()
      if (data.text) parsed.push({ name: file.name, text: data.text })
    }

    setCvFiles(prev => [...prev, ...parsed])
    setUploading(false)
  }

  function removeCv(index: number) {
    setCvFiles(prev => prev.filter((_, i) => i !== index))
  }

  async function analyzeCanditates() {
    if (!cvFiles.length || !requirements.trim()) return
    setLoading(true)
    setAnalysis("")

    const res = await fetch("/api/analyze-candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvFiles, requirements, profile })
    })

    const data = await res.json()
    setAnalysis(data.analysis || "No se pudo obtener el análisis.")
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-slate-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-800">Employment Site</span>
          <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full">
            {profile?.company_name || "Empresa"}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Cerrar sesión
        </button>
      </nav>

      <div className="max-w-4xl mx-auto p-6">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Análisis de candidatos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Sube los CVs de los candidatos y la IA te dirá cuál es el mejor para tu vacante
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">

          {/* Paso 1: Subir CVs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-800 mb-1">Paso 1 — Sube los CVs</h2>
            <p className="text-sm text-slate-500 mb-4">Puedes subir varios CVs a la vez</p>

            <label className="cursor-pointer flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-8 hover:border-purple-300 hover:bg-purple-50 transition-all">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="text-sm text-slate-500">
                {uploading ? "Procesando CVs..." : "Haz clic para subir CVs (PDF)"}
              </span>
              <input
                type="file"
                accept=".pdf"
                multiple
                className="hidden"
                onChange={handleUploadCVs}
                disabled={uploading}
              />
            </label>

            {cvFiles.length > 0 && (
              <div className="mt-4 flex flex-col gap-2">
                {cvFiles.map((cv, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm text-slate-700">{cv.name}</span>
                    </div>
                    <button
                      onClick={() => removeCv(i)}
                      className="text-slate-400 hover:text-red-500 text-xs"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Paso 2: Requerimientos */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-800 mb-1">Paso 2 — Define los requerimientos</h2>
            <p className="text-sm text-slate-500 mb-4">
              Describe el puesto, habilidades necesarias y cualquier requisito importante
            </p>
            <textarea
              value={requirements}
              onChange={e => setRequirements(e.target.value)}
              placeholder="Ej: Buscamos un desarrollador frontend con 2+ años de experiencia en React, conocimientos de TypeScript, trabajo en equipo y disponibilidad para modalidad híbrida en CDMX..."
              rows={5}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-slate-400 resize-none"
            />
          </div>

          {/* Botón analizar */}
          <button
            onClick={analyzeCanditates}
            disabled={loading || !cvFiles.length || !requirements.trim()}
            className="w-full py-3 rounded-xl text-sm font-medium text-white bg-purple-600 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Analizando candidatos..." : `Analizar ${cvFiles.length} candidato${cvFiles.length !== 1 ? "s" : ""}`}
          </button>

          {/* Resultado */}
          {analysis && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-800 mb-4">Análisis de la IA</h2>
              <div className="prose prose-sm max-w-none text-slate-700">
                <ReactMarkdown
                  components={{
                    p: ({children}) => <p className="mb-3 last:mb-0">{children}</p>,
                    strong: ({children}) => <strong className="font-semibold text-slate-800">{children}</strong>,
                    ul: ({children}) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
                    li: ({children}) => <li className="text-slate-700">{children}</li>,
                    h2: ({children}) => <h2 className="font-semibold text-base text-slate-800 mt-4 mb-2">{children}</h2>,
                    h3: ({children}) => <h3 className="font-semibold text-sm text-slate-800 mt-3 mb-1">{children}</h3>,
                  }}
                >
                  {analysis}
                </ReactMarkdown>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  )
}