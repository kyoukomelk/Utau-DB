import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';

export async function GET(request) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const catno = searchParams.get('catno');

  if (!catno) {
    return NextResponse.json({ error: 'Catalog number is required' }, { status: 400 });
  }

  try {
    // 1. Search release by catalog number
    const searchRes = await fetch(
      `https://musicbrainz.org/ws/2/release/?query=catno:${encodeURIComponent(catno)}&fmt=json`,
      { headers: { 'User-Agent': 'CDManagerApp/1.0 ( local@example.com )' } }
    );
    const searchData = await searchRes.json();
    
    if (!searchData.releases || searchData.releases.length === 0) {
      return NextResponse.json({ error: 'No CD found with this catalog number' }, { status: 404 });
    }

    const release = searchData.releases[0];
    const mbid = release.id;

    // 2. Fetch detailed release info (tracks and artist)
    const detailRes = await fetch(
      `https://musicbrainz.org/ws/2/release/${mbid}?inc=recordings+artists&fmt=json`,
      { headers: { 'User-Agent': 'CDManagerApp/1.0 ( local@example.com )' } }
    );
    const detailData = await detailRes.json();

    const title = detailData.title;
    const artist = detailData['artist-credit']?.[0]?.name || 'Unknown Artist';
    const year = detailData.date ? detailData.date.substring(0, 4) : 'Unknown Year';
    
    // Extract tracks
    let tracklist = [];
    if (detailData.media && detailData.media.length > 0) {
      tracklist = detailData.media[0].tracks.map(t => t.title);
    }

    // 3. Fetch cover art
    let album_art_url = null;
    try {
      const artRes = await fetch(`https://coverartarchive.org/release/${mbid}`);
      if (artRes.ok) {
        const artData = await artRes.json();
        const frontImage = artData.images.find(img => img.front);
        if (frontImage) {
          album_art_url = frontImage.image;
        }
      }
    } catch (artError) {
      console.error("Could not fetch cover art", artError);
    }

    return NextResponse.json({
      mbid,
      title,
      artist,
      year,
      tracklist,
      album_art_url,
      catalog_number: catno
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
