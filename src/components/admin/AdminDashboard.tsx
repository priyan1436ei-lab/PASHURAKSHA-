import React, { useState } from 'react';
import {
  ShieldAlert,
  Building2,
  Radio,
  Send,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  Stethoscope,
  Filter,
  Users,
  Search,
  BellRing,
} from 'lucide-react';
import {
  Animal,
  HealthReport,
  VetCase,
  OutbreakCluster,
  SupportedLanguage,
} from '../../types';
import { OutbreakMap } from '../map/OutbreakMap';
import { api } from '../../services/api';

interface AdminDashboardProps {
  animals: Animal[];
  reports: HealthReport[];
  vetCases: VetCase[];
  outbreaks: OutbreakCluster[];
  currentLang: SupportedLanguage;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  animals,
  reports,
  vetCases,
  outbreaks,
  currentLang,
}) => {
  const [selectedVillage, setSelectedVillage] = useState<string>('ALL');
  const [selectedCluster, setSelectedCluster] = useState<OutbreakCluster | null>(outbreaks[0] || null);

  // Broadcast tool state
  const [broadcastVillage, setBroadcastVillage] = useState<string>('Baramati Rural');
  const [broadcastRadius, setBroadcastRadius] = useState<number>(5);
  const [broadcastCondition, setBroadcastCondition] = useState<string>('Lumpy Skin Disease (Capripoxvirus)');
  const [broadcastChannel, setBroadcastChannel] = useState<'SMS' | 'IVR_VOICE' | 'ALL'>('ALL');
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  // Analytics computation
  const totalLivestock = animals.length;
  const activeVetCases = vetCases.filter((c) => c.status !== 'RESOLVED').length;
  const highRiskReports = reports.filter((r) => r.riskLevel === 'HIGH').length;
  const mediumRiskReports = reports.filter((r) => r.riskLevel === 'MEDIUM').length;
  const lowRiskReports = reports.filter((r) => r.riskLevel === 'LOW').length;
  const totalHotspots = outbreaks.length;

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBroadcasting(true);
    try {
      await api.broadcastEarlyWarning(broadcastVillage, broadcastCondition, broadcastRadius);
      setBroadcastSuccess(
        `🚨 Early Warning Broadcast dispatched to 420 dairy farmers and 8 veterinary dispensaries in ${broadcastVillage} (${broadcastRadius} km radius).`
      );
      setTimeout(() => setBroadcastSuccess(null), 7000);
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Administration Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
              DISTRICT EPIDEMIOLOGICAL SURVEILLANCE
            </span>
            <span className="text-xs text-slate-400">Department of Animal Husbandry, Pune District</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1">
            Disease Outbreak Early Warning System (NADRS Integrated)
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Real-time geospatial spatial-temporal clustering identifies emerging disease hotspots prior to cross-taluka epidemic spread.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Surveillance Status</span>
            <span className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              Active Monitoring
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase block">Total Livestock</span>
          <span className="text-2xl font-black text-slate-900">{totalLivestock}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">District Registry</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase block">High-Risk Cases</span>
          <span className="text-2xl font-black text-rose-600">{highRiskReports}</span>
          <span className="text-[10px] text-rose-600 font-bold block mt-0.5">Critical screening</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase block">Active Vet Cases</span>
          <span className="text-2xl font-black text-indigo-700">{activeVetCases}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Taluka Dispensaries</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase block">Hotspot Clusters</span>
          <span className="text-2xl font-black text-amber-700">{totalHotspots}</span>
          <span className="text-[10px] text-amber-700 font-bold block mt-0.5">7-day window</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase block">Registered Vets</span>
          <span className="text-2xl font-black text-teal-700">14</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Field officers</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase block">Pending Lab Tests</span>
          <span className="text-2xl font-black text-purple-700">
            {vetCases.filter((c) => c.status === 'LAB_REQUESTED').length}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">DIS Aundh</span>
        </div>
      </div>

      {/* Geospatial Outbreak Map Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Geospatial Disease Outbreak Hotspot Map</h3>
            <p className="text-xs text-slate-500">
              Interactive spatial-temporal clustering engine (Haversine distance &lt; 5 km with matching symptoms)
            </p>
          </div>
        </div>

        <OutbreakMap
          reports={reports}
          clusters={outbreaks}
          selectedClusterId={selectedCluster?.id}
          onSelectCluster={(c) => setSelectedCluster(c)}
          heightClass="h-[480px]"
        />
      </div>

      {/* Hotspots Breakdown & Early Warning Broadcast Tool (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Identified Outbreak Clusters Table (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900">Active Disease Cluster Hotspots</h3>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              {outbreaks.length} Hotspots Active
            </span>
          </div>

          <div className="space-y-3">
            {outbreaks.map((cluster) => (
              <div
                key={cluster.id}
                onClick={() => {
                  setSelectedCluster(cluster);
                  setBroadcastVillage(cluster.village);
                  setBroadcastCondition(cluster.suspectedCondition);
                }}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer ${
                  selectedCluster?.id === cluster.id
                    ? 'border-rose-500 bg-rose-50/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{cluster.village}</span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          cluster.riskLevel === 'HIGH'
                            ? 'bg-rose-600 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {cluster.riskLevel} RISK HOTSPOT
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-rose-900 mt-1">
                      {cluster.suspectedCondition}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      <strong>Dominant Symptoms:</strong> {cluster.dominantSymptoms.join(', ')}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-lg font-black text-rose-600 block">
                      {cluster.caseCount}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">Affected Herds</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Radius: {cluster.radiusKm} km</span>
                  <span>Tags: {cluster.affectedAnimalTags.join(', ')}</span>
                  <span className="text-rose-700 font-bold">Click to Broadcast →</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Early Warning Broadcast Dispatch Tool (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-600 text-white">
                <Radio className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                Community Early Warning Broadcast Dispatcher
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Instantly alert all dairy farmers, gram panchayats, and dispensaries in the hotspot zone.
            </p>
          </div>

          {broadcastSuccess && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-xs text-emerald-900 font-medium flex items-start gap-2.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>{broadcastSuccess}</div>
            </div>
          )}

          <form onSubmit={handleBroadcast} className="space-y-3.5 text-xs text-slate-700">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-900 mb-1">Target Village / Hotspot</label>
                <input
                  type="text"
                  required
                  value={broadcastVillage}
                  onChange={(e) => setBroadcastVillage(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">Surveillance Radius</label>
                <select
                  value={broadcastRadius}
                  onChange={(e) => setBroadcastRadius(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-medium"
                >
                  <option value={3}>3 km (Immediate Village)</option>
                  <option value={5}>5 km (Buffer Zone)</option>
                  <option value={10}>10 km (Taluka Ring)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-900 mb-1">Suspected Disease / Alert Condition</label>
              <input
                type="text"
                required
                value={broadcastCondition}
                onChange={(e) => setBroadcastCondition(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-semibold text-rose-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-900 mb-1">Multi-Channel Delivery Mode</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBroadcastChannel('ALL')}
                  className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    broadcastChannel === 'ALL'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  SMS + IVR Call
                </button>
                <button
                  type="button"
                  onClick={() => setBroadcastChannel('SMS')}
                  className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    broadcastChannel === 'SMS'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  SMS Only
                </button>
                <button
                  type="button"
                  onClick={() => setBroadcastChannel('IVR_VOICE')}
                  className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    broadcastChannel === 'IVR_VOICE'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  Voice Call (IVR)
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
              <strong>Automated Alert Message Preview:</strong>
              <p className="italic mt-1 text-slate-800">
                "PASHURAKSHA ALERT: {broadcastCondition} cluster detected in {broadcastVillage}. Isolate sick animals, inspect skin nodules/fever, contact local dispensary 1800-XXX-XXXX."
              </p>
            </div>

            <button
              type="submit"
              disabled={isBroadcasting}
              className="w-full bg-rose-700 hover:bg-rose-800 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>
                {isBroadcasting
                  ? 'Transmitting Broadcast Alert...'
                  : `Broadcast Early Warning to ${broadcastVillage}`}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
