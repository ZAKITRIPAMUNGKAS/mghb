import React, { useState, useEffect } from 'react';
import { Map } from './components/Map.js';
import { RouteSearch } from './components/RouteSearch.js';
import { ModeFilter } from './components/ModeFilter.js';
import { ItineraryCard } from './components/ItineraryCard.js';
import { planRoute, fetchMetadata, ItineraryItem } from './services/api.js';

export const App: React.FC = () => {
  const [sheetState, setSheetState] = useState<'state-collapsed' | 'state-half' | 'state-full'>('state-half');
  const [selectedMode, setSelectedMode] = useState('all');

  const [originCoord, setOriginCoord] = useState<[number, number] | null>(null);
  const [destCoord, setDestCoord] = useState<[number, number] | null>(null);
  const [externalOrigin, setExternalOrigin] = useState<{ name: string; coord: [number, number] } | null>(null);
  const [externalDest, setExternalDest] = useState<{ name: string; coord: [number, number] } | null>(null);

  const [itineraries, setItineraries] = useState<ItineraryItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [meta, setMeta] = useState<any>(null);

  useEffect(() => {
    fetchMetadata().then(setMeta);
  }, []);

  const handleSearch = async (from: [number, number], to: [number, number]) => {
    setOriginCoord(from);
    setDestCoord(to);
    setIsLoading(true);
    setSheetState('state-half');

    try {
      const results = await planRoute(from[0], from[1], to[0], to[1]);
      setItineraries(results);
      setSelectedIndex(0);
      if (results.length > 0 && window.innerWidth <= 768) {
        setSheetState('state-half');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapClick = (coords: [number, number]) => {
    if (!originCoord) {
      setOriginCoord(coords);
      setExternalOrigin({ name: `Titik Peta (${coords[0].toFixed(4)}, ${coords[1].toFixed(4)})`, coord: coords });
    } else if (!destCoord) {
      setDestCoord(coords);
      setExternalDest({ name: `Titik Peta (${coords[0].toFixed(4)}, ${coords[1].toFixed(4)})`, coord: coords });
      handleSearch(originCoord, coords);
    } else {
      // Reset and set as new origin
      setOriginCoord(coords);
      setDestCoord(null);
      setExternalOrigin({ name: `Titik Peta (${coords[0].toFixed(4)}, ${coords[1].toFixed(4)})`, coord: coords });
      setExternalDest(null);
      setItineraries([]);
    }
  };

  const syncDateLabel = meta?.last_sync_timestamp
    ? new Date(meta.last_sync_timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : '13 Okt 2026';

  return (
    <>
      {/* Fullscreen Map Canvas */}
      <Map
        originCoord={originCoord}
        destCoord={destCoord}
        selectedLegs={itineraries[selectedIndex]?.legs}
        onMapClick={handleMapClick}
      />

      {/* Control Panel (Desktop: 400px sidebar, Mobile: 3-state bottom sheet) */}
      <aside className={`app-sidebar ${sheetState}`}>
        {/* Mobile drag handle to toggle sheet height */}
        <div
          className="sheet-handle"
          onClick={() => {
            if (sheetState === 'state-collapsed') setSheetState('state-half');
            else if (sheetState === 'state-half') setSheetState('state-full');
            else setSheetState('state-collapsed');
          }}
        />

        <div className="panel-header">
          <div className="brand-badge">
            <h1>LAKU</h1>
            <span>Transit Jabodetabek</span>
          </div>
          <span style={{ fontSize: 11, background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
            GTFS Resmi
          </span>
        </div>

        <div className="panel-body">
          {/* Mode Selector */}
          <ModeFilter selectedMode={selectedMode} onSelectMode={setSelectedMode} />

          {/* Search Inputs */}
          <RouteSearch
            onSearch={handleSearch}
            isLoading={isLoading}
            externalOrigin={externalOrigin}
            externalDest={externalDest}
          />

          {/* Results List */}
          {itineraries.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>
                Opsi Perjalanan ({itineraries.length} rute ditemukan)
              </div>
              {itineraries.map((itin, idx) => (
                <ItineraryCard
                  key={idx}
                  itinerary={itin}
                  isSelected={idx === selectedIndex}
                  onSelect={() => setSelectedIndex(idx)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer with Mandatory Provenance Date */}
        <footer className="panel-footer">
          <span>Data per {syncDateLabel}</span>
          <span style={{ fontWeight: 600 }}>KAI · MRT · LRT · TJ</span>
        </footer>
      </aside>
    </>
  );
};
