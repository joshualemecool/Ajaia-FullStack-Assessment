import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { createMysqlDatabase, type Database as MysqlDatabase } from './db/mysql.js';

type User = { id: number; email: string; name: string };
type AuthedRequest = Request & { user?: User };
type Database = { query<T = any>(sql: string, params?: unknown[]): Promise<T[]>; execute(sql: string, params?: unknown[]): Promise<{ insertId: number | bigint }>; close(): Promise<void> };
const root = path.resolve(process.cwd());

function createSqliteDatabase(): Database {
  fs.mkdirSync(path.join(root, 'data'), { recursive: true });
  const db = new DatabaseSync(path.join(root, 'data', 'editor.db'));
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS documents (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, content TEXT NOT NULL, owner_id INTEGER NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS document_shares (id INTEGER PRIMARY KEY AUTOINCREMENT, document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(document_id, user_id));`);
  const seed = db.prepare('INSERT OR IGNORE INTO users (id, email, name) VALUES (?, ?, ?)');
  seed.run(1, 'alice@example.com', 'Alice'); seed.run(2, 'bob@example.com', 'Bob');
  return {
    async query<T>(sql: string, params: unknown[] = []) { return db.prepare(sql).all(...params as any[]) as T[]; },
    async execute(sql: string, params: unknown[] = []) { const result = db.prepare(sql).run(...params as any[]); return { insertId: result.lastInsertRowid }; },
    async close() { db.close(); },
  };
}

const database: Database = process.env.DB_CLIENT === 'mysql' ? await createMysqlDatabase() as MysqlDatabase : createSqliteDatabase();
const app = express();
const secret = process.env.JWT_SECRET || 'assessment-local-secret';
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024 }, fileFilter: (_req, file, cb) => cb(null, /\.(txt|md)$/i.test(file.originalname)) });

function auth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try { const payload = jwt.verify(token, secret) as { id: number }; void database.query<User>('SELECT id, email, name FROM users WHERE id = ?', [payload.id]).then(([user]) => { if (!user) throw new Error(); req.user = user; next(); }).catch(() => res.status(401).json({ error: 'Invalid or expired session' })); } catch { return res.status(401).json({ error: 'Invalid or expired session' }); }
}
async function canRead(documentId: number, userId: number) { const [document] = await database.query<any>('SELECT d.*, u.name AS owner_name FROM documents d JOIN users u ON u.id=d.owner_id WHERE d.id=? AND (d.owner_id=? OR EXISTS (SELECT 1 FROM document_shares s WHERE s.document_id=d.id AND s.user_id=?))', [documentId, userId, userId]); return document; }
function tiptapParagraphs(text: string) { return { type: 'doc', content: text.split(/\r?\n/).map((line) => ({ type: 'paragraph', content: line ? [{ type: 'text', text: line }] : undefined })) }; }

app.get('/api/health', async (_req, res) => { try { await database.query('SELECT 1'); res.json({ ok: true, database: process.env.DB_CLIENT === 'mysql' ? 'mysql' : 'sqlite' }); } catch { res.status(503).json({ ok: false, error: 'Database unavailable' }); } });
app.post('/api/auth/login', async (req, res) => { const email = String(req.body?.email || '').trim().toLowerCase(); const [user] = await database.query<User>('SELECT id, email, name FROM users WHERE email=?', [email]); if (!user) return res.status(401).json({ error: 'Use alice@example.com or bob@example.com' }); res.json({ token: jwt.sign({ id: user.id }, secret, { expiresIn: '7d' }), user }); });
app.get('/api/documents', auth, async (req: AuthedRequest, res) => { const owned = await database.query('SELECT id,title,updated_at AS updatedAt,\'owned\' AS access FROM documents WHERE owner_id=? ORDER BY updated_at DESC', [req.user!.id]); const shared = await database.query('SELECT d.id,d.title,d.updated_at AS updatedAt,\'shared\' AS access,u.name AS ownerName FROM documents d JOIN document_shares s ON s.document_id=d.id JOIN users u ON u.id=d.owner_id WHERE s.user_id=? ORDER BY d.updated_at DESC', [req.user!.id]); res.json({ owned, shared }); });
app.post('/api/documents', auth, async (req: AuthedRequest, res) => { const title = String(req.body?.title || 'Untitled Document').trim() || 'Untitled Document'; const content = JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }); const result = await database.execute('INSERT INTO documents (title, content, owner_id) VALUES (?, ?, ?)', [title, content, req.user!.id]); res.status(201).json({ id: Number(result.insertId) }); });
app.get('/api/documents/:id', auth, async (req: AuthedRequest, res) => { const document = await canRead(Number(req.params.id), req.user!.id); if (!document) return res.status(404).json({ error: 'Document not found' }); res.json({ ...document, content: typeof document.content === 'string' ? JSON.parse(document.content) : document.content, isOwner: Number(document.owner_id) === req.user!.id }); });
app.put('/api/documents/:id', auth, async (req: AuthedRequest, res) => { const document = await canRead(Number(req.params.id), req.user!.id); if (!document) return res.status(404).json({ error: 'Document not found' }); const title = String(req.body?.title || '').trim(); if (!title) return res.status(400).json({ error: 'Title cannot be empty' }); if (!req.body?.content || req.body.content.type !== 'doc') return res.status(400).json({ error: 'Invalid editor content' }); await database.execute('UPDATE documents SET title=?,content=?,updated_at=CURRENT_TIMESTAMP WHERE id=?', [title, JSON.stringify(req.body.content), String(req.params.id)]); res.json({ ok: true }); });
app.post('/api/documents/:id/share', auth, async (req: AuthedRequest, res) => { const [document] = await database.query<any>('SELECT id,owner_id FROM documents WHERE id=?', [String(req.params.id)]); if (!document) return res.status(404).json({ error: 'Document not found' }); if (Number(document.owner_id) !== req.user!.id) return res.status(403).json({ error: 'Only the owner can share this document' }); const email = String(req.body?.email || '').trim().toLowerCase(); const [target] = await database.query<User>('SELECT id,name,email FROM users WHERE email=?', [email]); if (!target) return res.status(404).json({ error: 'No seeded user has that email' }); if (target.id === req.user!.id) return res.status(400).json({ error: 'You already own this document' }); try { await database.execute('INSERT INTO document_shares (document_id,user_id) VALUES (?,?)', [String(req.params.id), target.id]); res.status(201).json({ sharedWith: target }); } catch { res.status(409).json({ error: 'Document is already shared with that user' }); } });
app.post('/api/documents/import', auth, upload.single('file'), async (req: AuthedRequest, res) => { if (!req.file) return res.status(400).json({ error: 'Upload a .txt or .md file' }); const title = path.basename(req.file.originalname, path.extname(req.file.originalname)) || 'Imported Document'; const content = JSON.stringify(tiptapParagraphs(req.file.buffer.toString('utf8'))); const result = await database.execute('INSERT INTO documents (title,content,owner_id) VALUES (?,?,?)', [title, content, req.user!.id]); res.status(201).json({ id: Number(result.insertId) }); });
app.use((error: any, _req: Request, res: Response, _next: NextFunction) => { if (error?.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File must be smaller than 1 MB' }); if (error?.message?.includes('File')) return res.status(400).json({ error: 'Only .txt and .md files are supported' }); res.status(500).json({ error: 'Unexpected server error' }); });
app.listen(Number(process.env.PORT) || 4000, () => console.log(`API listening with ${process.env.DB_CLIENT === 'mysql' ? 'MySQL' : 'SQLite'} on http://localhost:4000`));