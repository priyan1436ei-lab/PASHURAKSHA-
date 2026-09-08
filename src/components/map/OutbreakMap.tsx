import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { OutbreakCluster, HealthReport, RiskLevel } from '../../types';

interface OutbreakMapProps {
  reports: HealthReport[];
  clusters: OutbreakCluster[];
  selectedClusterId?: string;
  onSelectCluster?: (cluster: OutbreakCluster) => void;
  heightClass?: string;
}

export const OutbreakMap: React.FC<OutbreakMapProps> = ({
  reports,
  clusters,
  selectedClusterId,
  onSelectCluster,
  heightClass = 'h-[500px]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center map around Pune rural / Baramati belt (approx lat 18.25, lng 74.3)
    const map = L.map(mapContainerRef.current, {
      center: [18.25, 74.4],
      zoom: 9,
      scrollWheelZoom: false,
    });

    // OpenStreetMap standard tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers and cluster circles when data changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = markersLayerRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // Helper for custom SVG pin marker
    const createPinIcon = (colorHex: string, label: string) => {
      return L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
            <div style="background-color: ${colorHex}; width: 22px; height: 22px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
              <span style="transform: rotate(45deg); font-size: 9px; font-weight: bold; color: white;">${label}</span>
            </div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -28],
      });
    };

    // 1. Render Cluster Hotspot Circles
    clusters.forEach((cluster) => {
      const circleColor =
        cluster.riskLevel === 'HIGH'
          ? '#e11d48' // Rose/Red
          : cluster.riskLevel === 'MEDIUM'
          ? '#ea580c' // Orange
          : '#10b981'; // Green

      // Radius circle
      const circle = L.circle([cluster.lat, cluster.lng], {
        color: circleColor,
        fillColor: circleColor,
        fillOpacity: 0.18,
        radius: cluster.radiusKm * 1000,
        weight: 2,
        dashArray: cluster.riskLevel === 'HIGH' ? '6, 6' : undefined,
      });

      const clusterPopupContent = `
        <div style="font-family: sans-serif; min-width: 220px; padding: 4px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
            <span style="background: ${circleColor}; color: white; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px;">
              ${cluster.riskLevel} RISK HOTSPOT
            </span>
            <span style="font-size: 11px; color: #64748b;">${cluster.village}</span>
          </div>
          <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #0f172a;">${cluster.clusterName}</h4>
          <p style="margin: 0 0 6px 0; font-size: 11px; color: #475569;">
            <strong>Case Count:</strong> ${cluster.caseCount} livestock reports<br/>
            <strong>Suspected:</strong> ${cluster.suspectedCondition}<br/>
            <strong>Symptoms:</strong> ${cluster.dominantSymptoms.join(', ')}<br/>
            <strong>Surveillance Radius:</strong> ${cluster.radiusKm} km<br/>
            <strong>Affected Tags:</strong> ${cluster.affectedAnimalTags.join(', ')}
          </p>
          <div style="font-size: 10px; color: #d97706; background: #fffbeb; padding: 4px 6px; border-radius: 4px; border: 1px solid #fde68a;">
            ⚠ Potential outbreak hotspot – Veterinary investigation recommended.
          </div>
        </div>
      `;

      circle.bindPopup(clusterPopupContent);
      circle.on('click', () => {
        if (onSelectCluster) onSelectCluster(cluster);
      });
      circle.addTo(layerGroup);
    });

    // 2. Render Individual Case Markers
    reports.forEach((rep) => {
      let pinColor = '#10b981'; // Green LOW
      let pinLabel = 'L';
      if (rep.riskLevel === 'HIGH') {
        pinColor = '#e11d48'; // Red HIGH
        pinLabel = 'H';
      } else if (rep.riskLevel === 'MEDIUM') {
        pinColor = '#ea580c'; // Orange MEDIUM
        pinLabel = 'M';
      }

      const marker = L.marker([rep.lat, rep.lng], {
        icon: createPinIcon(pinColor, pinLabel),
      });

      const reportPopup = `
        <div style="font-family: sans-serif; min-width: 200px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <strong style="font-size: 13px; color: #0f172a;">${rep.animalTag}</strong>
            <span style="background: ${pinColor}; color: white; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px;">
              ${rep.riskScore}/100
            </span>
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
            Farmer: ${rep.farmerName} • ${rep.village}
          </div>
          <div style="font-size: 11px; color: #334155; margin-bottom: 4px;">
            <strong>Temp:</strong> ${rep.temperatureC}°C | <strong>Vitals:</strong> ${rep.activityLevel}
          </div>
          <div style="font-size: 11px; color: #334155; margin-bottom: 6px;">
            <strong>Symptoms:</strong> ${rep.symptoms.slice(0, 2).join(', ')}
          </div>
          <div style="font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 4px;">
            Screening: ${rep.screeningResult.substring(0, 70)}...
          </div>
        </div>
      `;

      marker.bindPopup(reportPopup);
      marker.addTo(layerGroup);
    });
  }, [reports, clusters, onSelectCluster]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
      <div ref={mapContainerRef} className={`w-full ${heightClass} z-0`} />

      {/* Map Legend Floating Overlay */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-xs px-3 py-2 rounded-xl shadow-md border border-slate-200 text-xs">
        <span className="font-bold text-slate-800 block mb-1.5">Disease Surveillance Map</span>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-600 inline-block"></span>
            <span className="text-slate-700 font-medium">High Risk (70-100)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
            <span className="text-slate-700 font-medium">Medium Risk (40-69)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-slate-700 font-medium">Low Risk (0-39)</span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2">
            <span className="w-3 h-3 rounded-full border-2 border-dashed border-rose-600 bg-rose-100/50 inline-block"></span>
            <span className="text-slate-700 font-medium">Potential Hotspot Cluster</span>
          </div>
        </div>
      </div>
    </div>
  );
};
