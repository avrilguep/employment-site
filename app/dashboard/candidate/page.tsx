"use client"

import type { CandidateProfile, Message, Job } from "@/app/types/candidate"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import styles from "../dashboard.module.css"

export default function CandidateDashboard() {
  const [activeTab, setActiveTab] = useState<"chat" | "jobs" | "external" | "profile">("chat")
  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/"); return }

    const { data } = await supabase
      .from("candidate_profiles")
      .select("*, profiles(full_name)")
      .eq("id", user.id)
      .single()

    setProfile({ ...data, full_name: data?.profiles?.full_name })
  }
    loadProfile()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <main className={styles.main}>
      <nav className={styles.navbar}>
        <div className={styles.navBrand}>
          <span className={styles.navTitle}>Employment Site</span>
          <span className={styles.badgeCandidate}>{profile?.full_name || "Candidato"}</span>
        </div>
        <button onClick={handleSignOut} className={styles.signOutBtn}>Cerrar sesión</button>
      </nav>

      <div className={styles.content}>
        {profile && (
          <div className={styles.welcomeBlock}>
            <h1 className={styles.welcomeTitle}>Hola, {profile?.full_name?.split(" ")[0]} 👋</h1>
            <p className={styles.welcomeSub}>
              Datos: <strong>{profile.desired_position}</strong> · {profile.work_modality} · {profile.location}
            </p>
          </div>
        )}

        <div className={styles.tabs}>
          {[
            { key: "chat", label: "Chat con IA" },
            { key: "jobs", label: "Buscar vacantes" },
            { key: "external", label: "Buscador externo" },
            { key: "profile", label: "Mi CV público" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as "chat" | "jobs" | "profile")}
              className={`${styles.tab} ${activeTab === tab.key ? styles.tabActiveCandidate : ""}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "chat" && <ChatSection profile={profile} />}
        {activeTab === "jobs" && <JobsSection profile={profile} />}
        {activeTab === "external" && <ExternalSearchSection profile={profile} />}
        {activeTab === "profile" && <PublicProfileSection profile={profile} />}

      </div>
    </main>
  )
}

function ChatSection({ profile }: { profile: CandidateProfile | null }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hola! Soy tu asistente de carrera. Puedo ayudarte a mejorar tu CV, prepararte para entrevistas o resolver dudas sobre tu búsqueda de empleo. ¿En qué te ayudo?" }
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
      setMessages(prev => [...prev, { role: "assistant", content: "¡CV cargado correctamente! Ya tengo el contexto de tu CV. ¿Qué quieres mejorar o preguntar?" }])
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
      body: JSON.stringify({ messages: newMessages, cvText, profile })
    })
    const data = await res.json()
    setMessages(prev => [...prev, { role: "assistant", content: data.reply || "Error al obtener respuesta." }])
    setLoading(false)
  }

  return (
    <div className={styles.chatCard}>
      <div className={styles.chatHeader}>
        <label className={styles.uploadLabel}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {cvText ? "CV cargado ✓" : "Subir mi CV (PDF)"}
          <input type="file" accept=".pdf" className="hidden" onChange={handleUploadCV} />
        </label>
        {cvText && <span className={styles.hint}>La IA ya tiene contexto de tu CV</span>}
      </div>

      <div className={styles.chatMessages}>
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? styles.chatRowUser : styles.chatRowAssistant}>
            <div className={m.role === "user" ? styles.bubbleUser : styles.bubbleAssistant}>
              {m.role === "user" ? m.content : (
                <ReactMarkdown components={{
                  p: ({children}) => <p className={styles.mdP}>{children}</p>,
                  strong: ({children}) => <strong className={styles.mdStrong}>{children}</strong>,
                  ul: ({children}) => <ul className={styles.mdUl}>{children}</ul>,
                  ol: ({children}) => <ol className={styles.mdOl}>{children}</ol>,
                  li: ({children}) => <li>{children}</li>,
                  h2: ({children}) => <h2 className={styles.mdH2}>{children}</h2>,
                  h3: ({children}) => <h3 className={styles.mdH3}>{children}</h3>,
                  code: ({children}) => <code className={styles.mdCode}>{children}</code>,
                }}>
                  {m.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className={styles.chatRowAssistant}>
            <div className={styles.bubbleTyping}>Escribiendo...</div>
          </div>
        )}
      </div>

      <div className={styles.chatInputRow}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Escribe tu pregunta..."
          className={styles.chatInput}
        />
        <button onClick={sendMessage} disabled={loading} className={styles.btnCandidate}>
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
  const [filters, setFilters] = useState({ position: "", location: "", modality: "", company_type: "" })

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
    <div className={styles.stack}>
      <div className={styles.card}>
        <p className={styles.cardTitle}>Tu CV (opcional pero recomendado)</p>
        <label className={styles.uploadLabel}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {uploading ? "Procesando..." : cvText ? "CV cargado ✓" : "Subir CV (PDF)"}
          <input type="file" accept=".pdf" className="hidden" onChange={handleUploadCV} disabled={uploading} />
        </label>
        {cvText && <p className={styles.hint}>La IA usará tu CV para mejores resultados</p>}
      </div>

      <div className={styles.card}>
        <p className={styles.cardTitle}>Filtros (opcionales)</p>
        <div className={styles.filterGrid}>
          {[
            { label: "Puesto específico", key: "position", placeholder: "Ej: Administrador" },
            { label: "Ubicación", key: "location", placeholder: "Ej: CDMX, Monterrey" },
            { label: "Tipo de empresa", key: "company_type", placeholder: "Ej: Startup, Tecnología" },
          ].map(f => (
            <div key={f.key}>
              <label className={styles.labelSm}>{f.label}</label>
              <input
                type="text"
                value={filters[f.key as keyof typeof filters]}
                onChange={e => setFilters(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className={styles.inputSm}
              />
            </div>
          ))}
          <div>
            <label className={styles.labelSm}>Modalidad</label>
            <select
              value={filters.modality}
              onChange={e => setFilters(prev => ({ ...prev, modality: e.target.value }))}
              className={styles.selectSm}
            >
              <option value="">Cualquiera</option>
              <option value="presencial">Presencial</option>
              <option value="hibrido">Híbrido</option>
              <option value="remoto">Remoto</option>
            </select>
          </div>
        </div>
      </div>

      <button onClick={searchJobs} disabled={loading} className={`${styles.btnCandidate} ${styles.btnFullWidth}`}>
        {loading ? "Buscando vacantes compatibles..." : "Buscar vacantes con IA"}
      </button>

      {!searched && (
        <p className={styles.emptyState}>Presiona buscar para ver vacantes recomendadas según tu perfil</p>
      )}
      {searched && !loading && jobs.length === 0 && (
        <p className={styles.emptyState}>No hay vacantes disponibles por el momento. Intenta con otros filtros.</p>
      )}

      {jobs.map((job, i) => (
        <div key={i} className={styles.card}>
          <div className={styles.itemRow}>
            <div style={{ flex: 1 }}>
              <div className={styles.itemTitleRow}>
                <h3 className={styles.itemTitle}>{job.title}</h3>
                {job.match_score && <span className={styles.badgeCandidate}>{job.match_score}% match</span>}
              </div>
              <p className={styles.itemSub}>{job.company_name} · {job.modality}</p>
              <div className={styles.lockedRow}>
                <div className={styles.lockedBox}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className={styles.lockedText}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className={styles.lockedText}>Ubicación, salario y detalles — Plan Premium</span>
                </div>
                <button onClick={() => handleViewDetails(job)} className={`${styles.btnCandidate} ${styles.btnSm}`}>
                  Ver detalles
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {showModal && selectedJob && <MembershipModal job={selectedJob} onClose={() => setShowModal(false)} />}
    </div>
  )
}

function MembershipModal({ job, onClose }: { job: Job; onClose: () => void }) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderRow}>
            <span className={styles.premiumBadge}>Contenido Premium</span>
            <button onClick={onClose} className={styles.modalClose}>×</button>
          </div>
          <h2 className={styles.modalTitle}>{job.title}</h2>
          <p className={styles.modalSub}>{job.company_name}</p>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.labelSm} style={{ marginBottom: "0.75rem" }}>Detalles de la vacante</p>
          <div className={styles.detailGrid}>
            {[
              { label: "Ubicación", value: job.location },
              { label: "Salario", value: job.salary_range || "No especificado" },
              { label: "Modalidad", value: job.modality },
              { label: "Industria", value: job.industry },
            ].map(item => (
              <div key={item.label} className={styles.detailUnlockRow}>
                <span className={styles.lockedText}>{item.label}</span>
                <div className={styles.lockedPill}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" className={styles.lockedText}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className={styles.lockedText}>Bloqueado</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.planGrid}>
            <div className={styles.planBox}>
              <p className={styles.planLabel}>Plan Gratis</p>
              {[
                { icon: "✓", color: styles.checkGreen, text: "Ver nombre empresa" },
                { icon: "✓", color: styles.checkGreen, text: "Ver puesto" },
                { icon: "✓", color: styles.checkGreen, text: "Chat con IA" },
                { icon: "✗", color: styles.crossRed, text: "Detalles completos" },
                { icon: "✗", color: styles.crossRed, text: "Salario y ubicación" },
              ].map(item => (
                <p key={item.text} className={styles.planItem}>
                  <span className={item.color}>{item.icon}</span> {item.text}
                </p>
              ))}
            </div>
            <div className={styles.planBoxHighlight}>
              <span className={styles.planBadge}>Recomendado</span>
              <p className={styles.planLabel}>Plan Premium</p>
              {["Todo lo anterior", "Detalles completos", "Salario y ubicación", "Contacto directo", "Vacantes ilimitadas"].map(text => (
                <p key={text} className={styles.planItem}>
                  <span className={styles.checkGreen}>✓</span> {text}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <div className={styles.priceRow}>
            <span className={styles.priceValue}>$79</span>
            <span className={styles.priceUnit}>MXN / mes</span>
          </div>
          <button onClick={() => {}} className={`${styles.btnCandidate} ${styles.btnFullWidth}`}>
            Suscribirse a Premium
          </button>
          <p className={styles.fineprint}>Cancela cuando quieras · Sin compromisos</p>
        </div>
      </div>
    </div>
  )
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
    await supabase.from("candidate_profiles").update({ cv_text: cvText, cv_public: isPublic }).eq("id", user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className={styles.stackLg}>
      <div className={styles.card}>
        <div className={styles.itemRow} style={{ marginBottom: "1rem" }}>
          <div>
            <p className={styles.cardTitle} style={{ marginBottom: "0.25rem" }}>Perfil público</p>
            <p className={styles.cardSub} style={{ marginBottom: 0 }}>Las empresas podrán encontrarte cuando busquen candidatos</p>
          </div>
          <div className={styles.toggleRow} onClick={() => setIsPublic(!isPublic)}>
            <span className={styles.toggleLabel}>{isPublic ? "Visible" : "Oculto"}</span>
            <div className={`${styles.toggleTrack} ${isPublic ? styles.toggleOn : styles.toggleOff}`}>
              <div className={`${styles.toggleThumb} ${isPublic ? styles.toggleThumbOn : styles.toggleThumbOff}`} />
            </div>
          </div>
        </div>

        <div className={isPublic ? styles.noticeOn : styles.noticeOff}>
          {isPublic
            ? "Tu perfil está visible. Las empresas pueden encontrarte al buscar candidatos."
            : "Tu perfil está oculto. Actívalo para que las empresas puedan encontrarte."}
        </div>

        <label className={styles.uploadLabel} style={{ marginBottom: "1rem", marginTop: "1rem" }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {uploading ? "Procesando..." : cvText ? "Cambiar CV" : "Subir CV (PDF)"}
          <input type="file" accept=".pdf" className="hidden" onChange={handleUploadCV} disabled={uploading} />
        </label>

        {cvText && (
          <div className={styles.previewBox}>
            <p className={styles.labelSm}>Vista previa del CV</p>
            <p className={styles.previewText}>{cvText}</p>
          </div>
        )}

        <button onClick={handleSave} disabled={saving || !cvText} className={`${styles.btnCandidate} ${styles.btnFullWidth}`}>
          {saving ? "Guardando..." : saved ? "Guardado ✓" : "Guardar perfil público"}
        </button>
      </div>

      {profile && (
        <div className={styles.card}>
          <p className={styles.cardTitle}>Lo que verán las empresas</p>
          <div className={styles.detailGrid}>
            {[
              { label: "Puesto deseado", value: profile.desired_position },
              { label: "Área", value: profile.desired_area },
              { label: "Modalidad", value: profile.work_modality },
              { label: "Ubicación", value: profile.location },
              { label: "Habilidades", value: profile.skills?.join(", ") },
            ].map(item => item.value && (
              <div key={item.label} className={styles.detailRow}>
                <span className={styles.detailLabel}>{item.label}</span>
                <span className={styles.detailValue}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  
}

function ExternalSearchSection({ profile }: { profile: CandidateProfile | null }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hola! Soy tu buscador de vacantes externas. Buscaré en internet empleos reales para ti. Puedes decirme qué tipo de trabajo buscas, subir tu CV para que lo analice, o ambas cosas. ¿Qué estás buscando?"
    }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
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
    if (data.text) {
      setCvText(data.text)
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "CV cargado. Ahora puedo buscar vacantes externas basándome en tu experiencia. ¿Qué tipo de empleo buscas o en qué ciudad?"
      }])
    }
    setUploading(false)
  }

  async function sendMessage() {
    if (!input.trim() || loading) return
    const newMessages: Message[] = [...messages, { role: "user", content: input }]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    const res = await fetch("/api/external-search", {
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
      content: data.reply || "No pude obtener resultados. Intenta de nuevo."
    }])
    setLoading(false)
  }

  return (
    <div className={styles.stack}>

      {/* Aviso */}
      <div className={styles.card} style={{ borderLeft: "3px solid #f59e0b" }}>
        <p className={styles.cardTitle} style={{ color: "#b45309" }}>Buscador externo</p>
        <p className={styles.cardSub}>
          Este buscador encuentra vacantes reales en internet usando IA. Los resultados provienen de búsquedas web en tiempo real. Ten en cuenta que no todas las empresas publican sus vacantes en línea.
        </p>
      </div>

      <div className={styles.chatCard}>
        {/* Upload CV */}
        <div className={styles.chatHeader}>
          <label className={styles.uploadLabel}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {uploading ? "Procesando..." : cvText ? "CV cargado ✓" : "Subir CV (opcional)"}
            <input type="file" accept=".pdf" className="hidden" onChange={handleUploadCV} disabled={uploading} />
          </label>
          {cvText && <span className={styles.hint}>La IA usará tu CV para buscar mejores coincidencias</span>}
        </div>

        {/* Mensajes */}
        <div className={styles.chatMessages}>
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? styles.chatRowUser : styles.chatRowAssistant}>
              <div className={m.role === "user" ? styles.bubbleUser : styles.bubbleAssistant}>
                {m.role === "user" ? m.content : (
                  <ReactMarkdown components={{
                    p: ({children}) => <p className={styles.mdP}>{children}</p>,
                    strong: ({children}) => <strong className={styles.mdStrong}>{children}</strong>,
                    ul: ({children}) => <ul className={styles.mdUl}>{children}</ul>,
                    ol: ({children}) => <ol className={styles.mdOl}>{children}</ol>,
                    li: ({children}) => <li>{children}</li>,
                    h2: ({children}) => <h2 className={styles.mdH2}>{children}</h2>,
                    h3: ({children}) => <h3 className={styles.mdH3}>{children}</h3>,
                    a: ({href, children}) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#0d9488", textDecoration: "underline" }}>
                        {children}
                      </a>
                    ),
                  }}>
                    {m.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className={styles.chatRowAssistant}>
              <div className={styles.bubbleTyping}>Buscando en internet...</div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className={styles.chatInputRow}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Ej: Busco trabajo de atención a clientes en CDMX remoto..."
            className={styles.chatInput}
          />
          <button onClick={sendMessage} disabled={loading} className={styles.btnCandidate}>
            Buscar
          </button>
        </div>
      </div>
    </div>
  )
}
