import React from 'react';

interface ModeFilterProps {
  selectedMode: string;
  onSelectMode: (mode: string) => void;
}

const MODES = [
  { id: 'all', label: 'Semua Moda' },
  { id: 'krl', label: '🚆 KRL' },
  { id: 'mrt', label: '🚇 MRT' },
  { id: 'lrt', label: '🚊 LRT' },
  { id: 'brt', label: '🚌 TransJakarta BRT' },
  { id: 'mikrotrans', label: '🚐 Mikrotrans (Rp0)' }
];

export const ModeFilter: React.FC<ModeFilterProps> = ({ selectedMode, onSelectMode }) => {
  return (
    <div className="mode-pills">
      {MODES.map((m) => (
        <button
          key={m.id}
          className={`pill-btn ${selectedMode === m.id ? 'active' : ''}`}
          onClick={() => onSelectMode(m.id)}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
};
