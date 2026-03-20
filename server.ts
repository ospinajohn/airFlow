import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("flow.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'backlog',
    priority INTEGER DEFAULT 1,
    due_date TEXT,
    project_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // API Routes
  app.get("/api/tasks", (req, res) => {
    // Devolvemos tareas activas + completadas en los últimos 7 días para analíticas precisas
    const tasks = db
      .prepare(
        "SELECT * FROM tasks WHERE completed_at IS NULL OR completed_at > datetime('now', '-7 days')",
      )
      .all();
    res.json(tasks);
  });

  app.get("/api/tasks/stats", (req, res) => {
    try {
      const days = 7;
      const stats = [];
      for (let i = days - 1; i >= 0; i--) {
        const startOffset = -i;
        const endOffset = -(i - 1);
        const row = db
          .prepare(
            `SELECT COUNT(*) as count FROM tasks WHERE completed_at IS NOT NULL AND completed_at >= datetime('now', ? || ' days', 'start of day') AND completed_at < datetime('now', ? || ' days', 'start of day')`,
          )
          .get(startOffset.toString(), endOffset.toString()) as {
            count: number;
          };
        const date = new Date();
        date.setDate(date.getDate() - i);
        stats.push({
          date: date.toISOString().split("T")[0],
          completed: row.count,
        });
      }

      const totalCompleted = db
        .prepare(
          "SELECT COUNT(*) as count FROM tasks WHERE completed_at IS NOT NULL",
        )
        .get() as { count: number };

      const totalTasks = db
        .prepare("SELECT COUNT(*) as count FROM tasks")
        .get() as { count: number };

      const weekCompleted = db
        .prepare(
          "SELECT COUNT(*) as count FROM tasks WHERE completed_at IS NOT NULL AND completed_at >= datetime('now', '-7 days')",
        )
        .get() as { count: number };

      res.json({
        daily: stats,
        totalCompleted: totalCompleted.count,
        totalTasks: totalTasks.count,
        weekCompleted: weekCompleted.count,
      });
    } catch (err) {
      console.error("Stats error:", err);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.post("/api/tasks", (req, res) => {
    const { id, title, description, status, priority, due_date, project_id } =
      req.body;
    const stmt = db.prepare(
      "INSERT INTO tasks (id, title, description, status, priority, due_date, project_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
    );
    stmt.run(
      id,
      title,
      description,
      status || "backlog",
      priority || 1,
      due_date,
      project_id,
    );
    res.status(201).json({ success: true });
  });

  app.patch("/api/tasks/:id", (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const fields = Object.keys(updates);
    if (fields.length === 0) return res.json({ success: true });

    // Special handling for completion
    if (updates.status === "done" && !updates.completed_at) {
      updates.completed_at = new Date().toISOString();
      fields.push("completed_at");
    }

    const setClause = fields.map((f) => `${f} = ?`).join(", ");
    const values = fields.map((f) => updates[f]);

    const stmt = db.prepare(`UPDATE tasks SET ${setClause} WHERE id = ?`);
    stmt.run(...values, id);

    res.json({ success: true });
  });

  app.delete("/api/tasks/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.get("/api/projects", (req, res) => {
    const projects = db
      .prepare("SELECT * FROM projects ORDER BY name COLLATE NOCASE ASC")
      .all();
    res.json(projects);
  });

  app.post("/api/projects", (req, res) => {
    try {
      const { id, name, color } = req.body;
      const normalizedName = typeof name === "string" ? name.trim() : "";

      if (!normalizedName) {
        return res
          .status(400)
          .json({ error: "El nombre del proyecto es obligatorio" });
      }

      const existing = db
        .prepare("SELECT id FROM projects WHERE lower(name) = lower(?) LIMIT 1")
        .get(normalizedName) as { id: string } | undefined;

      if (existing) {
        return res
          .status(409)
          .json({ error: "Ya existe un proyecto con ese nombre" });
      }

      const projectId =
        typeof id === "string" && id.trim().length > 0
          ? id.trim()
          : randomUUID();
      db.prepare("INSERT INTO projects (id, name, color) VALUES (?, ?, ?)").run(
        projectId,
        normalizedName,
        color || null,
      );

      const created = db
        .prepare("SELECT * FROM projects WHERE id = ?")
        .get(projectId);
      return res.status(201).json(created);
    } catch (err) {
      console.error("Create project error:", err);
      return res.status(500).json({ error: "No se pudo crear el proyecto" });
    }
  });

  app.patch("/api/projects/:id", (req, res) => {
    try {
      const { id } = req.params;
      const { name, color } = req.body;

      const current = db
        .prepare("SELECT * FROM projects WHERE id = ?")
        .get(id) as
        | { id: string; name: string; color: string | null }
        | undefined;

      if (!current) {
        return res.status(404).json({ error: "Proyecto no encontrado" });
      }

      const nextName = typeof name === "string" ? name.trim() : current.name;
      if (!nextName) {
        return res
          .status(400)
          .json({ error: "El nombre del proyecto es obligatorio" });
      }

      const duplicate = db
        .prepare(
          "SELECT id FROM projects WHERE lower(name) = lower(?) AND id != ? LIMIT 1",
        )
        .get(nextName, id) as { id: string } | undefined;

      if (duplicate) {
        return res
          .status(409)
          .json({ error: "Ya existe un proyecto con ese nombre" });
      }

      const nextColor = typeof color === "string" ? color : current.color;
      db.prepare("UPDATE projects SET name = ?, color = ? WHERE id = ?").run(
        nextName,
        nextColor || null,
        id,
      );

      const updated = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
      return res.json(updated);
    } catch (err) {
      console.error("Update project error:", err);
      return res
        .status(500)
        .json({ error: "No se pudo actualizar el proyecto" });
    }
  });

  app.delete("/api/projects/:id", (req, res) => {
    try {
      const { id } = req.params;

      const project = db
        .prepare("SELECT id FROM projects WHERE id = ?")
        .get(id) as { id: string } | undefined;
      if (!project) {
        return res.status(404).json({ error: "Proyecto no encontrado" });
      }

      const tx = db.transaction((projectId: string) => {
        db.prepare(
          "UPDATE tasks SET project_id = NULL WHERE project_id = ?",
        ).run(projectId);
        db.prepare("DELETE FROM projects WHERE id = ?").run(projectId);
      });

      tx(id);
      return res.json({ success: true });
    } catch (err) {
      console.error("Delete project error:", err);
      return res.status(500).json({ error: "No se pudo eliminar el proyecto" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: app.listen().close(), // Ensure HMR can attach correctly
        },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
