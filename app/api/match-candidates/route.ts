import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { posting } = await req.json()

    const { data: candidates } = await supabase
      .from("candidate_profiles")
      .select("*, profiles(full_name)")
      .eq("cv_public", true)

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ candidates: [] })
    }

    const prompt = `Eres un experto en reclutamiento. Analiza qué candidatos son compatibles con esta vacante.

Vacante: ${posting.title}
Descripción: ${posting.description}
Habilidades requeridas: ${posting.required_skills?.join(", ")}
Modalidad: ${posting.modality}
Ubicación: ${posting.location}

Candidatos disponibles:
${candidates.map((c: any, i: number) => `
Candidato ${i + 1}:
- Nombre: ${c.profiles?.full_name}
- Puesto deseado: ${c.desired_position}
- Área: ${c.desired_area}
- Modalidad: ${c.work_modality}
- Ubicación: ${c.location}
- Habilidades: ${c.skills?.join(", ")}
`).join("\n")}

Responde ÚNICAMENTE con un JSON con este formato, sin texto adicional:
{
  "matches": [
    { "index": 0, "match_score": 85 },
    { "index": 2, "match_score": 72 }
  ]
}
Solo incluye candidatos con match_score mayor a 50. Ordena de mayor a menor score.`

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }]
    })

    const text = response.content[0].type === "text" ? response.content[0].text : "{}"
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim())

    const result = (parsed.matches || []).map((m: any) => ({
      ...candidates[m.index],
      full_name: candidates[m.index].profiles?.full_name,
      match_score: m.match_score
    }))

    return NextResponse.json({ candidates: result })

  } catch (error: any) {
    console.error("Match candidates error:", error)
    return NextResponse.json({ candidates: [] }, { status: 500 })
  }
}