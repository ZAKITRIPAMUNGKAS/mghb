import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { JourneyLeg } from '../services/api.js';

interface MapProps {
  originCoord: [number, number] | null;
  destCoord: [number, number] | null;
  selectedLegs?: JourneyLeg[];
  onMapClick?: (coords: [number, number]) => void;
}

export const Map: React.FC<MapProps> = ({ originCoord, destCoord, selectedLegs, onMapClick }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const originMarkerRef = useRef<maplibregl.Marker | null>(null);
  const destMarkerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: [106.8456, -6.2088], // Jakarta Pusat
      zoom: 12
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('click', (e) => {
      if (onMapClick) {
        onMapClick([e.lngLat.lat, e.lngLat.lng]);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Origin Marker
  useEffect(() => {
    if (!mapRef.current) return;
    if (originCoord) {
      if (!originMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'map-marker origin';
        el.style.width = '16px';
        el.style.height = '16px';
        el.style.backgroundColor = '#005BAC';
        el.style.border = '2px solid #FFFFFF';
        el.style.borderRadius = '50%';
        el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';

        originMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([originCoord[1], originCoord[0]])
          .addTo(mapRef.current);
      } else {
        originMarkerRef.current.setLngLat([originCoord[1], originCoord[0]]);
      }
    } else if (originMarkerRef.current) {
      originMarkerRef.current.remove();
      originMarkerRef.current = null;
    }
  }, [originCoord]);

  // Update Destination Marker
  useEffect(() => {
    if (!mapRef.current) return;
    if (destCoord) {
      if (!destMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'map-marker dest';
        el.style.width = '16px';
        el.style.height = '16px';
        el.style.backgroundColor = '#DC2626';
        el.style.border = '2px solid #FFFFFF';
        el.style.borderRadius = '3px';
        el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';

        destMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([destCoord[1], destCoord[0]])
          .addTo(mapRef.current);
      } else {
        destMarkerRef.current.setLngLat([destCoord[1], destCoord[0]]);
      }
    } else if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }
  }, [destCoord]);

  // Fit bounds when both coords are set
  useEffect(() => {
    if (mapRef.current && originCoord && destCoord) {
      const bounds = new maplibregl.LngLatBounds()
        .extend([originCoord[1], originCoord[0]])
        .extend([destCoord[1], destCoord[0]]);
      mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 15 });
    }
  }, [originCoord, destCoord]);

  return <div ref={mapContainer} className="map-container" />;
};
