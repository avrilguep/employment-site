"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import styles from "../onboarding.module.css"


const SKILLS_SUGERIDAS = [
  "JavaScript", "Python", "React", "Node.js", "SQL",
  "Excel", "Diseño gráfico", "Marketing digital", "Ventas",
  "Atención al cliente", "Gestión de proyectos", "inglés"
]

export default function CandidateOnboarding() {
  const router = useRouter()
  const supabase = createClient()

  const [position, setPosition] = useState("")
  const [area, setArea] = useState("")
  const [modality, setModality] = useState("")
  const [location, setLocation] = useState("")
  const [skills, setSkills] = useState<string[]>([])
  const [customSkill, setCustomSkill] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function toggleSkill(skill: string) {
    setSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  function addCustomSkill() {
    const s = customSkill.trim()
    if (s && !skills.includes(s)) {
      setSkills(prev => [...prev, s])
      setCustomSkill("")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No hay sesión activa")

      const { error } = await supabase
        .from("candidate_profiles")
        .upsert({
          id: user.id,
          desired_position: position,
          desired_area: area,
          work_modality: modality,
          location,
          skills,
        })

      if (error) throw error
      router.push("/dashboard/candidate")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocurrió un error")
    } 
  }


return (
  <main className={styles.main}>
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={`${styles.badge} ${styles.badgeCandidate}`}>Perfil de candidato</span>
        <h1 className={styles.title}>Cuéntanos sobre ti</h1>
        <p className={styles.subtitle}>Esta información ayuda a la IA a encontrar mejores vacantes para ti</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Puesto deseado</label>
          <input type="text" value={position} onChange={e => setPosition(e.target.value)}
            placeholder="Ej: Desarrollador frontend, Diseñador UX" required className={styles.input} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Área laboral</label>
          <select value={area} onChange={e => setArea(e.target.value)} required className={styles.select}>
            <option value="">Selecciona un área</option>
            <option>Tecnología</option><option>Marketing</option><option>Ventas</option>
            <option>Diseño</option><option>Finanzas</option><option>Recursos Humanos</option>
            <option>Operaciones</option><option>Legal</option><option>Otro</option>
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Modalidad de trabajo</label>
          <div className={styles.modalityGroup}>
            {["presencial", "hibrido", "remoto"].map(m => (
              <button key={m} type="button" onClick={() => setModality(m)}
                className={`${styles.modalityBtn} ${modality === m ? styles.modalityBtnActiveCandidate : ""}`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Ubicación</label>
          <input type="text" value={location} onChange={e => setLocation(e.target.value)}
            placeholder="Ej: Ciudad de México, Monterrey" className={styles.input} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Habilidades</label>
          <div className={styles.chipsGroup}>
            {SKILLS_SUGERIDAS.map(skill => (
              <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                className={`${styles.chip} ${skills.includes(skill) ? styles.chipActiveCandidate : ""}`}>
                {skill}
              </button>
            ))}
          </div>
          <div className={styles.customSkillRow}>
            <input type="text" value={customSkill} onChange={e => setCustomSkill(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomSkill())}
              placeholder="Agregar otra habilidad..." className={styles.input} />
            <button type="button" onClick={addCustomSkill} className={styles.addBtn}>Agregar</button>
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" disabled={loading || !modality} className={`${styles.btn} ${styles.btnCandidate}`}>
          {loading ? "Guardando..." : "Guardar y continuar"}
        </button>
      </form>
    </div>
  </main>
)
}