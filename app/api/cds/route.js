import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const cds = db.prepare('SELECT * FROM cds ORDER BY created_at DESC').all();
    // Parse tracklist JSON for frontend
    const parsedCds = cds.map(cd => ({
      ...cd,
      tracklist: cd.tracklist ? JSON.parse(cd.tracklist) : []
    }));
    return NextResponse.json(parsedCds);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { mbid, title, artist, year, tracklist, album_art_url, status, catalog_number } = body;
    
    const stmt = db.prepare(`
      INSERT INTO cds (mbid, title, artist, year, tracklist, album_art_url, status, catalog_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      mbid || null, 
      title, 
      artist, 
      year || null, 
      tracklist ? JSON.stringify(tracklist) : null,
      album_art_url || null, 
      status || 'wanna_buy',
      catalog_number || null
    );
    
    return NextResponse.json({ id: info.lastInsertRowid, success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
