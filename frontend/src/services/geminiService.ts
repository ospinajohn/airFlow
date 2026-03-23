import { GoogleGenAI, Type } from "@google/genai";
import { NLPResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function parseTaskInput(input: string): Promise<NLPResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analiza esta entrada de tarea en un objeto JSON estructurado: "${input}". 
      La hora actual es ${new Date().toLocaleString('es-ES', { timeZone: 'UTC' })} (UTC).
      Extrae:
      1. Título (title): El nombre de la tarea.
      2. Fecha de vencimiento (dueDate): Un string ISO 8601 que incluya fecha y HORA si se menciona (ej. "mañana a las 9am" -> 2026-03-05T09:00:00). Si no hay hora, usa las 09:00:00 por defecto para ese día.
      3. Prioridad (priority): 1-3 (1: baja, 2: media, 3: alta).
      4. Proyecto (projectName): Nombre del proyecto si se menciona.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            dueDate: { type: Type.STRING },
            priority: { type: Type.NUMBER },
            projectName: { type: Type.STRING },
          },
          required: ["title"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("NLP Parsing error:", error);
    return { title: input };
  }
}
