import mysql from 'mysql2/promise';

// Simple MySQL pool helper for server-side usage only
// Do not import this file in client components
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'autocompare',
    port: Number(process.env.DB_PORT || 3306),
    connectionLimit: 10,
    // TiDB Serverless requires SSL; use rejectUnauthorized: false to avoid self-signed cert issues while still using secure transport
    ssl: process.env.DB_HOST?.includes('tidbcloud')
        ? { rejectUnauthorized: false }
        : process.env.DB_SSL === 'true'
          ? { rejectUnauthorized: true }
          : undefined,
});

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const [rows] = await pool.query(sql, params);
    return rows as T[];
}
