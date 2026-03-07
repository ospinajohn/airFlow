import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

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
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/tasks", (req, res) => {
    const tasks = db.prepare("SELECT * FROM tasks WHERE completed_at IS NULL OR completed_at > datetime('now', '-24 hours')").all();
    res.json(tasks);
  });

  app.get("/api/tasks/stats", (req, res) => {
    try {
      const days = 7;
      const stats = [];
      for (let i = days - 1; i >= 0; i--) {
        const startOffset = -i;
        const endOffset = -(i - 1);
        const row = db.prepare(
          `SELECT COUNT(*) as count FROM tasks WHERE completed_at IS NOT NULL AND completed_at >= datetime('now', ? || ' days', 'start of day') AND completed_at < datetime('now', ? || ' days', 'start of day')`
        ).get(startOffset.toString(), endOffset.toString()) as { count: number };
        const date = new Date();
        date.setDate(date.getDate() - i);
        stats.push({ date: date.toISOString().split('T')[0], completed: row.count });
      }

      const totalCompleted = db.prepare(
        "SELECT COUNT(*) as count FROM tasks WHERE completed_at IS NOT NULL"
      ).get() as { count: number };

      const totalTasks = db.prepare("SELECT COUNT(*) as count FROM tasks").get() as { count: number };

      const weekCompleted = db.prepare(
        "SELECT COUNT(*) as count FROM tasks WHERE completed_at IS NOT NULL AND completed_at >= datetime('now', '-7 days')"
      ).get() as { count: number };

      res.json({
        daily: stats,
        totalCompleted: totalCompleted.count,
        totalTasks: totalTasks.count,
        weekCompleted: weekCompleted.count,
      });
    } catch (err) {
      console.error('Stats error:', err);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  app.post("/api/tasks", (req, res) => {
    const { id, title, description, status, priority, due_date, project_id } = req.body;
    const stmt = db.prepare("INSERT INTO tasks (id, title, description, status, priority, due_date, project_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
    stmt.run(id, title, description, status || 'backlog', priority || 1, due_date, project_id);
    res.status(201).json({ success: true });
  });

  app.patch("/api/tasks/:id", (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    const fields = Object.keys(updates);
    if (fields.length === 0) return res.json({ success: true });

    // Special handling for completion
    if (updates.status === 'done' && !updates.completed_at) {
      updates.completed_at = new Date().toISOString();
      fields.push('completed_at');
    }

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => updates[f]);

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
    const projects = db.prepare("SELECT * FROM projects").all();
    res.json(projects);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
