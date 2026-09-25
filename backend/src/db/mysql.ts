import 'dotenv/config';
import mysql, { type ResultSetHeader, type RowDataPacket } from 'mysql2/promise';
import fs from 'node:fs/promises';
import path from 'node:path';

export type QueryRow = RowDataPacket & Record<string, unknown>;
export type Database = {
  query<T = any>(sql: string, params?: unknown[]): Promise<T[]>;
  execute(sql: string, params?: unknown[]): Promise<ResultSetHeader>;
  close(): Promise<void>;
};

export async function createMysqlDatabase(): Promise<Database> {
  const host = process.env.MYSQL_HOST;
  const database = process.env.MYSQL_DATABASE;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  if (!host || !database || !user || password === undefined) throw new Error('MYSQL_HOST, MYSQL_DATABASE, MYSQL_USER, and MYSQL_PASSWORD must be configured');
  const pool = mysql.createPool({
    host,
    port: Number(process.env.MYSQL_PORT || 3306),
    database,
    user,
    password,
    waitForConnections: true,
    connectionLimit: 10,
  });
  await pool.query('SELECT 1');
  const schema = await fs.readFile(path.join(process.cwd(), 'src', 'db', 'schema.sql'), 'utf8');
  for (const statement of schema.split(';').map((part) => part.trim()).filter(Boolean)) await pool.query(statement);
  return {
    async query<T = any>(sql: string, params: unknown[] = []) { const [rows] = await pool.query(sql, params); return rows as T[]; },
    async execute(sql: string, params: unknown[] = []) { const [result] = await pool.execute<ResultSetHeader>(sql, params as any[]); return result; },
    close: () => pool.end(),
  };
}