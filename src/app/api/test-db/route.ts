// src/app/api/test-db/route.ts
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);
    const [rows] = await connection.query('SELECT 1');
    await connection.end();

    return NextResponse.json({ success: true, result: rows });
  } catch (error: any) {
    console.error('MySQL connection error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
