
"use client"

import type { CandidateProfile, Message, Job } from "@/app/types/candidate"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"



export default function CandidateDashboard() {
  const [activeTab, setActiveTab] = useState<"chat" | "jobs" | "profile">("chat")
  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/"); return }

      const { data } = await supabase
        .from("candidate_profiles")
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

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-800">Employment Site</span>
          <span className="text-xs px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full">Candidato</span>
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Cerrar sesión
        </button>
      </nav>

      <div className="max-w-4xl mx-auto p-6">

        {/* Bienvenida */}
        {profile && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">
              Hola 👋
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Buscando: <span className="text-slate-700 font-medium">{profile.desired_position}</span> · {profile.work_modality} · {profile.location}
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "chat", label: "Chat con IA" },
            { key: "jobs", label: "Buscar vacantes" },
            { key: "profile", label: "Mi CV público" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as "chat" | "jobs" | "profile")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-teal-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenido */}
        {activeTab === "chat" && <ChatSection profile={profile} />}
        {activeTab === "jobs" && <JobsSection profile={profile} />}
        {activeTab === "profile" && <PublicProfileSection profile={profile} />}

      </div>
    </main>
  )
}

function ChatSection({ profile }:  { profile: CandidateProfile | null }) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "assistant", content: `Hola! Soy tu asistente de carrera. Puedo ayudarte a mejorar tu CV, prepararte para entrevistas o resolver dudas sobre tu búsqueda de empleo. ¿En qué te ayudo?` }
  ])
  
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [cvText, setCvText] = useState("")

  async function handleUploadCV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch("/api/parse-cv", { method: "POST", body: formData })
    const data = await res.json()
    if (data.text) {
      setCvText(data.text)
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "¡CV cargado correctamente! Ya tengo el contexto de tu CV. ¿Qué quieres mejorar o preguntar?"
      }])
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return

    const newMessages = [...messages, { role: "user", content: input }]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: newMessages,
        cvText,
        profile
      })
    })

    const data = await res.json()
    setMessages(prev => [...prev, { 
      role: "assistant", 
      content: data.reply || "Error al obtener respuesta." 
    }])
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 flex flex-col h-[600px]">

      {/* Upload CV */}
      <div className="p-4 border-b border-slate-100 flex items-center gap-3">
        <label className="cursor-pointer flex items-center gap-2 text-sm text-slate-600 bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-lg border border-slate-200 transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {cvText ? "CV cargado ✓" : "Subir mi CV (PDF)"}
          <input type="file" accept=".pdf" className="hidden" onChange={handleUploadCV} />
        </label>
        {cvText && <span className="text-xs text-teal-600">La IA ya tiene contexto de tu CV</span>}
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
              m.role === "user"
                ? "bg-teal-600 text-white rounded-br-sm"
                : "bg-slate-100 text-slate-700 rounded-bl-sm"
            }`}>
              {m.role === "user" ? m.content : (
                <ReactMarkdown
                  components={{
                    p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                    strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                    ul: ({children}) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                    li: ({children}) => <li>{children}</li>,
                    h2: ({children}) => <h2 className="font-semibold text-sm mt-3 mb-1">{children}</h2>,
                    h3: ({children}) => <h3 className="font-semibold text-sm mt-2 mb-1">{children}</h3>,
                    code: ({children}) => <code className="bg-slate-200 px-1 rounded text-xs">{children}</code>,
                  }}
                >
                  {m.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-bl-sm text-sm text-slate-400">
              Escribiendo...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-100 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Escribe tu pregunta..."
          className="flex-1 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-slate-400"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </div>
  )
}

function JobsSection({ profile }: { profile: CandidateProfile | null }) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [cvText, setCvText] = useState("")
  const [uploading, setUploading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  const [filters, setFilters] = useState({
    position: "",
    location: "",
    modality: "",
    company_type: ""
  })

  async function handleUploadCV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/parse-cv", { method: "POST", body: formData })
    const data = await res.json()
    if (data.text) setCvText(data.text)
    setUploading(false)
  }

  async function searchJobs() {
    setLoading(true)
    setSearched(true)
    const res = await fetch("/api/match-jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvText, profile, filters })
    })
    const data = await res.json()
    setJobs(data.jobs || [])
    setLoading(false)
  }

  function handleViewDetails(job: Job) {
    setSelectedJob(job)
    setShowModal(true)
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Subir CV */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-medium text-slate-700 mb-3">Tu CV (opcional pero recomendado)</h3>
        <label className="cursor-pointer flex items-center gap-2 text-sm text-slate-600 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 rounded-lg border border-slate-200 transition-all w-fit">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {uploading ? "Procesando..." : cvText ? "CV cargado ✓" : "Subir CV (PDF)"}
          <input type="file" accept=".pdf" className="hidden" onChange={handleUploadCV} disabled={uploading} />
        </label>
        {cvText && <p className="text-xs text-teal-600 mt-2">La IA usará tu CV para mejores resultados</p>}
      </div>

      {/* Filtros opcionales */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-medium text-slate-700 mb-3">Filtros (opcionales)</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Puesto específico</label>
            <input
              type="text"
              value={filters.position}
              onChange={e => setFilters(prev => ({ ...prev, position: e.target.value }))}
              placeholder="Ej: Desarrollador React"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Ubicación</label>
            <input
              type="text"
              value={filters.location}
              onChange={e => setFilters(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Ej: CDMX, Monterrey"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Tipo de empresa</label>
            <input
              type="text"
              value={filters.company_type}
              onChange={e => setFilters(prev => ({ ...prev, company_type: e.target.value }))}
              placeholder="Ej: Startup, Tecnología"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Modalidad</label>
            <select
              value={filters.modality}
              onChange={e => setFilters(prev => ({ ...prev, modality: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-400 bg-white"
            >
              <option value="">Cualquiera</option>
              <option value="presencial">Presencial</option>
              <option value="hibrido">Híbrido</option>
              <option value="remoto">Remoto</option>
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={searchJobs}
        disabled={loading}
        className="w-full py-3 bg-teal-600 text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Buscando vacantes compatibles..." : "Buscar vacantes con IA"}
      </button>

      {!searched && (
        <div className="text-center py-12 text-slate-400 text-sm">
          Presiona buscar para ver vacantes recomendadas según tu perfil
        </div>
      )}

      {searched && !loading && jobs.length === 0 && (
        <div className="text-center py-12 text-slate-400 text-sm">
          No hay vacantes disponibles por el momento. Intenta con otros filtros.
        </div>
      )}

      {jobs.map((job, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-teal-200 transition-all">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-slate-800">{job.title}</h3>
                {job.match_score && (
                  <span className="text-xs font-medium px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full">
                    {job.match_score}% match
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">{job.company_name} · {job.modality}</p>

              {/* Detalles bloqueados */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 bg-slate-100 rounded-lg px-3 py-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-xs text-slate-400">Ubicación, salario y detalles — Plan Premium</span>
                </div>
                <button
                  onClick={() => handleViewDetails(job)}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-medium hover:opacity-90 whitespace-nowrap"
                >
                  Ver detalles
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {showModal && selectedJob && (
        <MembershipModal job={selectedJob} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}

function MembershipModal({ job, onClose }: { job: Job; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">
              Contenido Premium
            </span>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">
              ×
            </button>
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mt-2">{job.title}</h2>
          <p className="text-sm text-slate-500">{job.company_name}</p>
        </div>

        {/* Detalles bloqueados */}
        <div className="p-6 border-b border-slate-100">
          <p className="text-sm font-medium text-slate-700 mb-3">Detalles de la vacante</p>
          <div className="flex flex-col gap-2">
            {[
              { label: "Ubicación", value: job.location },
              { label: "Salario", value: job.salary_range || "No especificado" },
              { label: "Modalidad", value: job.modality },
              { label: "Industria", value: job.industry },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-1.5">
                <span className="text-xs text-slate-500">{item.label}</span>
                <div className="bg-slate-100 rounded px-3 py-1 flex items-center gap-1">
                  <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-xs text-slate-400">Bloqueado</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparación planes */}
        <div className="p-6 border-b border-slate-100">
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-medium text-slate-600 mb-2">Plan Gratis</p>
              <ul className="text-xs text-slate-500 flex flex-col gap-1.5">
                <li className="flex items-center gap-1.5">
                  <span className="text-teal-500">✓</span> Ver nombre empresa
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-teal-500">✓</span> Ver puesto
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-teal-500">✓</span> Chat con IA
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-red-400">✗</span> Detalles completos
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-red-400">✗</span> Salario y ubicación
                </li>
              </ul>
            </div>
            <div className="border-2 border-teal-500 rounded-xl p-4 relative">
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs bg-teal-500 text-white px-2 py-0.5 rounded-full">
                Recomendado
              </span>
              <p className="text-xs font-medium text-slate-600 mb-2">Plan Premium</p>
              <ul className="text-xs text-slate-500 flex flex-col gap-1.5">
                <li className="flex items-center gap-1.5">
                  <span className="text-teal-500">✓</span> Todo lo anterior
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-teal-500">✓</span> Detalles completos
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-teal-500">✓</span> Salario y ubicación
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-teal-500">✓</span> Contacto directo
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-teal-500">✓</span> Vacantes ilimitadas
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Precio y botón */}
        <div className="p-6">
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-3xl font-bold text-slate-800">$199</span>
            <span className="text-slate-500 text-sm">MXN / mes</span>
          </div>
          <button
            onClick={() => {}}
            className="w-full py-3 bg-teal-600 text-white rounded-xl text-sm font-medium hover:opacity-90"
          >
            Suscribirse a Premium
          </button>
          <p className="text-center text-xs text-slate-400 mt-3">
            Cancela cuando quieras · Sin compromisos
          </p>
        </div>
      </div>
    </div>
  )

  //PUBLIC PROFILE SECTION
}


  function PublicProfileSection({ profile }: { profile: CandidateProfile | null }) {
  const supabase = createClient()
  const [cvText, setCvText] = useState(profile?.cv_text || "")
  const [isPublic, setIsPublic] = useState(profile?.cv_public || false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleUploadCV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/parse-cv", { method: "POST", body: formData })
    const data = await res.json()
    if (data.text) setCvText(data.text)
    setUploading(false)
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from("candidate_profiles")
      .update({ cv_text: cvText, cv_public: isPublic })
      .eq("id", user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="flex flex-col gap-5">

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-semibold text-slate-800">Perfil público</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Las empresas podrán encontrarte cuando busquen candidatos
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-slate-600">
              {isPublic ? "Visible" : "Oculto"}
            </span>
            <div
              onClick={() => setIsPublic(!isPublic)}
              className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                isPublic ? "bg-teal-500" : "bg-slate-200"
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                isPublic ? "translate-x-5" : "translate-x-1"
              }`} />
            </div>
          </label>
        </div>

        {isPublic && (
          <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 mb-4">
            <p className="text-xs text-teal-700">
              Tu perfil está visible. Las empresas pueden encontrarte al buscar candidatos.
            </p>
          </div>
        )}

        {!isPublic && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-4">
            <p className="text-xs text-slate-500">
              Tu perfil está oculto. Actívalo para que las empresas puedan encontrarte.
            </p>
          </div>
        )}

        <label className="cursor-pointer flex items-center gap-2 text-sm text-slate-600 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 rounded-lg border border-slate-200 transition-all w-fit mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {uploading ? "Procesando..." : cvText ? "Cambiar CV" : "Subir CV (PDF)"}
          <input type="file" accept=".pdf" className="hidden" onChange={handleUploadCV} disabled={uploading} />
        </label>

        {cvText && (
          <div className="bg-slate-50 rounded-xl p-4 mb-4">
            <p className="text-xs font-medium text-slate-600 mb-2">Vista previa del CV</p>
            <p className="text-xs text-slate-500 line-clamp-4">{cvText}</p>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !cvText}
          className="w-full py-2.5 rounded-lg text-sm font-medium text-white bg-teal-600 hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving ? "Guardando..." : saved ? "Guardado ✓" : "Guardar perfil público"}
        </button>
      </div>

      {/* Info del perfil actual */}
      {profile && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-medium text-slate-700 mb-3">Lo que verán las empresas</h3>
          <div className="flex flex-col gap-2">
            {[
              { label: "Puesto deseado", value: profile.desired_position },
              { label: "Área", value: profile.desired_area },
              { label: "Modalidad", value: profile.work_modality },
              { label: "Ubicación", value: profile.location },
              { label: "Habilidades", value: profile.skills?.join(", ") },
            ].map(item => item.value && (
              <div key={item.label} className="flex gap-3 text-sm">
                <span className="text-slate-400 w-32 flex-shrink-0">{item.label}</span>
                <span className="text-slate-700">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}