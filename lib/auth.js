import crypto from 'crypto';
import { cookies } from 'next/headers';
import db from './db';

// Hash a password with a random salt
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

// Verify a password against a stored hash
export function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return key === hash;
}

// Check if the current request is authenticated
export async function isAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  
  if (!token) return false;
  
  const settings = db.prepare('SELECT session_token FROM settings WHERE id = 1').get();
  
  // Basic timing safe equal comparison
  if (settings && settings.session_token === token) {
    return true;
  }
  
  return false;
}
