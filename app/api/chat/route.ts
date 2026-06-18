import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { messages, cvText, profile } = await req.json()

    const systemPrompt = 
    `Eres un asistente experto en recursos humanos y desarrollo de carrera profesional.
    ${profile ? `El usuario busca: ${profile.desired_position} en el área de ${profile.desired_area}, modalidad ${profile.work_modality}, ubicación ${profile.location}. Sus habilidades son: ${profile.skills?.join(", ")}.` : ""}
    ${cvText ? `Este es el CV del usuario:\n\n${cvText}` : "El usuario aún no ha subido su CV."}
    Responde siempre en español de forma clara, concisa y útil.`

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      system: systemPrompt,
      messages: messages
        .filter((m: any) => m.role !== "assistant" || messages.indexOf(m) > 0)
        .map((m: any) => ({ role: m.role, content: m.content }))
    })

    const reply = response.content[0].type === "text" ? response.content[0].text : ""
    return NextResponse.json({ reply })

  } catch (error: any) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { reply: "Hubo un error al conectar con la IA. Verifica tu API key o intenta más tarde." },
      { status: 500 }
    )
  }
}