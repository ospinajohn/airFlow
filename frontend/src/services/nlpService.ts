import * as chrono from "chrono-node";
import { NLPResult } from "../types";

export function parseTaskInputLocally(input: string): NLPResult {
  const results = chrono.es.parse(input);

  let dueDate: string | undefined;
  let title = input;

  if (results.length > 0) {
    const result = results[0];
    const date = result.start.date();

    // Si chrono no detectó hora explícita, forzar las 9:00am
    const hasExplicitTime = result.start.isCertain("hour");
    if (!hasExplicitTime) {
      date.setHours(9, 0, 0, 0);
    }

    // Usar formato ISO completo para que el backend/frontend puedan manejarlo consistentemente
    const pad = (n: number) => n.toString().padStart(2, "0");
    dueDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;

    title = input.replace(result.text, "").trim();
  }

  let priority = 1;
  const lowerInput = input.toLowerCase();
  if (
    lowerInput.includes("urgente") ||
    lowerInput.includes("importante") ||
    lowerInput.includes("asap")
  ) {
    priority = 3;
  } else if (
    lowerInput.includes("prioridad media") ||
    lowerInput.includes("pronto")
  ) {
    priority = 2;
  }

  return {
    title: title || input,
    dueDate: dueDate,
    priority,
  };
}
