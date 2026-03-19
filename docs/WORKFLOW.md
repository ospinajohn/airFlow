# Workflow de cambios (bug/feature)

Guía corta para no perder contexto y evitar cambios “a ciegas”.

## 1) Definí el objetivo (antes de tocar código)

- **Qué se quiere lograr**: 1 frase.
- **Criterio de aceptación**: 3–7 bullets verificables.
- **Dónde vive el problema**:
  - UI/UX (React): `src/` (probable `src/App.tsx` o `src/components/*`)
  - API/datos (Express/SQLite): `server.ts` (y a futuro `server/*`)
  - NLP parsing: `src/services/nlpService.ts` o `src/services/geminiService.ts`

## 2) Identificá el flujo afectado

Elegí una ruta principal (casi todo cae en una de estas):

- **Captura rápida**: `CommandBar` → `App` → `POST /api/tasks`
- **Edición/Pomodoro**: `FocusMode` → `onUpdate` → `PATCH /api/tasks/:id`
- **Kanban**: DnD/selección/bulk → `PATCH`/`DELETE`
- **Calendario**: render por `due_date`
- **Analytics**: métricas + planificador de próxima semana

## 3) Checklist rápida por tipo de cambio

### Cambios de UI (frontend)

- ¿Qué estado toca? (tasks/projects/view/modales) — suele estar en `src/App.tsx`.
- ¿Hace `fetch` nuevo o cambia payload? entonces también toca `server.ts`.
- Evitar degradar performance: preferir cambios localizados en componentes y memoización cuando aplique.

### Cambios de API/datos (backend)

- Mantener el contrato simple y consistente:
  - `POST /api/tasks` y `PATCH /api/tasks/:id` deben aceptar campos conocidos
  - si cambia el shape, actualizar UI que consume esos campos
- Si se agrega una columna, considerar estrategia de migración (hoy el schema se crea en `server.ts`).

### Cambios de NLP

- Local parsing: `parseTaskInputLocally(input)` (fecha/prioridad)
- Asignación a proyecto/status por heurística vive hoy en `CommandBar` (substring + keyword `hoy`)
- Si se integra Gemini, definir:
  - fallback local
  - “source of truth” de `due_date` (hora por defecto, timezone)
  - costo/latencia y cuándo se llama

## 4) Prueba mínima (manual) recomendada

Sin formalizar test suite todavía, mínimo:

- Crear tarea con “mañana” y verificar `due_date` y render en Calendario.
- Crear tarea con “urgente” y verificar `priority=3`.
- Mover tarea a `done` desde Kanban y verificar que desaparece (o se archive según UX) y que `completed_at` existe.
- Editar en Focus Mode (title/priority/due_date/description/project) y refrescar; confirmar persistencia.

## 5) Convenciones rápidas

- **Punto de entrada**: `src/main.tsx` → `src/App.tsx`.
- **Tipos**: no inventar campos: agregar/ajustar en `src/types.ts` primero.
- **DB local**: `flow.db` está ignoreado por `.gitignore` (no se commitea).

## Template listo

- Usá `docs/CHANGE_TEMPLATE.md` para definir objetivo/AC/flujo/archivos antes de tocar código.

