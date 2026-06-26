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
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {profile && <NotificationBell candidateId={profile.id} />}
          <button onClick={handleSignOut} className={styles.signOutBtn}>Cerrar sesión</button>
        </div>
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
  const supabase = createClient()
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    async function checkPremium() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from("candidate_profiles")
        .select("is_premium")
        .eq("id", user.id)
        .single()
      if (data?.is_premium) setIsPremium(true)
    }
    checkPremium()
  }, [])

  async function handleSubscribe() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from("candidate_profiles")
      .update({ is_premium: true })
      .eq("id", user.id)
    setIsPremium(true)
  }

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
              {isPremium ? (
                <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  {job.location && (
                    <p style={{ fontSize: "0.8rem", color: "#475569" }}>📍 {job.location}</p>
                  )}
                  {job.salary_range && (
                    <p style={{ fontSize: "0.8rem", color: "#475569" }}>💰 {job.salary_range}</p>
                  )}
                  {job.industry && (
                    <p style={{ fontSize: "0.8rem", color: "#475569" }}>🏢 {job.industry}</p>
                  )}
                </div>
              ) : (
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
              )}
            </div>
          </div>
        </div>
      ))}

      {showModal && selectedJob && (
        <MembershipModal
          job={selectedJob}
          onClose={() => setShowModal(false)}
          onSubscribe={handleSubscribe}
          isPremium={isPremium}
        />
      )}        
    </div>
  )
}

function MembershipModal({ job, onClose, onSubscribe, isPremium }: {
  job: Job
  onClose: () => void
  onSubscribe: () => void
  isPremium: boolean
}) {
  if (isPremium) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalBox} onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className={styles.modalHeader}>
            <div className={styles.modalHeaderRow}>
              <span style={{
                fontSize: "0.75rem", fontWeight: 500, padding: "0.2rem 0.6rem",
                borderRadius: "999px", background: "#d1fae5", color: "#059669"
              }}>
                ✓ Premium
              </span>
              <button onClick={onClose} className={styles.modalClose}>×</button>
            </div>
            <h2 className={styles.modalTitle}>{job.title}</h2>
            <p className={styles.modalSub}>{job.company_name}</p>
            {job.match_score && (
              <span style={{
                fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.75rem",
                borderRadius: "999px", background: "#d1fae5", color: "#059669",
                display: "inline-block", marginTop: "0.5rem"
              }}>
                {job.match_score}% compatible
              </span>
            )}
          </div>

          {/* Detalles completos */}
          <div className={styles.modalBody}>
            <p className={styles.labelSm} style={{ marginBottom: "0.75rem" }}>
              Detalles de la vacante
            </p>
            <div className={styles.detailGrid}>
              {[
                { label: "📍 Ubicación", value: job.location },
                { label: "💰 Salario", value: job.salary_range },
                { label: "🏢 Modalidad", value: job.modality },
                { label: "🏭 Industria", value: job.industry },
              ].map(item => item.value && (
                <div key={item.label} className={styles.detailRow}>
                  <span className={styles.detailLabel}>{item.label}</span>
                  <span className={styles.detailValue}>{item.value}</span>
                </div>
              ))}
            </div>
            
            {job.description && (
              <div style={{ marginTop: "1rem" }}>
                <p className={styles.labelSm} style={{ marginBottom: "0.5rem" }}>
                  Descripción
                </p>
                <p style={{ fontSize: "0.875rem", color: "#475569", lineHeight: 1.6 }}>
                  {job.description}
                </p>
              </div>
            )}

             {(job.phone || job.email) && (
              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #f1f5f9" }}>
                <p className={styles.labelSm} style={{ marginBottom: "0.5rem" }}>
                  Contacto directo
                </p>
                {job.phone && (
                  <p style={{ fontSize: "0.875rem", color: "#475569", marginBottom: "0.25rem" }}>
                    📞 {job.phone}
                  </p>
                )}
                {job.email && (
                  <a
                    href={`mailto:${job.email}`}
                    style={{ fontSize: "0.875rem", color: "#10b981", textDecoration: "none" }}
                  >
                    ✉️ {job.email}
                  </a>
                )}
              </div>
            )}
          </div>

          <div className={styles.modalFooter}>
            <button onClick={onClose} className={`${styles.btnCandidate} ${styles.btnFullWidth}`}>
              Cerrar
            </button>
          </div>

        </div>
      </div>
    )
  }

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
              { label: "Ubicación" },
              { label: "Salario" },
              { label: "Modalidad" },
              { label: "Industria" },
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
              {["Todo lo anterior", "Detalles completos", "Salario y ubicación", "Contacto directo", "Vacantes ilimitadas", "Notificaciones completas"].map(text => (
                <p key={text} className={styles.planItem}>
                  <span className={styles.checkGreen}>✓</span> {text}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <div className={styles.priceRow}>
            <span className={styles.priceValue}>$119</span>
            <span className={styles.priceUnit}>MXN / mes</span>
          </div>
          <button
            onClick={onSubscribe}
            className={`${styles.btnCandidate} ${styles.btnFullWidth}`}
          >
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
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [cvText, setCvText] = useState("")
  const [uploading, setUploading] = useState(false)
  const [filters, setFilters] = useState({
    position: profile?.desired_position || "",
    location: profile?.location || "",
    modality: profile?.work_modality || "",
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
    setJobs([])
    const res = await fetch("/api/external-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filters, cvText, profile })
    })
    const data = await res.json()
    setJobs(data.jobs || [])
    setLoading(false)
  }

  return (
    <div className={styles.stack}>

      {/* Aviso */}
      <div className={styles.card} style={{ borderLeft: "3px solid #f59e0b" }}>
        <p className={styles.cardTitle} style={{ color: "#b45309", marginBottom: "0.25rem" }}>
          Buscador externo
        </p>
        <p className={styles.cardSub} style={{ marginBottom: 0 }}>
          Este buscador encuentra vacantes reales en internet usando IA. Los resultados provienen de las búsquedas web en tiempo real, pueden variar según el contexto que le des a la IA (tu CV, tus filtros, tu perfil). Es recomendable subir tu CV para mejores resultados. <b>¡Ten en cuenta que no todas las empresas publican sus vacantes en línea!</b>
        </p>
      </div>

      {/* Formulario */}
      <div className={styles.card}>
        <p className={styles.cardTitle}>¿Qué trabajo buscas?</p>

        <div className={styles.filterGrid} style={{ marginBottom: "1rem" }}>
          <div>
            <label className={styles.labelSm}>Puesto</label>
            <input
              type="text"
              value={filters.position}
              onChange={e => setFilters(prev => ({ ...prev, position: e.target.value }))}
              placeholder="Ej: Contador público, Diseñador"
              className={styles.inputSm}
            />
          </div>
          <div>
            <label className={styles.labelSm}>Ubicación</label>
            <input
              type="text"
              value={filters.location}
              onChange={e => setFilters(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Ej: CDMX, Puebla, Monterrey"
              className={styles.inputSm}
            />
          </div>
          <div>
            <label className={styles.labelSm}>Tipo de empresa (opcional)</label>
            <input
              type="text"
              value={filters.company_type}
              onChange={e => setFilters(prev => ({ ...prev, company_type: e.target.value }))}
              placeholder="Ej: Startup, Despacho, Corporativo"
              className={styles.inputSm}
            />
          </div>
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

        {/* CV opcional */}
        <div style={{ marginBottom: "1rem" }}>
          <label className={styles.labelSm}>CV (opcional — mejora los resultados)</label>
          <label className={styles.uploadLabel}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {uploading ? "Procesando..." : cvText ? "CV cargado ✓" : "Subir CV (PDF)"}
            <input type="file" accept=".pdf" className="hidden" onChange={handleUploadCV} disabled={uploading} />
          </label>
        </div>

        <button
          onClick={searchJobs}
          disabled={loading || !filters.position.trim()}
          className={`${styles.btnCandidate} ${styles.btnFullWidth}`}
        >
          {loading ? "Buscando en internet..." : "Buscar vacantes externas"}
        </button>
      </div>

      {/* Estados */}
      {!searched && (
        <p className={styles.emptyState}>
          Llena el puesto y presiona buscar para encontrar vacantes en internet
        </p>
      )}

      {searched && loading && (
        <div className={styles.card} style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
            La IA está buscando vacantes en internet...
          </p>
        </div>
      )}

      {searched && !loading && jobs.length === 0 && (
        <p className={styles.emptyState}>
          No se encontraron vacantes. Intenta con otros términos.
        </p>
      )}

      {/* Resultados */}
      {jobs.map((job, i) => (
        <div key={i} className={`${styles.card} ${styles.cardHover}`}>
          <div className={styles.itemTitleRow}>
            <h3 className={styles.itemTitle}>{job.title}</h3>
            {job.modality && (
              <span className={styles.badgeActive}>{job.modality}</span>
            )}
          </div>
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>
            {job.company}
          </p>
          <p className={styles.itemSub} style={{ marginBottom: "0.5rem" }}>
            📍 {job.location}
            {job.salary && ` · 💰 ${job.salary}`}
          </p>
          {job.description && (
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.75rem", lineHeight: 1.5 }}>
              {job.description}
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
              vía {job.source}
            </span>
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btnCandidate}
              style={{ fontSize: "0.75rem", padding: "0.4rem 1rem", textDecoration: "none", borderRadius: "0.5rem" }}
            >
              Ver vacante
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}
function NotificationBell({ candidateId }: { candidateId: string }) {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const unread = notifications.filter(n => !n.read).length
  const [isPremium, setIsPremium] = useState(false)

   async function handleSubscribe() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from("candidate_profiles")
      .update({ is_premium: true })
      .eq("id", user.id)
    setIsPremium(true)
  }

  useEffect(() => {
    async function checkPremium() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from("candidate_profiles")
        .select("is_premium")
        .eq("id", user.id)
        .single()
      if (data?.is_premium) setIsPremium(true)
    }
    checkPremium()
  }, [])


  useEffect(() => {
    if (!candidateId) return
    async function load() {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("candidate_id", candidateId)
        .order("created_at", { ascending: false })
        .limit(10)
      setNotifications(data || [])
    }
    load()
  }, [candidateId])

  async function markAllRead() {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("candidate_id", candidateId)
      .eq("read", false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => { setOpen(!open); if (!open && unread > 0) markAllRead() }}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          position: "relative",
          padding: "0.25rem",
          color: "#64748b"
        }}
      >
        <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span style={{
            position: "absolute",
            top: "-2px",
            right: "-2px",
            background: "#ef4444",
            color: "white",
            fontSize: "0.65rem",
            fontWeight: 700,
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute",
          right: 0,
          top: "2rem",
          background: "white",
          borderRadius: "0.75rem",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          width: "300px",
          zIndex: 40,
          overflow: "hidden"
        }}>
          <div style={{
            padding: "0.75rem 1rem",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0f172a", margin: 0 }}>
              Notificaciones
            </p>
            {unread > 0 && (
              <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                {unread} nueva{unread !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div style={{ maxHeight: "360px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <p style={{ fontSize: "0.8rem", color: "#94a3b8", textAlign: "center", padding: "2rem" }}>
                No tienes notificaciones
              </p>
            ) : (
              notifications.map((n, i) => (
              <div key={i} style={{
                padding: "0.875rem 1rem",
                borderBottom: "1px solid #f8fafc",
                background: n.read ? "white" : "#f0fdf9"
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                  <div style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: n.read ? "#e2e8f0" : "#10b981",
                    flexShrink: 0,
                    marginTop: "5px"
                  }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "0.8rem", color: "#0f172a", margin: "0 0 0.25rem 0", fontWeight: 500 }}>
                      Nueva vacante compatible
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "#334155", margin: "0 0 0.25rem 0" }}>
                      <strong>{n.job_title}</strong> en {n.company_name}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.5rem" }}>
                      <span style={{
                        fontSize: "0.7rem",
                        background: "#d1fae5",
                        color: "#059669",
                        padding: "0.1rem 0.5rem",
                        borderRadius: "999px",
                        fontWeight: 600
                      }}>
                        {n.match_score}% match
                      </span>
                      <button
                        onClick={() => {
                          setSelectedJob({
                            title: n.job_title,
                            company_name: n.company_name,
                            match_score: n.match_score,
                            location: n.job_location,
                            salary_range: n.job_salary,
                            modality: n.job_modality,
                            description: n.job_description,
                            phone: n.job_phone,
                            email: n.job_email,
                            industry: null
                          })
                          setShowModal(true)
                          setOpen(false)
                        }}
                        style={{
                          fontSize: "0.7rem",
                          background: "#10b981",
                          color: "white",
                          border: "none",
                          borderRadius: "0.375rem",
                          padding: "0.25rem 0.625rem",
                          cursor: "pointer",
                          fontFamily: "Arial, sans-serif"
                        }}
                      >
                        Ver vacante
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
            )}

            
          </div>
        </div>
      )}

      {showModal && selectedJob && (
        <MembershipModal
          job={selectedJob}
          onClose={() => setShowModal(false)}
          onSubscribe={handleSubscribe}
          isPremium={isPremium}
        />
      )}
    </div>
  )
}