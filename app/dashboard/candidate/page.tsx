
"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"


export default function CandidateDashboard() {
  const [activeTab, setActiveTab] = useState<"chat" | "jobs">("chat")
  const [profile, setProfile] = useState<any>(null)
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
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "chat"
                ? "bg-teal-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
            }`}
          >
            Chat con IA
          </button>
          <button
            onClick={() => setActiveTab("jobs")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "jobs"
                ? "bg-teal-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
            }`}
          >
            Buscar vacantes
          </button>
        </div>

        {/* Contenido */}
        {activeTab === "chat" ? (
          <ChatSection profile={profile} />
        ) : (
          <JobsSection profile={profile} />
        )}

      </div>
    </main>
  )
}

function ChatSection({ profile }: { profile: any }) {
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

function JobsSection({ profile }: { profile: any }) {
  const [jobs, setJobs] = useState<any[]>([])
  const [summary, setSummary] = useState("")
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [cvText, setCvText] = useState("")
  const [uploading, setUploading] = useState(false)

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
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvText, profile })
    })
    const data = await res.json()
    setJobs(data.jobs || [])
    setSummary(data.summary || "")
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Subir CV */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-medium text-slate-700 mb-3">Sube tu CV para mejores resultados</h3>
        <label className="cursor-pointer flex items-center gap-2 text-sm text-slate-600 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 rounded-lg border border-slate-200 transition-all w-fit">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {uploading ? "Procesando..." : cvText ? "CV cargado ✓" : "Subir CV (PDF)"}
          <input type="file" accept=".pdf" className="hidden" onChange={handleUploadCV} disabled={uploading} />
        </label>
        {cvText && <p className="text-xs text-teal-600 mt-2">La IA usará tu CV para encontrar vacantes más compatibles</p>}
      </div>

      {/* Botón buscar */}
      <button
        onClick={searchJobs}
        disabled={loading}
        className="w-full py-3 bg-teal-600 text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {loading ? "La IA está buscando vacantes para ti..." : "Buscar vacantes con IA"}
      </button>

      {/* Análisis de la IA */}
      {summary && (
        <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4">
          <p className="text-xs font-medium text-teal-700 mb-1">Análisis de tu perfil</p>
          <p className="text-sm text-teal-800">{summary}</p>
        </div>
      )}

      {!searched && (
        <div className="text-center py-16 text-slate-400 text-sm">
          Sube tu CV y presiona buscar para ver vacantes recomendadas por la IA
        </div>
      )}

      {searched && !loading && jobs.length === 0 && (
        <div className="text-center py-16 text-slate-400 text-sm">
          No se encontraron vacantes. Intenta actualizar tu perfil con más detalles.
        </div>
      )}

      {jobs.map((job, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-teal-200 transition-all">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-slate-800">{job.title}</h3>
              <p className="text-sm text-slate-500 mt-0.5">{job.company} · {job.location}</p>
              <p className="text-sm text-slate-600 mt-2">{job.description}</p>
            </div>
            {job.salary && (
              <span className="text-xs font-medium px-3 py-1 bg-teal-50 text-teal-700 rounded-full whitespace-nowrap">
                {job.salary}
              </span>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-400">{job.source}</span>
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-teal-600 hover:underline font-medium"
            >
              Ver vacante
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}