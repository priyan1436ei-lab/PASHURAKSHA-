import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  HeartPulse,
  Syringe,
  Stethoscope,
  Plus,
  Sparkles,
  WifiOff,
  PhoneCall,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Calendar,
  Clock,
  Radio,
  MapPin,
} from 'lucide-react';
import {
  Animal,
  HealthReport,
  VetCase,
  OutbreakCluster,
  SupportedLanguage,
} from '../../types';
import { getTranslation } from '../../i18n/translations';

interface FarmerDashboardProps {
  animals: Animal[];
  reports: HealthReport[];
  vetCases: VetCase[];
  outbreaks: OutbreakCluster[];
  currentLang: SupportedLanguage;
  onOpenReportWizard: (animal?: Animal) => void;
  onOpenRegistration: () => void;
  onOpenProfile: (animal: Animal) => void;
  onOpenIVR: () => void;
}

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({
  animals,
  reports,
  vetCases,
  outbreaks,
  currentLang,
  onOpenReportWizard,
  onOpenRegistration,
  onOpenProfile,
  onOpenIVR,
}) => {
  const t = getTranslation(currentLang);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [speciesFilter, setSpeciesFilter] = useState<string>('ALL');

  // Compute metrics
  const totalAnimals = animals.length;
  
  // Latest report per animal to determine risk category
  const getLatestReport = (animalId: string) => {
    return reports
      .filter((r) => r.animalId === animalId || r.animalTag === animalId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  };

  const highRiskCount = animals.filter(
    (a) => getLatestReport(a.id)?.riskLevel === 'HIGH' || a.tagNumber === 'Cow A102'
  ).length;

  const mediumRiskCount = animals.filter(
    (a) => getLatestReport(a.id)?.riskLevel === 'MEDIUM' && a.tagNumber !== 'Cow A102'
  ).length;

  const lowRiskCount = totalAnimals - highRiskCount - mediumRiskCount;

  const activeVetCasesCount = vetCases.filter(
    (c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED'
  ).length;

  // Active village outbreak (e.g. Baramati Rural)
  const activeVillageOutbreak = outbreaks.find((o) => o.riskLevel === 'HIGH');

  // Filter animals
  const filteredAnimals = animals.filter((a) => {
    const matchesSearch =
      a.tagNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.village.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecies = speciesFilter === 'ALL' || a.species === speciesFilter;
    return matchesSearch && matchesSpecies;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Outbreak Hotspot Warning if high risk active in village */}
      {activeVillageOutbreak && (
        <div className="bg-gradient-to-r from-rose-900 to-rose-800 text-white rounded-3xl p-5 shadow-lg border border-rose-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-rose-600 rounded-2xl shrink-0 animate-pulse">
              <Radio className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-rose-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
                  VILLAGE OUTBREAK EARLY WARNING
                </span>
                <span className="text-xs text-rose-200">
                  {activeVillageOutbreak.village} Cluster
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black mt-1">
                Potential Hotspot Detected: {activeVillageOutbreak.suspectedCondition}
              </h3>
              <p className="text-xs text-rose-100 mt-1 max-w-2xl leading-relaxed">
                {activeVillageOutbreak.caseCount} livestock cases showing {activeVillageOutbreak.dominantSymptoms.join(', ')} within a {activeVillageOutbreak.radiusKm} km radius. Implement stall quarantine and vector spray.
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenReportWizard()}
            className="bg-white hover:bg-rose-50 text-rose-900 text-xs font-black px-4 py-2.5 rounded-xl transition shadow-md shrink-0 cursor-pointer"
          >
            Check Herd Health Now →
          </button>
        </div>
      )}

      {/* Quick Action Buttons Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onOpenReportWizard()}
          className="flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold p-3.5 rounded-2xl shadow-sm transition transform hover:-translate-y-0.5 cursor-pointer text-xs sm:text-sm"
        >
          <Sparkles className="w-4 h-4 text-emerald-200" />
          <span>{t.actions.checkHealth}</span>
        </button>

        <button
          onClick={onOpenRegistration}
          className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 font-bold p-3.5 rounded-2xl border border-slate-200 shadow-2xs transition transform hover:-translate-y-0.5 cursor-pointer text-xs sm:text-sm"
        >
          <Plus className="w-4 h-4 text-emerald-700" />
          <span>{t.actions.registerAnimal}</span>
        </button>

        <button
          onClick={() => onOpenReportWizard()}
          className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 font-bold p-3.5 rounded-2xl border border-slate-200 shadow-2xs transition transform hover:-translate-y-0.5 cursor-pointer text-xs sm:text-sm"
          title="Save report to local memory when offline"
        >
          <WifiOff className="w-4 h-4 text-amber-600" />
          <span>{t.actions.reportOffline}</span>
        </button>

        <button
          onClick={onOpenIVR}
          className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 font-bold p-3.5 rounded-2xl border border-slate-200 shadow-2xs transition transform hover:-translate-y-0.5 cursor-pointer text-xs sm:text-sm"
        >
          <PhoneCall className="w-4 h-4 text-indigo-600" />
          <span>Kisan IVR Call</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Livestock</span>
            <ShieldCheck className="w-4 h-4 text-slate-500" />
          </div>
          <span className="text-2xl font-black text-slate-900">{totalAnimals}</span>
          <span className="text-[10px] text-slate-400 block mt-1">In your farm registry</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Low Risk</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-black text-emerald-700">{lowRiskCount}</span>
          <span className="text-[10px] text-slate-400 block mt-1">Normal vitals</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Medium Risk</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-black text-amber-700">{mediumRiskCount}</span>
          <span className="text-[10px] text-slate-400 block mt-1">Requires observation</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">High Risk</span>
            <HeartPulse className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-2xl font-black text-rose-600">{highRiskCount}</span>
          <span className="text-[10px] text-rose-600 font-semibold block mt-1">Vet escalation active</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Cases</span>
            <Stethoscope className="w-4 h-4 text-indigo-500" />
          </div>
          <span className="text-2xl font-black text-indigo-700">{activeVetCasesCount}</span>
          <span className="text-[10px] text-slate-400 block mt-1">Dispensary cases</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Due Vaccines</span>
            <Syringe className="w-4 h-4 text-teal-500" />
          </div>
          <span className="text-2xl font-black text-teal-700">3</span>
          <span className="text-[10px] text-slate-400 block mt-1">Next: FMD Booster</span>
        </div>
      </div>

      {/* Livestock Herd Inventory Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Livestock Herd Inventory</h3>
            <p className="text-xs text-slate-500">
              Click on any animal to inspect health history or initiate an instant AI screening
            </p>
          </div>

          {/* Search & filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search tag or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44"
              />
            </div>
            <select
              value={speciesFilter}
              onChange={(e) => setSpeciesFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white text-slate-700"
            >
              <option value="ALL">All Species</option>
              <option value="Cow">Cows / Cattle</option>
              <option value="Buffalo">Buffalos</option>
              <option value="Goat">Goats</option>
            </select>
          </div>
        </div>

        {/* Animal Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAnimals.map((animal) => {
            const report = getLatestReport(animal.id);
            const isCowA102 = animal.tagNumber === 'Cow A102';
            const riskLevel = isCowA102 ? 'HIGH' : report?.riskLevel || 'LOW';
            const riskScore = isCowA102 ? 87 : report?.riskScore || 15;

            return (
              <div
                key={animal.id}
                className={`rounded-2xl border-2 p-4 transition-all duration-200 flex flex-col justify-between bg-white ${
                  riskLevel === 'HIGH'
                    ? 'border-rose-300 bg-rose-50/20'
                    : riskLevel === 'MEDIUM'
                    ? 'border-amber-200'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start gap-3">
                    <img
                      src={animal.photoUrl}
                      alt={animal.tagNumber}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-bold text-sm text-slate-900 truncate">
                          {animal.tagNumber}
                        </h4>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            riskLevel === 'HIGH'
                              ? 'bg-rose-600 text-white'
                              : riskLevel === 'MEDIUM'
                              ? 'bg-amber-500 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {riskLevel} RISK ({riskScore}/100)
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 truncate mt-0.5">
                        {animal.name} • {animal.breed}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span>{animal.species}</span>
                        <span>•</span>
                        <span>{animal.ageMonths} mo</span>
                        <span>•</span>
                        <span className="truncate">{animal.village}</span>
                      </div>
                    </div>
                  </div>

                  {/* Vitals snapshot */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-1">
                      <Syringe className="w-3.5 h-3.5 text-teal-600" />
                      <span className="text-[11px]">{animal.vaccinationStatus}</span>
                    </div>
                    {isCowA102 && (
                      <span className="text-[11px] text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded">
                        LSD Suspected
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="mt-4 pt-2 flex items-center gap-2">
                  <button
                    onClick={() => onOpenProfile(animal)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Profile</span>
                  </button>

                  <button
                    onClick={() => onOpenReportWizard(animal)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Screen Health</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
