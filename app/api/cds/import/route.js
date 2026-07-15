import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const cds = await request.json();
    
    if (!Array.isArray(cds)) {
      return NextResponse.json({ error: "Invalid format. Expected an array of CDs." }, { status: 400 });
    }

    const insert = db.prepare(`
      INSERT INTO cds (mbid, title, artist, year, tracklist, album_art_url, status, catalog_number, format)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((cdsToInsert) => {
      for (const cd of cdsToInsert) {
        let tracklistValue = cd.tracklist;
        if (Array.isArray(cd.tracklist)) {
          tracklistValue = JSON.stringify(cd.tracklist);
        } else if (typeof cd.tracklist === 'object') {
          tracklistValue = JSON.stringify(cd.tracklist);
        }

        insert.run(
          cd.mbid || null,
          cd.title,
          cd.artist,
          cd.year || null,
          tracklistValue || null,
          cd.album_art_url || null,
          cd.status || 'wanna_buy',
          cd.catalog_number || null,
          cd.format || 'CD'
        );
      }
    });

    insertMany(cds);

    return NextResponse.json({ success: true, count: cds.length }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
