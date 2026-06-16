"use client"

import type { CompanyProfile, Posting, Candidate, CVFile } from "@/app/types/company"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"

const SKILLS_SUGERIDAS = [
  "JavaScript", "Python", "React", "Node.js", "SQL",
  "Excel", "Diseño gráfico", "Marketing digital", "Ventas",
  "Atención al cliente", "Gestión de proyectos", "Inglés"
]

export default function CompanyDashboard() {
  const [activeTab, setActiveTab] = useState<"publish" | "postings" | "analyze">("postings")
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
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

  return (
    <main className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-800">Employment Site</span>
          <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full">
            {profile?.company_name || "Empresa"}
          </span>
        </div>
        <button onClick={handleSignOut} className="text-sm text-slate-500 hover:text-slate-700">
          Cerrar sesión
        </button>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <div className="flex gap-2 mb-6">
          {[
            { key: "postings", label: "Mis vacantes" },
            { key: "publish", label: "Publicar vacante" },
            { key: "analyze", label: "Analizar CVs externos" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as "publish" | "postings" | "analyze")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-purple-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "publish" && (
          <PublishSection
            profile={profile}
            onPublished={() => setActiveTab("postings")}
          />
        )}
        {activeTab === "postings" && (
          <PostingsSection />
        )}
        {activeTab === "analyze" && (
          <AnalyzeSection profile={profile} />
        )}
      </div>
    </main>
  )
}

function PublishSection({ profile, onPublished }: { profile: CompanyProfile | null; onPublished: () => void })
 {
  const supabase = createClient()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [skills, setSkills] = useState<string[]>([])
  const [customSkill, setCustomSkill] = useState("")
  const [modality, setModality] = useState("")
  const [location, setLocation] = useState("")
  const [salaryRange, setSalaryRange] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function toggleSkill(skill: string) {
    setSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill])
  }

  function addCustomSkill() {
    const s = customSkill.trim()
    if (s && !skills.includes(s)) { setSkills(prev => [...prev, s]); setCustomSkill("") }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No hay sesión activa")
      const { error } = await supabase.from("job_postings").insert({
        company_id: user.id,
        title,
        description,
        required_skills: skills,
        modality,
        location,
        salary_range: salaryRange,
      })
      if (error) throw error
      onPublished()
    } catch (err: unknown) {
    setError(err instanceof Error ? err.message : "Ocurrió un error")
    }

  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h2 className="font-semibold text-slate-800 mb-5">Nueva vacante</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="text-sm text-slate-600 mb-1 block">Puesto</label>
          <input
            type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Ej: Desarrollador Frontend Senior"
            required
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-slate-400"
          />
        </div>
        <div>
          <label className="text-sm text-slate-600 mb-1 block">Descripción del puesto</label>
          <textarea
            value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Describe las responsabilidades, el equipo y el ambiente de trabajo..."
            rows={4}
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-slate-400 resize-none"
          />
        </div>
        <div>
          <label className="text-sm text-slate-600 mb-2 block">Habilidades requeridas</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {SKILLS_SUGERIDAS.map(skill => (
              <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                className={`px-3 py-1 rounded-full text-xs border transition-all ${
                  skills.includes(skill)
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >{skill}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text" value={customSkill} onChange={e => setCustomSkill(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomSkill())}
              placeholder="Agregar habilidad..."
              className="flex-1 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-slate-400"
            />
            <button type="button" onClick={addCustomSkill}
              className="px-4 py-2 bg-slate-100 rounded-lg text-sm text-slate-600 hover:bg-slate-200">
              Agregar
            </button>
          </div>
        </div>
        <div>
          <label className="text-sm text-slate-600 mb-1 block">Modalidad</label>
          <div className="flex gap-3">
            {["presencial", "hibrido", "remoto"].map(m => (
              <button key={m} type="button" onClick={() => setModality(m)}
                className={`flex-1 py-2 rounded-lg text-sm border transition-all capitalize ${
                  modality === m
                    ? "border-purple-500 bg-purple-50 text-purple-700 font-medium"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >{m}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-600 mb-1 block">Ubicación</label>
            <input
              type="text" value={location} onChange={e => setLocation(e.target.value)}
              placeholder="Ej: Ciudad de México"
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-slate-400"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1 block">Rango salarial</label>
            <input
              type="text" value={salaryRange} onChange={e => setSalaryRange(e.target.value)}
              placeholder="Ej: $20,000 - $30,000"
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-slate-400"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
        <button
          type="submit" disabled={loading || !modality}
          className="w-full py-2.5 rounded-lg text-sm font-medium text-white bg-purple-600 hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Publicando..." : "Publicar vacante"}
        </button>
      </form>
    </div>
  )
}

function PostingsSection() {
  const supabase = createClient()
  const [postings, setPostings] = useState<Posting[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPosting, setSelectedPosting] = useState<Posting | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from("job_postings")
        .select("*")
        .eq("company_id", user.id)
        .order("created_at", { ascending: false })
      setPostings(data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function searchCandidates(posting: Posting) {
    setSelectedPosting(posting)
    setSearching(true)
    setCandidates([])
    const res = await fetch("/api/match-candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ posting })
    })
    const data = await res.json()
    setCandidates(data.candidates || [])
    setSearching(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from("job_postings").update({ active: !current }).eq("id", id)
    setPostings(prev => prev.map(p => p.id === id ? { ...p, active: !current } : p))
  }

  if (loading) return <div className="text-center py-16 text-slate-400 text-sm">Cargando...</div>

  if (postings.length === 0) return (
    <div className="text-center py-16 text-slate-400 text-sm">
      No has publicado ninguna vacante todavía.
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      {postings.map(posting => (
        <div key={posting.id} className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-slate-800">{posting.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  posting.active
                    ? "bg-teal-50 text-teal-700"
                    : "bg-slate-100 text-slate-500"
                }`}>
                  {posting.active ? "Activa" : "Inactiva"}
                </span>
              </div>
              <p className="text-sm text-slate-500">
                {posting.modality} · {posting.location}
                {posting.salary_range && ` · ${posting.salary_range}`}
              </p>
              {posting.required_skills?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {posting.required_skills.map((s: string) => (
                    <span key={s} className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 items-end">
              <button
                onClick={() => searchCandidates(posting)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-medium hover:opacity-90 whitespace-nowrap"
              >
                Buscar candidatos
              </button>
              <button
                onClick={() => toggleActive(posting.id, posting.active)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                {posting.active ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>

          {selectedPosting?.id === posting.id && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              {searching ? (
                <p className="text-sm text-slate-400">Buscando candidatos compatibles...</p>
              ) : candidates.length === 0 ? (
                <p className="text-sm text-slate-400">No se encontraron candidatos compatibles aún.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium text-slate-700">
                    {candidates.length} candidato{candidates.length !== 1 ? "s" : ""} compatible{candidates.length !== 1 ? "s" : ""}
                  </p>
                  {/* Aquí se muestra una lista simple de candidatos compatibles*/}
                  {candidates.map((c: Candidate, i: number) => (
                    <CandidateCard key={i} candidate={c} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function AnalyzeSection({ profile }: { profile: CompanyProfile | null }){
  const [cvFiles, setCvFiles] = useState<CVFile[]>([])
  const [requirements, setRequirements] = useState("")
  const [analysis, setAnalysis] = useState("")
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

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
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-800 mb-1">Subir CVs externos</h2>
        <p className="text-sm text-slate-500 mb-4">Sube CVs de candidatos externos para que la IA elija al mejor</p>
        <label className="cursor-pointer flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-8 hover:border-purple-300 hover:bg-purple-50 transition-all">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span className="text-sm text-slate-500">
            {uploading ? "Procesando CVs..." : "Haz clic para subir CVs (PDF)"}
          </span>
          <input type="file" accept=".pdf" multiple className="hidden" onChange={handleUploadCVs} disabled={uploading} />
        </label>
        {cvFiles.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {cvFiles.map((cv, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5">
                <span className="text-sm text-slate-700">{cv.name}</span>
                <button onClick={() => setCvFiles(prev => prev.filter((_, j) => j !== i))}
                  className="text-xs text-slate-400 hover:text-red-500">Eliminar</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-800 mb-1">Requerimientos</h2>
        <textarea
          value={requirements} onChange={e => setRequirements(e.target.value)}
          placeholder="Describe el puesto y los requisitos..."
          rows={4}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-slate-400 resize-none mt-3"
        />
      </div>

      <button
        onClick={analyzeCanditates}
        disabled={loading || !cvFiles.length || !requirements.trim()}
        className="w-full py-3 rounded-xl text-sm font-medium text-white bg-purple-600 hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Analizando..." : `Analizar ${cvFiles.length} candidato${cvFiles.length !== 1 ? "s" : ""}`}
      </button>

      {analysis && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Análisis de la IA</h2>
          <div className="text-slate-700">
            <ReactMarkdown components={{
              p: ({children}) => <p className="mb-3 last:mb-0">{children}</p>,
              strong: ({children}) => <strong className="font-semibold text-slate-800">{children}</strong>,
              ul: ({children}) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
              ol: ({children}) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
              li: ({children}) => <li>{children}</li>,
              h2: ({children}) => <h2 className="font-semibold text-base mt-4 mb-2">{children}</h2>,
              h3: ({children}) => <h3 className="font-semibold text-sm mt-3 mb-1">{children}</h3>,
            }}>{analysis}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )

  
}

function CandidateCard({ candidate }: { candidate: Candidate }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div className="bg-slate-50 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-800">{candidate.full_name}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {candidate.desired_position} · {candidate.work_modality} · {candidate.location}
            </p>
            {candidate.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {candidate.skills.slice(0, 5).map((s: string) => (
                  <span key={s} className="text-xs px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 ml-4">
            {candidate.match_score && (
              <span className="text-sm font-semibold text-purple-600">
                {candidate.match_score}% match
              </span>
            )}
            <button
              onClick={() => setShowModal(true)}
              className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:opacity-90"
            >
              Ver CV
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <CVModal candidate={candidate} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}

function CVModal({ candidate, onClose }: { candidate: Candidate; onClose: () => void }) {
  function downloadCV() {
    const content = `CV - ${candidate.full_name}
${"=".repeat(40)}
Puesto deseado: ${candidate.desired_position}
Área: ${candidate.desired_area}
Modalidad: ${candidate.work_modality}
Ubicación: ${candidate.location}
Habilidades: ${candidate.skills?.join(", ")}

${"=".repeat(40)}
CV COMPLETO
${"=".repeat(40)}

${candidate.cv_text || "No disponible"}`

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `CV_${candidate.full_name?.replace(/ /g, "_") || "candidato"}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">{candidate.full_name}</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {candidate.desired_position} · {candidate.work_modality} · {candidate.location}
            </p>
            {candidate.match_score && (
              <span className="text-xs font-medium px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full mt-2 inline-block">
                {candidate.match_score}% compatible
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none ml-4">
            ×
          </button>
        </div>

        {/* Info básica */}
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Área", value: candidate.desired_area },
              { label: "Modalidad", value: candidate.work_modality },
              { label: "Ubicación", value: candidate.location },
              { label: "Habilidades", value: candidate.skills?.join(", ") },
            ].map(item => item.value && (
              <div key={item.label}>
                <p className="text-xs text-slate-400">{item.label}</p>
                <p className="text-sm text-slate-700 mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CV texto */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-xs font-medium text-slate-500 mb-3">CV completo</p>
          {candidate.cv_text ? (
            <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
              {candidate.cv_text}
            </pre>
          ) : (
            <p className="text-sm text-slate-400">El candidato no ha subido su CV.</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100">
          <button
            onClick={downloadCV}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white bg-purple-600 hover:opacity-90 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Descargar CV
          </button>
        </div>
      </div>
    </div>
  )
}