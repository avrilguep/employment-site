"use client"

import type { CompanyProfile, Posting, Candidate, CVFile } from "@/app/types/company"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import styles from "../dashboard.module.css"

const SKILLS_SUGERIDAS = [
  "Microsoft Office", "Excel avanzado", "Trabajo en equipo",
  "Comunicación efectiva", "Liderazgo", "Gestión de proyectos",
  "Atención al cliente", "Ventas", "Negociación",
  "Inglés", "Francés", "Análisis de datos",
  "Redes sociales", "Marketing digital", "Contabilidad",
  "Recursos humanos", "Logística", "Diseño gráfico",
  "Resolución de problemas", "Trabajo bajo presión"
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

    const { data: companyData } = await supabase
      .from("company_profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()

    setProfile({ ...companyData, full_name: profileData?.full_name })
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

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <span className={styles.badgeCompany}>
              {profile?.company_name || "Empresa"}
            </span>
            
          </div>

          {profile?.full_name && (
              <span style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                {profile.full_name}
              </span>
            )}

        </div>
        <button onClick={handleSignOut} className={styles.signOutBtn}>Cerrar sesión</button>
      </nav>

      <div className={styles.content}>

        {profile && (
          <div className={styles.welcomeBlock}>
            <h1 className={styles.welcomeTitle}>
              Hola, {profile?.full_name?.split(" ")[0]} 👋
            </h1>
            <p className={styles.welcomeSub}>
              {profile.company_name} · {profile.industry}
            </p>
          </div>
        )}
        
        <div className={styles.tabs}>
          {[
            { key: "postings", label: "Mis vacantes" },
            { key: "publish", label: "Publicar vacante" },
            { key: "analyze", label: "Analizar CVs externos" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as "publish" | "postings" | "analyze")}
              className={`${styles.tab} ${activeTab === tab.key ? styles.tabActiveCompany : ""}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "publish" && (
          <PublishSection
            onPublished={() => setActiveTab("postings")}
            companyName={profile?.company_name || "Una empresa"}
          />
        )}
        {activeTab === "postings" && <PostingsSection />}
        {activeTab === "analyze" && <AnalyzeSection profile={profile} />}
      </div>
    </main>
  )
}

function PublishSection({ onPublished, companyName }: { onPublished: () => void, companyName: string }) {
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
      const { data, error } = await supabase.from("job_postings").insert({
        company_id: user.id,
        title,
        description,
        required_skills: skills,
        modality,
        location,
        salary_range: salaryRange,
      }).select().single()
      if (error) throw error

      // Notificar candidatos compatibles
      const newPosting = {
        title,
        description,
        required_skills: skills,
        modality,
        location,
        salary_range: salaryRange,
        id: data?.id,
        company_id: user.id
      }
      fetch("/api/notify-candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posting: newPosting,
          company_name: companyName || "Una empresa"
        })
      })

      onPublished()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocurrió un error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.card}>
      <p className={styles.cardTitle}>Nueva vacante</p>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Puesto</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Ej: Ejecutivo de ventas" required className={styles.input} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Descripción del puesto</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Describe las responsabilidades, el equipo y el ambiente de trabajo..."
            rows={4} className={styles.textarea} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Habilidades requeridas</label>
          <div className={styles.chipsGroup}>
            {SKILLS_SUGERIDAS.map(skill => (
              <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                className={`${styles.chip} ${skills.includes(skill) ? styles.chipActiveCompany : ""}`}>
                {skill}
              </button>
            ))}
          </div>
          <div className={styles.customSkillRow}>
            <input type="text" value={customSkill} onChange={e => setCustomSkill(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomSkill())}
              placeholder="Agregar habilidad..." className={styles.input} />
            <button type="button" onClick={addCustomSkill} className={styles.btnGhost}>
              Agregar
            </button>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Modalidad</label>
          <div className={styles.modalityGroup}>
            {["presencial", "hibrido", "remoto"].map(m => (
              <button key={m} type="button" onClick={() => setModality(m)}
                className={`${styles.modalityBtn} ${modality === m ? styles.modalityBtnActiveCompany : ""}`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.formGrid2}>
          <div className={styles.field}>
            <label className={styles.label}>Ubicación</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)}
              placeholder="Ej: Ciudad de México" className={styles.input} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Rango salarial mensual</label>
            <input type="text" value={salaryRange} onChange={e => setSalaryRange(e.target.value)}
              placeholder="Ej: $20,000 - $30,000" className={styles.input} />
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" disabled={loading || !modality} className={`${styles.btnCompany} ${styles.btnFullWidth}`}>
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
      const { data } = await supabase.from("job_postings").select("*")
        .eq("company_id", user.id).order("created_at", { ascending: false })
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

  if (loading) return <p className={styles.emptyStateLg}>Cargando...</p>
  if (postings.length === 0) return <p className={styles.emptyStateLg}>No has publicado ninguna vacante todavía.</p>

  return (
    <div className={styles.stack}>
      {postings.map(posting => (
        <div key={posting.id} className={styles.card}>
          <div className={styles.itemRow}>
            <div>
              <div className={styles.itemTitleRow}>
                <h3 className={styles.itemTitle}>{posting.title}</h3>
                <span className={posting.active ? styles.badgeActive : styles.badgeInactive}>
                  {posting.active ? "Activa" : "Inactiva"}
                </span>
              </div>
              <p className={styles.itemSub}>
                {posting.modality} · {posting.location}{posting.salary_range && ` · ${posting.salary_range}`}
              </p>
              {posting.required_skills?.length > 0 && (
                <div className={styles.chipsGroup} style={{ marginTop: "0.5rem" }}>
                  {posting.required_skills.map(s => (
                    <span key={s} className={styles.chipStatic}>{s}</span>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.actionsCol}>
              <button onClick={() => searchCandidates(posting)} className={`${styles.btnCompany} ${styles.btnSm}`}>
                Buscar candidatos
              </button>
              <button onClick={() => toggleActive(posting.id, posting.active)} className={styles.linkBtn}>
                {posting.active ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>

          {selectedPosting?.id === posting.id && (
            <div className={styles.divider}>
              {searching ? (
                <p className={styles.emptyState}>Buscando candidatos compatibles...</p>
              ) : candidates.length === 0 ? (
                <p className={styles.emptyState}>No se encontraron candidatos compatibles aún.</p>
              ) : (
                <div className={styles.stack}>
                  <p className={styles.itemSub} style={{ fontWeight: 500, color: "#334155" }}>
                    {candidates.length} candidato{candidates.length !== 1 ? "s" : ""} compatible{candidates.length !== 1 ? "s" : ""}
                  </p>
                  {candidates.map((c, i) => <CandidateCard key={i} candidate={c} />)}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function AnalyzeSection({ profile }: { profile: CompanyProfile | null }) {
  const [cvFiles, setCvFiles] = useState<CVFile[]>([])
  const [requirements, setRequirements] = useState("")
  const [analysis, setAnalysis] = useState("")
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function handleUploadCVs(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    const parsed: CVFile[] = []
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
    <div className={styles.stack}>
      <div className={styles.card}>
        <p className={styles.cardTitle}>Subir CVs externos</p>
        <p className={styles.cardSub}>Sube CVs de candidatos externos para que la IA elija al mejor</p>
        <label className={styles.uploadDashed}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span>{uploading ? "Procesando CVs..." : "Haz clic para subir CVs (PDF)"}</span>
          <input type="file" accept=".pdf" multiple className="hidden" onChange={handleUploadCVs} disabled={uploading} />
        </label>
        {cvFiles.length > 0 && (
          <div className={styles.stack} style={{ marginTop: "1rem", gap: "0.5rem" }}>
            {cvFiles.map((cv, i) => (
              <div key={i} className={styles.fileRow}>
                <span className={styles.fileName}>{cv.name}</span>
                <button onClick={() => setCvFiles(prev => prev.filter((_, j) => j !== i))} className={styles.linkBtn}>
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.card}>
        <p className={styles.cardTitle}>Requerimientos</p>
        <textarea value={requirements} onChange={e => setRequirements(e.target.value)}
          placeholder="Describe el puesto y los requisitos..." rows={4} className={styles.textarea} />
      </div>

      <button onClick={analyzeCanditates} disabled={loading || !cvFiles.length || !requirements.trim()}
        className={`${styles.btnCompany} ${styles.btnFullWidth}`}>
        {loading ? "Analizando..." : `Analizar ${cvFiles.length} candidato${cvFiles.length !== 1 ? "s" : ""}`}
      </button>

      {analysis && (
        <div className={styles.card}>
          <p className={styles.cardTitle}>Análisis de la IA</p>
          <div>
            <ReactMarkdown components={{
              p: ({children}) => <p className={styles.mdP}>{children}</p>,
              strong: ({children}) => <strong className={styles.mdStrong}>{children}</strong>,
              ul: ({children}) => <ul className={styles.mdUl}>{children}</ul>,
              ol: ({children}) => <ol className={styles.mdOl}>{children}</ol>,
              li: ({children}) => <li>{children}</li>,
              h2: ({children}) => <h2 className={styles.mdH2}>{children}</h2>,
              h3: ({children}) => <h3 className={styles.mdH3}>{children}</h3>,
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
      <div className={styles.previewBox}>
        <div className={styles.itemRow}>
          <div>
            <p className={styles.itemTitle} style={{ fontSize: "0.875rem" }}>{candidate.full_name}</p>
            <p className={styles.itemSub} style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
              {candidate.desired_position} · {candidate.work_modality} · {candidate.location}
            </p>
            {candidate.skills?.length > 0 && (
              <div className={styles.chipsGroup} style={{ marginTop: "0.5rem" }}>
                {candidate.skills.slice(0, 5).map(s => (
                  <span key={s} className={styles.chip}>{s}</span>
                ))}
              </div>
            )}
          </div>
          <div className={styles.actionsCol}>
            {candidate.match_score && (
              <span className={styles.matchCompany}>{candidate.match_score}% match</span>
            )}
            <button onClick={() => setShowModal(true)} className={`${styles.btnCompany} ${styles.btnXs}`}>
              Ver CV
            </button>
          </div>
        </div>
      </div>
      {showModal && <CVModal candidate={candidate} onClose={() => setShowModal(false)} />}
    </>
  )
}

//funcion para formatear el texto del CV como markdown, agregando saltos de linea entre secciones y resaltando títulos comunes como "Experiencia", "Educación", "Habilidades", etc.
function formatCVAsMarkdown(cvText: string): string {
    const lines = cvText.split("\n").filter(l => l.trim() !== "")
    let result = ""

    const sectionKeywords = [
      "perfil", "experiencia", "educación", "educacion", "habilidades",
      "competencias", "skills", "idiomas", "certificaciones", "proyectos",
      "formación", "formacion", "cursos", "logros", "referencias"
    ]

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      const isSection = sectionKeywords.some(k =>
        trimmed.toLowerCase().startsWith(k) && trimmed.length < 40
      )

      const isName = lines.indexOf(line) === 0

      if (isName) {
        result += `## ${trimmed}\n\n`
      } else if (isSection) {
        result += `\n### ${trimmed}\n\n`
      } else if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*")) {
        result += `- ${trimmed.replace(/^[•\-*]\s*/, "")}\n`
      } else if (trimmed.match(/^\d{4}/)) {
        result += `**${trimmed}**\n\n`
      } else {
        result += `${trimmed}\n\n`
      }
    }

    return result
  }

function CVModal({ candidate, onClose }: { candidate: Candidate; onClose: () => void }) {
  function downloadCV() {
    const content = `CV - ${candidate.full_name}\n${"=".repeat(40)}\nPuesto deseado: ${candidate.desired_position}\nÁrea: ${candidate.desired_area}\nModalidad: ${candidate.work_modality}\nUbicación: ${candidate.location}\nHabilidades: ${candidate.skills?.join(", ")}\n\n${"=".repeat(40)}\nCV COMPLETO\n${"=".repeat(40)}\n\n${candidate.cv_text || "No disponible"}`
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `CV_${candidate.full_name?.replace(/ /g, "_") || "candidato"}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBoxLg} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderRowTop}>
            <div>
              <h2 className={styles.modalTitle}>{candidate.full_name}</h2>
              <p className={styles.modalSub}>
                {candidate.desired_position} · {candidate.work_modality} · {candidate.location}
              </p>
              {candidate.match_score && (
                <span className={`${styles.chip} ${styles.chipActiveCompany}`} style={{ marginTop: "0.5rem", display: "inline-block" }}>
                  {candidate.match_score}% compatible
                </span>
              )}
            </div>
            <button onClick={onClose} className={styles.modalClose}>×</button>
          </div>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.filterGrid}>
            {[
              { label: "Área", value: candidate.desired_area },
              { label: "Modalidad", value: candidate.work_modality },
              { label: "Ubicación", value: candidate.location },
              { label: "Habilidades", value: candidate.skills?.join(", ") },
            ].map(item => item.value && (
              <div key={item.label}>
                <p className={styles.labelSm}>{item.label}</p>
                <p className={styles.detailValue} style={{ marginTop: "0.25rem" }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.modalBodyScroll}>
          <p className={styles.labelSm} style={{ marginBottom: "0.75rem" }}>CV completo</p>
          {candidate.cv_text ? (
            <ReactMarkdown
              components={{
                p: ({children}) => <p style={{ fontSize: "13px", color: "#475569", marginBottom: "8px" }}>{children}</p>,
                strong: ({children}) => <strong style={{ fontWeight: 600, color: "#1e293b" }}>{children}</strong>,
                h2: ({children}) => <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginTop: "16px", marginBottom: "8px", paddingBottom: "4px", borderBottom: "1px solid #f1f5f9" }}>{children}</h2>,
                h3: ({children}) => <h3 style={{ fontSize: "13px", fontWeight: 600, color: "#334155", marginTop: "12px", marginBottom: "6px", paddingBottom: "4px", borderBottom: "1px solid #f1f5f9" }}>{children}</h3>,
                ul: ({children}) => <ul style={{ paddingLeft: "16px", marginBottom: "8px" }}>{children}</ul>,
                li: ({children}) => <li style={{ fontSize: "13px", color: "#475569", marginBottom: "4px" }}>{children}</li>,
                hr: () => <hr style={{ border: "none", borderTop: "1px solid #f1f5f9", margin: "12px 0" }} />,
              }}
            >
              {formatCVAsMarkdown(candidate.cv_text)}
            </ReactMarkdown>
          ) : (
            <p className={styles.emptyState} style={{ padding: 0 }}>El candidato no ha subido su CV.</p>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button onClick={downloadCV} className={`${styles.btnCompany} ${styles.btnFullWidth} ${styles.btnIconRow}`}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Descargar CV
          </button>
        </div>
      </div>
    </div>
  )
}
