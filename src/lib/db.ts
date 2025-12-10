import mysql from 'mysql2/promise';

// Simple MySQL pool helper for server-side usage only
// Do not import this file in client components
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'autocompare',
    port: Number(process.env.DB_PORT || 3306),
    connectionLimit: 10
});

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const [rows] = await pool.query(sql, params);
    return rows as T[];
}
