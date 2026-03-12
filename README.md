<div align="center">

# ⚡ The Flow OS

### *Tu espacio de productividad natural y orgánico*

Un gestor de tareas y proyectos generativo que combina la simplicidad del lenguaje natural con visualizaciones orgánicas e intuitivas. Diseñado para fluir con tu mente, no contra ella.

[Demo](#-capturas-de-pantalla) · [Características](#-características) · [Instalación](#-instalación)

</div>

---
## 🎯 ¿Qué es The Flow OS?

**The Flow OS** es una aplicación de gestión de tareas y productividad que revoluciona la forma en que organizas tu trabajo. Olvídate de formularios complejos y interfaces rígidas: aquí solo escribes lo que necesitas hacer en lenguaje natural, y The Flow se encarga del resto.

### 💡 La Filosofía

- **Entrada sin fricción**: Escribe "Llamar a angie mañana urgente" y automáticamente se parsea la fecha, prioridad y tarea
- **Visualización orgánica**: Tus tareas flotan como burbujas en un espacio 2D, priorizadas visualmente
- **Múltiples perspectivas**: Alterna entre Focus Mode, Kanban, Lista y Calendario según tu momento
- **Pomodoro integrado**: Trabaja con técnicas de tiempo sin salir de tu flujo

---

## 📸 Capturas de Pantalla

### 🎨 Modo Enfoque (Focus Mode)
El corazón de The Flow. Tus tareas flotan orgánicamente en el espacio, las más urgentes destacan visualmente. Arrastra para priorizar, click para entrar en modo Pomodoro.

![Focus Mode](./screenshots/focus-mode.png)

### 📋 Vista Kanban
Organiza tu flujo de trabajo en columnas: Pendientes → Por Hacer Hoy → En Proceso → Hecho

![Kanban View](./screenshots/kanban-view.png)

### 📅 Vista Calendario
Visualiza tus proyectos en el tiempo. Planifica tu mes con una vista clara de todas tus tareas programadas.

![Calendar View](./screenshots/calendar-view.png)

### 📝 Vista de Lista
Cuando necesitas una visión completa y directa de todas tus tareas.

![List View](./screenshots/list-view.png)

### ⚙️ Ajustes Personalizables
Configura tu flujo: auto-inicio de Pomodoro, inicio de semana, y más.

![Settings](./screenshots/settings.png)

---

## ✨ Características

### 🧠 Procesamiento de Lenguaje Natural
- **Entrada intuitiva**: Escribe en español natural
- **Detección automática de fechas**: "mañana", "viernes próximo", "en 3 días"
- **Reconocimiento de prioridades**: palabras como "urgente", "importante", "asap"
- **Parsing local**: Rápido y sin necesidad de conexión

### 📊 Múltiples Vistas
- **🎯 Focus Mode**: Burbujas interactivas y orgánicas para máxima concentración
- **📋 Kanban**: Tablero de columnas drag & drop
- **📝 Lista**: Vista compacta de todas las tareas
- **📅 Calendario**: Planificación temporal de proyectos

### ⏱️ Sistema Pomodoro Integrado
- Temporizador de 25 minutos
- Auto-inicio configurable
- Controles play/pause/reset
- Edición de tareas en tiempo real durante el focus

### 🎨 Gestión de Proyectos
- Agrupa tareas por proyectos
- Colores personalizables
- Vista de calendario por proyecto
- Filtrado y organización

### ⚡ Experiencia de Usuario
- **Atajos de teclado**: `Ctrl/Cmd + Space` para crear tareas rápidamente
- **Drag & Drop**: Reorganiza tareas intuitivamente
- **Animaciones fluidas**: Transiciones elegantes con Framer Motion
- **Diseño oscuro**: Interface moderna y agradable a la vista
- **Responsive**: Funciona en cualquier dispositivo

### 🔧 Características Técnicas
- **Persistencia local**: Base de datos SQLite
- **Sin dependencias de API externas**: Funciona offline
- **Sincronización inmediata**: Updates optimistas para respuesta instantánea
- **TypeScript**: Completamente tipado

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 19** - UI Library
- **TypeScript** - Type Safety
- **Vite** - Build Tool & Dev Server
- **Tailwind CSS 4** - Styling
- **Framer Motion** - Animaciones
- **@dnd-kit** - Drag & Drop

### Backend & Data
- **Express** - Server
- **Better-SQLite3** - Database
- **Chrono-node** - Parser de fechas en lenguaje natural

### Libraries & Tools
- **date-fns** - Manipulación de fechas
- **Lucide React** - Iconos
- **Google Gemini AI** - (Opcional) Mejoras de NLP

---

## 🚀 Instalación

### Prerrequisitos
- Node.js 18 o superior
- npm o pnpm

### Pasos

1. **Clona el repositorio**
```bash
git clone https://github.com/tuusuario/airflow.git
cd airflow
```

2. **Instala las dependencias**
```bash
npm install
```

3. **Configura el entorno** (Opcional)
```bash
# Crea un archivo .env si quieres usar Google Gemini
echo "GEMINI_API_KEY=tu_clave_aqui" > .env
```

4. **Inicia el servidor de desarrollo**
```bash
npm run dev
```

5. **Abre tu navegador**
```
http://localhost:5173
```

---

## 📖 Uso

### Crear una Tarea
- Presiona `Ctrl + Space` (o `Cmd + Space` en Mac)
- Escribe tu tarea en lenguaje natural:
  - `Llamar a angie mañana urgente`
  - `Reunión con el equipo el viernes a las 3pm`
  - `Comprar leche hoy`
- Presiona Enter

### Cambiar de Vista
- **⚡ Focus Mode**: Para concentración profunda
- **📋 Kanban**: Para flujo de trabajo visual
- **📝 Lista**: Para vista completa
- **📅 Calendario**: Para planificación temporal

### Usar Pomodoro
1. Click en cualquier tarea para entrar en Focus Mode
2. El timer inicia automáticamente (o manualmente si lo desactivaste)
3. Trabaja durante 25 minutos
4. Marca como completada cuando termines

### Organizar Tareas
- **Arrastra y suelta** para reorganizar prioridades
- **Click derecho** para opciones avanzadas
- **Drag entre columnas** en modo Kanban para cambiar estados

---

## 📁 Estructura del Proyecto

```
airFlow/
├── src/
│   ├── components/
│   │   ├── CalendarView.tsx    # Vista de calendario
│   │   ├── CommandBar.tsx      # Barra de comandos (Ctrl+Space)
│   │   ├── FocusMode.tsx       # Modo enfoque con Pomodoro
│   │   ├── KanbanCard.tsx      # Tarjetas del tablero Kanban
│   │   └── TaskBubble.tsx      # Burbujas de tareas
│   ├── services/
│   │   ├── nlpService.ts       # Procesamiento de lenguaje natural
│   │   └── geminiService.ts    # Integración con Gemini AI
│   ├── App.tsx                 # Componente principal
│   ├── types.ts                # Definiciones de tipos
│   └── main.tsx                # Entry point
├── server.ts                    # Servidor Express + SQLite
├── package.json
└── README.md
```

---

## 🎨 Configuración

### Ajustes Disponibles
- **Auto-inicio de Pomodoro**: Inicia el timer automáticamente al entrar en Focus Mode
- **Inicio de semana**: Elige entre Lunes o Domingo
- **Temas** (próximamente): Personaliza colores y apariencia

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Si tienes ideas para mejorar The Flow OS:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Roadmap

<!-- - [ ] Sincronización en la nube
- [ ] Aplicación móvil
- [ ] Colaboración en tiempo real
- [ ] IA para sugerencias de priorización
- [ ] Estadísticas y analytics de productividad
- [ ] Integración con calendarios externos
- [ ] Temas personalizables
- [ ] Exportación de datos -->

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 💬 Contacto

¿Preguntas? ¿Sugerencias? ¿Feedback?

- GitHub Issues: [Crear un issue](https://github.com/tuusuario/airflow/issues)
- Email: ospinajohnjames@gmail.com

---

<div align="center">

**Hecho con ❤️ para fluir mejor**

⭐ Star este repo si te resultó útil

</div>
