import React, { useState, useEffect } from 'react';
import { searchStops, StopItem } from '../services/api.js';

interface RouteSearchProps {
  onSearch: (from: [number, number], to: [number, number], time?: string) => void;
  isLoading: boolean;
  externalOrigin?: { name: string; coord: [number, number] } | null;
  externalDest?: { name: string; coord: [number, number] } | null;
}

export const RouteSearch: React.FC<RouteSearchProps> = ({ onSearch, isLoading, externalOrigin, externalDest }) => {
  const [originQuery, setOriginQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [originCoord, setOriginCoord] = useState<[number, number] | null>(null);
  const [destCoord, setDestCoord] = useState<[number, number] | null>(null);

  const [originSuggestions, setOriginSuggestions] = useState<StopItem[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<StopItem[]>([]);

  // Favorite stops in localStorage (wrapped in try/catch)
  const [favorites, setFavorites] = useState<StopItem[]>(() => {
    try {
      const saved = localStorage.getItem('laku_fav_stops');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (externalOrigin) {
      setOriginQuery(externalOrigin.name);
      setOriginCoord(externalOrigin.coord);
    }
  }, [externalOrigin]);

  useEffect(() => {
    if (externalDest) {
      setDestQuery(externalDest.name);
      setDestCoord(externalDest.coord);
    }
  }, [externalDest]);

  // Autocomplete debouncer for Origin
  useEffect(() => {
    if (!originQuery.trim() || originCoord) {
      setOriginSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await searchStops(originQuery);
      setOriginSuggestions(res);
    }, 200);
    return () => clearTimeout(t);
  }, [originQuery, originCoord]);

  // Autocomplete debouncer for Destination
  useEffect(() => {
    if (!destQuery.trim() || destCoord) {
      setDestSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await searchStops(destQuery);
      setDestSuggestions(res);
    }, 200);
    return () => clearTimeout(t);
  }, [destQuery, destCoord]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Browser tidak mendukung geolokasi GPS.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOriginCoord([pos.coords.latitude, pos.coords.longitude]);
        setOriginQuery('Lokasi Sekarang (GPS)');
        setOriginSuggestions([]);
      },
      () => alert('Gagal mengakses GPS.')
    );
  };

  const handleSwap = () => {
    const tempQ = originQuery;
    const tempC = originCoord;
    setOriginQuery(destQuery);
    setOriginCoord(destCoord);
    setDestQuery(tempQ);
    setDestCoord(tempC);
  };

  const handleExecute = () => {
    if (!originCoord || !destCoord) {
      alert('Silakan pilih halte awal dan tujuan dari daftar saran.');
      return;
    }
    onSearch(originCoord, destCoord);
  };

  return (
    <div className="search-box">
      {/* Origin Input */}
      <div className="input-row">
        <span className="input-dot origin" />
        <input
          className="search-input"
          placeholder="Asal (ketik nama halte/stasiun)"
          value={originQuery}
          onChange={(e) => {
            setOriginQuery(e.target.value);
            setOriginCoord(null);
          }}
        />
        {originQuery && (
          <button
            className="clear-btn"
            onClick={() => {
              setOriginQuery('');
              setOriginCoord(null);
            }}
          >
            ×
          </button>
        )}
      </div>

      {originSuggestions.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, maxHeight: 180, overflowY: 'auto' }}>
          {originSuggestions.map((s) => (
            <div
              key={s.stop_id}
              style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', borderBottom: '1px solid #F1F5F9' }}
              onClick={() => {
                setOriginQuery(s.stop_name);
                setOriginCoord([s.stop_lat, s.stop_lon]);
                setOriginSuggestions([]);
              }}
            >
              <strong>{s.stop_name}</strong>
              <span style={{ fontSize: 11, color: '#64748B', marginLeft: 6 }}>({s.mode})</span>
            </div>
          ))}
        </div>
      )}

      {/* Destination Input */}
      <div className="input-row">
        <span className="input-dot destination" />
        <input
          className="search-input"
          placeholder="Tujuan (ketik nama halte/stasiun)"
          value={destQuery}
          onChange={(e) => {
            setDestQuery(e.target.value);
            setDestCoord(null);
          }}
        />
        {destQuery && (
          <button
            className="clear-btn"
            onClick={() => {
              setDestQuery('');
              setDestCoord(null);
            }}
          >
            ×
          </button>
        )}
      </div>

      {destSuggestions.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, maxHeight: 180, overflowY: 'auto' }}>
          {destSuggestions.map((s) => (
            <div
              key={s.stop_id}
              style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', borderBottom: '1px solid #F1F5F9' }}
              onClick={() => {
                setDestQuery(s.stop_name);
                setDestCoord([s.stop_lat, s.stop_lon]);
                setDestSuggestions([]);
              }}
            >
              <strong>{s.stop_name}</strong>
              <span style={{ fontSize: 11, color: '#64748B', marginLeft: 6 }}>({s.mode})</span>
            </div>
          ))}
        </div>
      )}

      {/* Utility Actions */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          style={{ background: 'none', border: 'none', color: '#005BAC', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '6px 0', minHeight: 44, display: 'flex', alignItems: 'center' }}
        >
          📍 Lokasi Saya
        </button>
        <button
          type="button"
          onClick={handleSwap}
          style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 8px', minHeight: 44, display: 'flex', alignItems: 'center' }}
        >
          ⇅ Tukar
        </button>
      </div>

      <button className="btn-primary" onClick={handleExecute} disabled={isLoading}>
        {isLoading ? 'Mencari Rute...' : 'Cari Rute Transit'}
      </button>
    </div>
  );
};
