import React, { useState } from 'react';
import { ItineraryItem } from '../services/api.js';

interface ItineraryCardProps {
  itinerary: ItineraryItem;
  isSelected: boolean;
  onSelect: () => void;
}

export const ItineraryCard: React.FC<ItineraryCardProps> = ({ itinerary, isSelected, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const durationMins = Math.round(itinerary.duration_seconds / 60);

  return (
    <div
      className={`itinerary-card ${isSelected ? 'selected' : ''}`}
      onClick={() => {
        onSelect();
        setIsExpanded(!isExpanded);
      }}
    >
      <div className="itin-header">
        <span className="itin-duration">{durationMins} Menit</span>
        <span className="itin-fare">Rp {itinerary.estimated_fare_idr.toLocaleString('id-ID')}</span>
      </div>

      <div className="itin-meta">
        <span>🚶 {itinerary.walking_distance_meters} m jalan</span>
        <span>⇄ {itinerary.transfers} transit</span>
        <span>⏱ {itinerary.departure_time} – {itinerary.arrival_time}</span>
      </div>

      {/* Route Badge Strip */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: isExpanded ? 12 : 0 }}>
        {itinerary.legs.map((leg, idx) => {
          if (leg.type === 'WALK') {
            return (
              <span key={idx} style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center' }}>
                🚶 {Math.round(leg.distance_meters)}m
              </span>
            );
          }
          return (
            <span
              key={idx}
              className="step-badge"
              style={{ backgroundColor: leg.route_color || '#005BAC' }}
            >
              {leg.route_short_name || leg.mode}
            </span>
          );
        })}
      </div>

      {/* Step by step timeline if expanded or selected */}
      {(isExpanded || isSelected) && (
        <div className="timeline">
          {itinerary.legs.map((leg, idx) => (
            <div key={idx} className="timeline-step">
              <span
                className="step-badge"
                style={{
                  backgroundColor: leg.type === 'WALK' ? '#64748B' : (leg.route_color || '#005BAC')
                }}
              >
                {leg.type === 'WALK' ? 'JALAN' : (leg.route_short_name || 'BUS')}
              </span>
              <div className="step-desc">
                <div>{leg.description}</div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                  {leg.from_stop_name} → {leg.to_stop_name} ({Math.round(leg.duration_seconds / 60)} mnt)
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
