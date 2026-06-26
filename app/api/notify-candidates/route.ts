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
    const { posting, company_name } = await req.json()

    const { data: candidates } = await supabase
      .from("candidate_profiles")
      .select("*, profiles(full_name)")
      .eq("cv_public", true)

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ notified: 0 })
    }

    const prompt = `Analiza qué candidatos son compatibles con esta vacante y asigna un score.

Vacante: ${posting.title}
Habilidades requeridas: ${posting.required_skills?.join(", ")}
Modalidad: ${posting.modality}
Ubicación: ${posting.location}

Candidatos:
${candidates.map((c: any, i: number) => `[${i}] ${c.profiles?.full_name} | ${c.desired_position} | ${c.work_modality} | ${c.location} | Skills: ${c.skills?.join(", ")}`).join("\n")}

Responde SOLO con JSON sin texto adicional:
{"matches":[{"index":0,"match_score":85}]}
Solo incluye candidatos con match_score mayor a 80.`

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }]
    })

    const text = response.content[0].type === "text" ? response.content[0].text.trim() : "{}"
    let parsed: { matches: { index: number; match_score: number }[] } = { matches: [] }

    try {
      parsed = JSON.parse(text.replace(/```json|```/g, "").trim())
    } catch {
      return NextResponse.json({ notified: 0 })
    }

    let notified = 0
    for (const match of parsed.matches || []) {
      const candidate = candidates[match.index]
      if (!candidate) continue

      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("candidate_id", candidate.id)
        .eq("job_posting_id", posting.id)
        .single()

      if (!existing) {
        await supabase.from("notifications").insert({
          candidate_id: candidate.id,
          job_posting_id: posting.id,
          company_name,
          job_title: posting.title,
          match_score: match.match_score
        })
        notified++
      }
    }

    return NextResponse.json({ notified })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error"
    console.error("Notify error:", message)
    return NextResponse.json({ notified: 0 }, { status: 500 })
  }
}