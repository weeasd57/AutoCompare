import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

interface AdminRow {
    id: number;
    email: string;
    password_hash: string;
    name: string | null;
    role: string;
    is_active: number;
}

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Demo admin: allow read-only showcase without touching DB
        if (email === 'admin@demo.com' && password === '123456') {
            const token = Buffer.from(`demo:${email}:${Date.now()}`).toString('base64');
            return NextResponse.json({
                success: true,
                user: {
                    id: 'demo',
                    email,
                    name: 'Demo Admin',
                    role: 'demo'
                },
                token,
                demo: true
            });
        }

        // Check if admins table exists and has records
        let admins: AdminRow[] = [];
        try {
            admins = await query(
                'SELECT * FROM admins WHERE email = ? AND is_active = 1',
                [email]
            ) as AdminRow[];
        } catch (dbError) {
            // If admins table doesn't exist, redirect to setup
            console.log('Admins table not found, setup required');
            return NextResponse.json(
                { error: 'Setup required. Please visit /setup to create an admin account.', setupRequired: true },
                { status: 403 }
            );
        }

        // If no admin found in DB
        if (admins.length === 0) {
            // Check if any admin exists at all
            const allAdmins = await query('SELECT COUNT(*) as count FROM admins') as any[];
            
            if (allAdmins[0].count === 0) {
                // No admins in DB, redirect to setup
                return NextResponse.json(
                    { error: 'No admin account exists. Please visit /setup to create one.', setupRequired: true },
                    { status: 403 }
                );
            }
            
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const admin = admins[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, admin.password_hash);
        if (!isValidPassword) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Update last login
        await query('UPDATE admins SET last_login = NOW() WHERE id = ?', [admin.id]);

        // Create session token
        const token = Buffer.from(`${admin.id}:${admin.email}:${Date.now()}`).toString('base64');

        return NextResponse.json({
            success: true,
            user: {
                id: admin.id,
                email: admin.email,
                name: admin.name,
                role: admin.role
            },
            token
        });

    } catch (err) {
        console.error('Login error', err);
        return NextResponse.json(
            { error: 'Login failed' },
            { status: 500 }
        );
    }
}
