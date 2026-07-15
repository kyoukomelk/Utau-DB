"use client";

import { useState, useEffect } from 'react';
import { Plus, Disc, Search, X, Pin, CheckCircle, Home, Star, Filter, Settings, Edit2, Music, Calendar, ShoppingCart, List } from 'lucide-react';

export default function HomePage() {
  const [cds, setCds] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [catalogNumber, setCatalogNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [cardsPerRow, setCardsPerRow] = useState(0);

  const [selectedCd, setSelectedCd] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', artist: '', format: 'CD', album_art_url: '' });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);

  // Auth state
  const [authStatus, setAuthStatus] = useState('loading');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth');
      const data = await res.json();
      if (data.needsSetup) {
        setAuthStatus('needsSetup');
      } else if (data.loggedIn) {
        setAuthStatus('loggedIn');
        fetchCds();
      } else {
        setAuthStatus('loggedOut');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAuthSubmit = async (action) => {
    setAuthError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, password: authPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setAuthPassword('');
        setAuthStatus('loggedIn');
        fetchCds();
      } else {
        setAuthError(data.error || 'Authentication failed');
      }
    } catch (e) {
      setAuthError('Network error');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    setAuthStatus('loggedOut');
    setCds([]);
    setIsSettingsOpen(false);
  };

  const handleRefreshDatabase = async () => {
    setIsRefreshing(true);
    setRefreshProgress(0);
    try {
      const currentCds = [...cds];
      for (let i = 0; i < currentCds.length; i++) {
        const cd = currentCds[i];
        if (cd.catalog_number) {
          try {
            const res = await fetch(`/api/musicbrainz?catno=${encodeURIComponent(cd.catalog_number)}`);
            const mbData = await res.json();
            if (!mbData.error) {
              await fetch(`/api/cds/${cd.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: mbData.title,
                  artist: mbData.artist,
                  album_art_url: mbData.album_art_url,
                  tracklist: mbData.tracklist
                })
              });
            }
          } catch (err) {
            console.error(err);
          }
          await new Promise(r => setTimeout(r, 1100)); // Respect MusicBrainz rate limit
        }
        setRefreshProgress(i + 1);
      }
      await fetchCds();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportDatabase = () => {
    const dataStr = JSON.stringify(cds, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `utau-db-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportDatabase = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        const res = await fetch('/api/cds/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(importedData)
        });
        if (res.ok) {
          alert('Database imported successfully!');
          fetchCds();
        } else {
          alert('Failed to import database.');
        }
      } catch (err) {
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  useEffect(() => {
    checkAuth();
    const storedCards = localStorage.getItem('cardsPerRow');
    if (storedCards) {
      setCardsPerRow(Number(storedCards));
    }
  }, []);

  const handleCardsPerRowChange = (val) => {
    setCardsPerRow(val);
    localStorage.setItem('cardsPerRow', val);
  };

  const fetchCds = async () => {
    try {
      const res = await fetch('/api/cds');
      const data = await res.json();
      if (!data.error) {
        setCds(data);
        
        // Refresh selected CD if it's open
        if (selectedCd) {
          const updated = data.find(c => c.id === selectedCd.id);
          if (updated) setSelectedCd(updated);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async () => {
    if (!catalogNumber.trim()) return;
    setIsSearching(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const res = await fetch(`/api/musicbrainz?catno=${encodeURIComponent(catalogNumber)}`);
      const data = await res.json();
      if (data.error) {
        setSearchError(data.error);
      } else {
        setSearchResult(data);
      }
    } catch (e) {
      setSearchError('An error occurred during search.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdd = async (status) => {
    if (!searchResult) return;
    setIsAdding(true);
    try {
      const res = await fetch('/api/cds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...searchResult, status, format: 'CD' })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setSearchResult(null);
        setCatalogNumber('');
        fetchCds();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdding(false);
    }
  };

  const cycleStatus = async (cd, e) => {
    e.stopPropagation();
    let nextStatus = 'wanna_buy';
    if (cd.status === 'wanna_buy') nextStatus = 'have';
    else if (cd.status === 'have') nextStatus = 'wanna_buy';

    try {
      const res = await fetch(`/api/cds/${cd.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) fetchCds();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteCd = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/cds/${id}`, { method: 'DELETE' });
      if (res.ok) fetchCds();
    } catch (e) {
      console.error(e);
    }
  };

  const saveEdit = async () => {
    try {
      const res = await fetch(`/api/cds/${selectedCd.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setIsEditing(false);
        fetchCds();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openDetails = (cd) => {
    setSelectedCd(cd);
    setIsEditing(false);
  };

  const startEdit = () => {
    setEditForm({
      title: selectedCd.title,
      artist: selectedCd.artist,
      format: selectedCd.format || 'CD',
      album_art_url: selectedCd.album_art_url || ''
    });
    setIsEditing(true);
  };

  const filteredCds = cds.filter(cd => {
    if (activeTab === 'all') return true;
    return cd.status === activeTab;
  });

  const getStatusDisplay = (status) => {
    if (status === 'have') return <><CheckCircle size={10} /> Owned</>;
    if (status === 'wanna_buy') return <><Pin size={10} /> Wishlist</>;
    return status;
  };

  if (authStatus === 'loading') {
    return <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#FFF' }}>Loading...</main>;
  }

  if (authStatus === 'needsSetup' || authStatus === 'loggedOut') {
    return (
      <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="dialog" style={{ width: '400px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
            {authStatus === 'needsSetup' ? 'Welcome to UTAU DB' : 'Login'}
          </h2>
          <p style={{ color: '#938F99', fontSize: '14px', marginBottom: '24px' }}>
            {authStatus === 'needsSetup' ? 'Create a master password to protect your database.' : 'Enter your master password.'}
          </p>
          
          <input 
            type="password" 
            placeholder="Master Password"
            value={authPassword}
            onChange={e => setAuthPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAuthSubmit(authStatus === 'needsSetup' ? 'setup' : 'login')}
            style={{ width: '100%', marginBottom: '16px' }}
          />
          
          {authError && <p style={{ color: '#F2B8B5', fontSize: '12px', marginBottom: '16px' }}>{authError}</p>}
          
          <button 
            className="btn btn-primary" 
            style={{ width: '100%' }}
            onClick={() => handleAuthSubmit(authStatus === 'needsSetup' ? 'setup' : 'login')}
          >
            {authStatus === 'needsSetup' ? 'Set Password' : 'Login'}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={cardsPerRow > 0 ? { '--cards-per-row': cardsPerRow } : {}}>
      <div className="top-app-bar">
        <h1>UTAU DB</h1>
        <button className="icon-button" onClick={() => setIsSettingsOpen(true)}>
          <Settings size={24} color="#FFF" />
        </button>
      </div>

      <div className="header-section">
        <h2>Everything</h2>
        <span className="count-pill">{cds.length}</span>
      </div>

      <div className="search-row">
        <div className="search-input-container">
          <Search size={18} color="#938F99" />
          <input type="text" placeholder="Search collection..." />
        </div>
        <button className="filter-btn">
          <Filter size={18} /> Date Added
        </button>
      </div>

      <div className="card-grid">
        {filteredCds.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', gridColumn: '1 / -1', color: 'var(--sys-color-on-surface-subdued)' }}>
            No CDs found.
          </div>
        )}
        
        {filteredCds.map(cd => (
          <div key={cd.id} className="card" onClick={() => openDetails(cd)}>
            <div className="card-img-wrapper">
              {cd.album_art_url ? (
                <img src={cd.album_art_url} alt={cd.title} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Disc size={48} color="var(--sys-color-outline)" />
                </div>
              )}
              <button className="overlay-delete" onClick={(e) => deleteCd(cd.id, e)}>
                <X size={12} />
              </button>
              <button className="overlay-status" onClick={(e) => cycleStatus(cd, e)}>
                {getStatusDisplay(cd.status)}
              </button>
            </div>
            <div className="card-content">
              <div className="card-title">{cd.title}</div>
              <div className="card-subtitle">{cd.artist}</div>
              <div className="card-bottom-tags">
                <span className="tag-catno">{cd.catalog_number || 'UNKNOWN'}</span>
                <span className="tag-format">{cd.format || 'CD'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="fab" onClick={() => setIsModalOpen(true)}>
        <Plus size={28} />
      </button>

      <div className="tabs">
        <button className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          <div className="tab-icon-wrapper"><Home size={24} /></div>
          <span>All</span>
        </button>
        <button className={`tab ${activeTab === 'wanna_buy' ? 'active' : ''}`} onClick={() => setActiveTab('wanna_buy')}>
          <div className="tab-icon-wrapper"><Star size={24} /></div>
          <span>Wanna Buy</span>
        </button>
        <button className={`tab ${activeTab === 'have' ? 'active' : ''}`} onClick={() => setActiveTab('have')}>
          <div className="tab-icon-wrapper"><CheckCircle size={24} /></div>
          <span>Have</span>
        </button>
      </div>

      {/* Details / Edit Modal */}
      {selectedCd && (
        <div className="dialog-overlay" onClick={() => setSelectedCd(null)}>
          <div className="details-modal" onClick={e => e.stopPropagation()}>
            <div className="details-header">
            <h2>Details</h2>
            <div className="details-header-actions">
              {isEditing ? (
                <button className="details-header-btn" onClick={saveEdit}><CheckCircle size={18} /></button>
              ) : (
                <button className="details-header-btn" onClick={startEdit}><Edit2 size={18} /></button>
              )}
              <button className="details-header-btn" onClick={() => setSelectedCd(null)}><X size={18} /></button>
            </div>
          </div>
          
          {isEditing ? (
            <div style={{ marginTop: '24px' }}>
              <div className="edit-form-group">
                <label>Title</label>
                <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} />
              </div>
              <div className="edit-form-group">
                <label>Artist</label>
                <input type="text" value={editForm.artist} onChange={e => setEditForm({...editForm, artist: e.target.value})} />
              </div>
              <div className="edit-form-group">
                <label>Format</label>
                <select value={editForm.format} onChange={e => setEditForm({...editForm, format: e.target.value})}>
                  <option value="CD">CD</option>
                  <option value="CD+DVD">CD+DVD</option>
                  <option value="CD+Blu-ray">CD+Blu-ray</option>
                </select>
              </div>
              <div className="edit-form-group">
                <label>Cover Image URL</label>
                <input type="text" value={editForm.album_art_url} onChange={e => setEditForm({...editForm, album_art_url: e.target.value})} />
              </div>
              <div style={{ padding: '24px' }}>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={saveEdit}>Save Changes</button>
              </div>
            </div>
          ) : (
            <>
              <div className="details-image-container">
                {selectedCd.album_art_url ? (
                  <img src={selectedCd.album_art_url} alt={selectedCd.title} />
                ) : (
                  <div style={{ width: '260px', height: '260px', borderRadius: '24px', backgroundColor: '#1E1D22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Disc size={80} color="#313033" />
                  </div>
                )}
              </div>
              <div className="details-info-center">
                <h3 className="details-title">{selectedCd.title}</h3>
                <p className="details-artist">{selectedCd.artist}</p>
                <div className="details-pills">
                  <div className="details-pill">
                    <Music size={14} /> {selectedCd.format || 'CD'}
                  </div>
                  <div className="details-pill">
                    <Calendar size={14} /> {selectedCd.year || 'Unknown'}
                  </div>
                </div>
              </div>
              
              <div className="details-section">
                <h4 className="details-section-title"><ShoppingCart size={14} /> WHERE TO BUY / LISTEN</h4>
                <div className="store-buttons-grid">
                  <a href={`https://www.cdjapan.co.jp/searchuni?q=${encodeURIComponent(selectedCd.catalog_number || selectedCd.title)}`} target="_blank" rel="noreferrer" className="store-btn">
                    CDJapan
                  </a>
                  <a href={`https://music.apple.com/jp/search?term=${encodeURIComponent(selectedCd.artist + ' ' + selectedCd.title)}`} target="_blank" rel="noreferrer" className="store-btn">
                    iTunes JP
                  </a>
                  <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedCd.artist + ' ' + selectedCd.title)}`} target="_blank" rel="noreferrer" className="store-btn">
                    YouTube
                  </a>
                  <a href={`https://open.spotify.com/search/${encodeURIComponent(selectedCd.artist + ' ' + selectedCd.title)}`} target="_blank" rel="noreferrer" className="store-btn">
                    Spotify
                  </a>
                </div>
              </div>

              {selectedCd.tracklist && selectedCd.tracklist.length > 0 && (
                <div className="details-section">
                  <h4 className="details-section-title"><List size={14} /> TRACKLIST</h4>
                  <ul className="tracklist">
                    {selectedCd.tracklist.map((track, i) => (
                      <li key={i}>
                        <span style={{ color: '#938F99', width: '24px', flexShrink: 0 }}>{i + 1}.</span> {track}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
          </div>
        </div>
      )}

      {/* Existing Settings & Add CD Modals Below */}
      
      {isSettingsOpen && (
        <div className="dialog-overlay" onClick={() => setIsSettingsOpen(false)}>
          <div className="dialog" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Settings</h2>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#FFF' }}>Cards Per Row (Desktop/Tablet)</label>
              <select 
                value={cardsPerRow} 
                onChange={(e) => handleCardsPerRowChange(Number(e.target.value))}
                style={{ width: '100%', padding: '12px', backgroundColor: 'var(--sys-color-outline)', border: 'none', borderRadius: '8px', color: '#FFF', marginBottom: '16px' }}
              >
                <option value={0}>Default Responsive</option>
                <option value={2}>2 Cards</option>
                <option value={3}>3 Cards</option>
                <option value={4}>4 Cards</option>
                <option value={5}>5 Cards</option>
                <option value={6}>6 Cards</option>
                <option value={7}>7 Cards</option>
                <option value={8}>8 Cards</option>
              </select>
            </div>

            <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', backgroundColor: '#313033', border: '1px solid #49454F', color: '#E6E1E5' }}
                onClick={handleRefreshDatabase}
                disabled={isRefreshing}
              >
                {isRefreshing ? `Refreshing... (${refreshProgress}/${cds.length})` : 'Refresh Database Metadata (Debug)'}
              </button>

              <button 
                className="btn btn-primary" 
                style={{ width: '100%', backgroundColor: '#313033', border: '1px solid #49454F', color: '#E6E1E5' }}
                onClick={handleExportDatabase}
              >
                Export Database (JSON)
              </button>
              
              <label 
                className="btn btn-primary" 
                style={{ width: '100%', backgroundColor: '#313033', border: '1px solid #49454F', color: '#E6E1E5', textAlign: 'center', cursor: 'pointer', display: 'block' }}
              >
                Import Database (JSON)
                <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportDatabase} />
              </label>

              <button 
                className="btn btn-primary" 
                style={{ width: '100%', backgroundColor: '#BA1A1A', border: 'none', color: '#FFFFFF', marginTop: '16px' }}
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>

            <div className="dialog-actions">
              <button className="btn btn-primary" onClick={() => setIsSettingsOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="dialog-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="dialog" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Add CD</h2>
            <input 
              type="text" 
              placeholder="Catalog Number (e.g. CK 52864)"
              value={catalogNumber}
              onChange={e => setCatalogNumber(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            {searchError && <p style={{ color: '#F2B8B5', fontSize: '12px' }}>{searchError}</p>}
            
            {searchResult ? (
              <div style={{ marginBottom: '24px', backgroundColor: '#1C1B1F', padding: '16px', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '14px', marginBottom: '4px' }}>{searchResult.title}</h3>
                <p style={{ fontSize: '12px', color: '#938F99' }}>{searchResult.artist}</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={() => handleAdd('wanna_buy')} disabled={isAdding}>
                    Wanna Buy
                  </button>
                  <button className="btn btn-primary" onClick={() => handleAdd('have')} disabled={isAdding}>
                    Have It
                  </button>
                </div>
              </div>
            ) : (
              <div className="dialog-actions">
                <button className="btn btn-text" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSearch} disabled={!catalogNumber.trim()}>Search</button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
