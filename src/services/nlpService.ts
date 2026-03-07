import * as chrono from 'chrono-node';
import { NLPResult } from '../types';

export function parseTaskInputLocally(input: string): NLPResult {
  // Use Spanish locale for parsing
  const results = chrono.es.parse(input);
  
  let dueDate: string | undefined;
  let title = input;

  if (results.length > 0) {
    const result = results[0];
    const date = result.start.date();
    dueDate = date.toISOString();
    
    // Remove the date part from the title to keep it clean
    // e.g., "Llamar a mamá mañana" -> "Llamar a mamá"
    title = input.replace(result.text, '').trim();
  }

  // Simple priority detection based on keywords
  let priority = 1;
  const lowerInput = input.toLowerCase();
  if (lowerInput.includes('urgente') || lowerInput.includes('importante') || lowerInput.includes('asap')) {
    priority = 3;
  } else if (lowerInput.includes('prioridad media') || lowerInput.includes('pronto')) {
    priority = 2;
  }

  return {
    title: title || input,
    due_date: dueDate,
    priority,
  };
}
