import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, title, artist, format, album_art_url, tracklist } = body;
    
    // Build dynamic update query
    let updateFields = [];
    let queryParams = [];
    
    if (status !== undefined) { updateFields.push('status = ?'); queryParams.push(status); }
    if (title !== undefined) { updateFields.push('title = ?'); queryParams.push(title); }
    if (artist !== undefined) { updateFields.push('artist = ?'); queryParams.push(artist); }
    if (format !== undefined) { updateFields.push('format = ?'); queryParams.push(format); }
    if (album_art_url !== undefined) { updateFields.push('album_art_url = ?'); queryParams.push(album_art_url); }
    if (tracklist !== undefined) { updateFields.push('tracklist = ?'); queryParams.push(typeof tracklist === 'string' ? tracklist : JSON.stringify(tracklist)); }
    
    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    queryParams.push(id);
    const stmt = db.prepare(`UPDATE cds SET ${updateFields.join(', ')} WHERE id = ?`);
    stmt.run(...queryParams);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const stmt = db.prepare('DELETE FROM cds WHERE id = ?');
    stmt.run(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
