import db from '@/lib/db';
import { NextResponse } from 'next/server';
import { hashPassword, verifyPassword, isAuthenticated } from '@/lib/auth';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function GET() {
  try {
    const settings = db.prepare('SELECT password_hash FROM settings WHERE id = 1').get();
    const needsSetup = !settings || !settings.password_hash;
    
    let loggedIn = false;
    if (!needsSetup) {
      loggedIn = await isAuthenticated();
    }
    
    return NextResponse.json({ needsSetup, loggedIn });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, password } = body;
    
    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const settings = db.prepare('SELECT password_hash FROM settings WHERE id = 1').get();
    
    if (action === 'setup') {
      if (settings && settings.password_hash) {
        return NextResponse.json({ error: 'Password is already set' }, { status: 400 });
      }
      
      const hash = hashPassword(password);
      const token = crypto.randomBytes(32).toString('hex');
      
      db.prepare('UPDATE settings SET password_hash = ?, session_token = ? WHERE id = 1').run(hash, token);
      
      const cookieStore = await cookies();
      cookieStore.set('session_token', token, {
        httpOnly: true,
        secure: false, // Allow HTTP for local network access
        sameSite: 'lax',
        path: '/'
      });
      
      return NextResponse.json({ success: true });
    } 
    
    if (action === 'login') {
      if (!settings || !settings.password_hash) {
        return NextResponse.json({ error: 'Setup required' }, { status: 400 });
      }
      
      const isValid = verifyPassword(password, settings.password_hash);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }
      
      const token = crypto.randomBytes(32).toString('hex');
      db.prepare('UPDATE settings SET session_token = ? WHERE id = 1').run(token);
      
      const cookieStore = await cookies();
      cookieStore.set('session_token', token, {
        httpOnly: true,
        secure: false, // Allow HTTP for local network access
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });
      
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    db.prepare('UPDATE settings SET session_token = NULL WHERE id = 1').run();
    const cookieStore = await cookies();
    cookieStore.delete('session_token');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
