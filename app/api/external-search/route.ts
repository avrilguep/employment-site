import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface Filters {
  position: string
  location: string
  modality: string
  company_type: string
}

interface Profile {
  desired_position?: string
  desired_area?: string
  work_modality?: string
  location?: string
  skills?: string[]
}

interface ContentBlock {
  type: string
  text?: string
}

export async function POST(req: NextRequest) {
  try {
    const { filters, cvText, profile }: {
      filters: Filters
      cvText: string
      profile: Profile
    } = await req.json()

    const systemPrompt = `Eres un asistente experto en búsqueda de empleo en México y Latinoamérica.
Tu tarea es buscar vacantes reales en internet y devolverlas en formato JSON estructurado.

${cvText ? `CV del candidato:\n${cvText.slice(0, 800)}` : ""}
${profile?.skills ? `Habilidades del candidato: ${profile.skills.join(", ")}` : ""}

INSTRUCCIONES:
1. Busca vacantes reales y actuales en internet para el puesto y ubicación indicados
2. Busca en plataformas como OCC Mundial, Computrabajo, Indeed México, LinkedIn, Bumeran, Jobby
3. Devuelve ÚNICAMENTE un JSON válido con este formato exacto, sin texto adicional:
{
  "jobs": [
    {
      "title": "Nombre del puesto",
      "company": "Nombre de la empresa",
      "location": "Ciudad, Estado",
      "salary": "Rango salarial o null",
      "description": "Descripción breve de 1-2 líneas",
      "url": "URL directa a la vacante",
      "source": "Nombre de la plataforma",
      "modality": "presencial/híbrido/remoto o null"
    }
  ]
}
Devuelve máximo 6 vacantes reales con URLs válidas. Si no encuentras vacantes reales, devuelve {"jobs": []}`

    const userMessage = `Busca vacantes de: ${filters.position}
Ubicación: ${filters.location || "México"}
${filters.modality ? `Modalidad: ${filters.modality}` : ""}
${filters.company_type ? `Tipo de empresa: ${filters.company_type}` : ""}`

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: systemPrompt,
      tools: [
        {
          type: "web_search_20250305" as "web_search_20250305",
          name: "web_search"
        }
      ],
      messages: [{ role: "user", content: userMessage }]
    })

    const textBlocks = response.content.filter(
      (block: ContentBlock) => block.type === "text"
    )

    let jobs: object[] = []

    for (const block of textBlocks) {
      if (block.type === "text" && block.text) {
        try {
          const clean = block.text.replace(/```json|```/g, "").trim()
          const jsonMatch = clean.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            if (parsed.jobs && Array.isArray(parsed.jobs)) {
              jobs = parsed.jobs
              break
            }
          }
        } catch {
          continue
        }
      }
    }

    return NextResponse.json({ jobs })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido"
    console.error("External search error:", message)
    return NextResponse.json({ jobs: [] }, { status: 500 })
  }
}