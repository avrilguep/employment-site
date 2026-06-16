"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"

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
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 w-full max-w-lg">

        <div className="mb-6">
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-teal-50 text-teal-700">
            Perfil de candidato
          </span>
          <h1 className="text-2xl font-bold text-slate-800 mt-3">Cuéntanos sobre ti</h1>
          <p className="text-sm text-slate-500 mt-1">Esta información ayuda a la IA a encontrar mejores vacantes para ti</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          <div>
            <label className="text-sm text-slate-600 mb-1 block">Puesto deseado</label>
            <input
              type="text"
              value={position}
              onChange={e => setPosition(e.target.value)}
              placeholder="Ej: Desarrollador frontend, Diseñador UX"
              required
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-slate-400"
            />
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-1 block">Área laboral</label>
            <select
              value={area}
              onChange={e => setArea(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-slate-400 bg-white"
            >
              <option value="">Selecciona un área</option>
              <option>Tecnología</option>
              <option>Marketing</option>
              <option>Ventas</option>
              <option>Diseño</option>
              <option>Finanzas</option>
              <option>Recursos Humanos</option>
              <option>Operaciones</option>
              <option>Legal</option>
              <option>Otro</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-1 block">Modalidad de trabajo</label>
            <div className="flex gap-3">
              {["presencial", "hibrido", "remoto"].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModality(m)}
                  className={`flex-1 py-2 rounded-lg text-sm border transition-all capitalize ${
                    modality === m
                      ? "border-teal-500 bg-teal-50 text-teal-700 font-medium"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-1 block">Ubicación</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Ej: Ciudad de México, Monterrey"
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-slate-400"
            />
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-2 block">Habilidades</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {SKILLS_SUGERIDAS.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`px-3 py-1 rounded-full text-xs border transition-all ${
                    skills.includes(skill)
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customSkill}
                onChange={e => setCustomSkill(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomSkill())}
                placeholder="Agregar otra habilidad..."
                className="flex-1 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-slate-400"
              />
              <button
                type="button"
                onClick={addCustomSkill}
                className="px-4 py-2 bg-slate-100 rounded-lg text-sm text-slate-600 hover:bg-slate-200"
              >
                Agregar
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !modality}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white bg-teal-600 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar y continuar"}
          </button>

        </form>
      </div>
    </main>
  )
}