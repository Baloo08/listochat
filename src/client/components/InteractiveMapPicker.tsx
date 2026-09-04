import React, { useEffect, useRef, useState } from 'react';
import { Navigation, MapPin, CheckCircle, Info, RefreshCw } from 'lucide-react';

declare global {
  interface Window {
    L: any;
  }
}

interface InteractiveMapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationChange?: (loc: { lat: number; lng: number; mapsUrl: string }) => void;
  storeLat?: number;
  storeLng?: number;
  storeName?: string;
  isDark?: boolean;
  primaryColor?: string;
  readonly?: boolean;
  height?: string | number;
}

export default function InteractiveMapPicker({
  initialLat = 9.9333,
  initialLng = -84.0833,
  onLocationChange,
  storeLat,
  storeLng,
  storeName = 'Local / Restaurante',
  isDark = false,
  primaryColor = '#16a34a',
  readonly = false,
  height = '240px'
}: InteractiveMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng
  });
  const [isLocating, setIsLocating] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let checkInterval: any = null;

    const initLeaflet = () => {
      if (typeof window !== 'undefined' && window.L && mapContainerRef.current) {
        if (!mapInstanceRef.current) {
          setupMap();
        }
        setMapReady(true);
        if (checkInterval) clearInterval(checkInterval);
      }
    };

    if (typeof window !== 'undefined') {
      if (window.L) {
        initLeaflet();
      } else {
        checkInterval = setInterval(initLeaflet, 200);
      }
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const createPinIcon = (color: string, label?: string) => {
    if (!window.L) return null;
    return window.L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
          ${label ? `<div style="background-color: ${color}; color: white; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; white-space: nowrap; margin-bottom: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${label}</div>` : ''}
          <svg width="32" height="42" viewBox="0 0 384 512" fill="${color}" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.4));">
            <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"/>
          </svg>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });
  };

  const setupMap = () => {
    if (!mapContainerRef.current || !window.L) return;

    const L = window.L;
    const centerLat = currentCoords.lat || initialLat || 9.9333;
    const centerLng = currentCoords.lng || initialLng || -84.0833;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 15,
      zoomControl: !readonly,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    if (storeLat && storeLng) {
      const storeIcon = createPinIcon('#ea580c', storeName);
      if (storeIcon) {
        L.marker([storeLat, storeLng], { icon: storeIcon }).addTo(map);
      }
    }

    const customerIcon = createPinIcon(primaryColor || '#16a34a', readonly ? undefined : 'Punto de Entrega');
    const marker = L.marker([centerLat, centerLng], {
      icon: customerIcon,
      draggable: !readonly
    }).addTo(map);

    if (!readonly) {
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        updateLocation(position.lat, position.lng);
      });

      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng);
        updateLocation(e.latlng.lat, e.latlng.lng);
      });
    }

    markerRef.current = marker;
    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 250);
  };

  const updateLocation = (lat: number, lng: number) => {
    setCurrentCoords({ lat, lng });
    const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
    if (onLocationChange) {
      onLocationChange({ lat, lng, mapsUrl });
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (markerRef.current && mapInstanceRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          mapInstanceRef.current.setView([lat, lng], 16);
        }
        updateLocation(lat, lng);
        setIsLocating(false);
      },
      (err) => {
        alert('No se pudo obtener tu ubicación GPS: ' + err.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (initialLat && initialLng && markerRef.current && mapInstanceRef.current) {
      if (Math.abs(currentCoords.lat - initialLat) > 0.0001 || Math.abs(currentCoords.lng - initialLng) > 0.0001) {
        setCurrentCoords({ lat: initialLat, lng: initialLng });
        markerRef.current.setLatLng([initialLat, initialLng]);
        mapInstanceRef.current.setView([initialLat, initialLng]);
      }
    }
  }, [initialLat, initialLng]);

  return (
    <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: isDark ? '1px solid #334155' : '1px solid #cbd5e1' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: typeof height === 'number' ? `${height}px` : height, zIndex: 1 }} />

      {!readonly && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: isDark ? '#0f172a' : '#f8fafc',
          borderTop: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '0.78rem'
        }}>
          <span style={{ color: isDark ? '#94a3b8' : '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Info size={14} color={primaryColor} /> Arrastra el marcador o toca el mapa para fijar tu ubicación
          </span>

          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: primaryColor,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '5px 10px',
              fontWeight: 'bold',
              fontSize: '0.75rem',
              cursor: isLocating ? 'not-allowed' : 'pointer'
            }}
          >
            {isLocating ? <RefreshCw size={12} className="spin" /> : <Navigation size={12} />}
            {isLocating ? 'Obteniendo...' : 'Mi GPS'}
          </button>
        </div>
      )}
    </div>
  );
}
