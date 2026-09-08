import React, { useState } from 'react';
import {
  AlertTriangle,
  Stethoscope,
  FlaskConical,
  Pill,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Search,
  Check,
  Calendar,
  Eye,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { VetCase, LabReferral, TreatmentPlan, CaseStatus } from '../../types';
import { api } from '../../services/api';

interface VetDashboardProps {
  vetCases: VetCase[];
  onOpenLabModal: (c: VetCase) => void;
  onOpenTreatmentModal: (c: VetCase) => void;
  onUpdateCase: (updatedCase: VetCase) => void;
}

export const VetDashboard: React.FC<VetDashboardProps> = ({
  vetCases,
  onOpenLabModal,
  onOpenTreatmentModal,
  onUpdateCase,
}) => {
  const [selectedCase, setSelectedCase] = useState<VetCase | null>(
    vetCases.find((c) => c.animalTag === 'Cow A102') || vetCases[0] || null
  );
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Status progression action: Accept Case
  const handleAcceptCase = async (c: VetCase) => {
    const updated = await api.updateVetCase(c.id, {
      status: 'ACCEPTED',
      assignedVetName: 'Dr. Sunita Kulkarni',
      assignedDispensary: 'Taluka Veterinary Dispensary, Baramati',
    });
    onUpdateCase(updated);
    if (selectedCase?.id === c.id) setSelectedCase(updated);
  };

  // Status progression action: Close / Resolve Case
  const handleCloseCase = async (c: VetCase) => {
    const updated = await api.updateVetCase(c.id, {
      status: 'RESOLVED',
    });
    onUpdateCase(updated);
    if (selectedCase?.id === c.id) setSelectedCase(updated);
  };

  // Filter cases
  const filteredCases = vetCases.filter((c) => {
    const matchesFilter = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesSearch =
      c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.animalTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.village.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const highRiskCasesCount = vetCases.filter((c) => c.riskLevel === 'HIGH').length;
  const newCasesCount = vetCases.filter((c) => c.status === 'NEW').length;
  const labCasesCount = vetCases.filter((c) => c.status === 'LAB_REQUESTED').length;
  const inTreatmentCount = vetCases.filter((c) => c.status === 'TREATMENT').length;

  return (
    <div className="space-y-6 pb-12">
      {/* High-Risk Escalation Banner */}
      {highRiskCasesCount > 0 && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-fade-in">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-rose-600 rounded-2xl text-white shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] bg-rose-600 text-white font-black px-2 py-0.5 rounded uppercase tracking-wider">
                URGENT VETERINARY DISPATCH
              </span>
              <h3 className="text-base font-black text-rose-950 mt-1">
                HIGH-RISK CASE: Cow A102 (Score: 87/100) in Baramati Rural
              </h3>
              <p className="text-xs text-rose-800 mt-0.5">
                Elevated pyrexia (40.2°C) with nodular cutaneous eruptions. Immediate on-site inspection recommended.
              </p>
            </div>
          </div>
          {selectedCase?.animalTag !== 'Cow A102' && (
            <button
              onClick={() => {
                const c102 = vetCases.find((c) => c.animalTag === 'Cow A102');
                if (c102) setSelectedCase(c102);
              }}
              className="bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer shrink-0"
            >
              Review Case Cow A102 →
            </button>
          )}
        </div>
      )}

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase block">New Triage Cases</span>
          <span className="text-2xl font-black text-rose-600">{newCasesCount}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Awaiting initial review</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase block">Under Lab Testing</span>
          <span className="text-2xl font-black text-purple-700">{labCasesCount}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">State DIS Laboratory</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase block">In Active Treatment</span>
          <span className="text-2xl font-black text-emerald-700">{inTreatmentCount}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Prescriptions issued</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase block">High-Risk Herds</span>
          <span className="text-2xl font-black text-amber-700">{highRiskCasesCount}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Community surveillance</span>
        </div>
      </div>

      {/* Main split work bench: Cases List + Selected Case Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cases List Sidebar (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900">Clinical Triage Queue</h3>
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
              {filteredCases.length} Cases
            </span>
          </div>

          {/* Filter tabs & Search */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search case, tag, farmer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap gap-1">
              {(['ALL', 'NEW', 'ACCEPTED', 'LAB_REQUESTED', 'TREATMENT', 'RESOLVED'] as (CaseStatus | 'ALL')[]).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg transition cursor-pointer ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Cards */}
          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {filteredCases.map((c) => {
              const isSelected = selectedCase?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className={`p-3.5 rounded-2xl border-2 transition cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                      : c.riskLevel === 'HIGH'
                      ? 'border-rose-200 hover:border-rose-300 bg-white'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {c.caseNumber}
                        </span>
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                            c.riskLevel === 'HIGH'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {c.riskLevel} ({c.riskScore}/100)
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-800 mt-0.5">
                        {c.animalTag} • {c.farmerName}
                      </h4>
                      <p className="text-[11px] text-slate-500">{c.village}, {c.district}</p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        c.status === 'NEW'
                          ? 'bg-rose-600 text-white'
                          : c.status === 'ACCEPTED'
                          ? 'bg-indigo-100 text-indigo-800'
                          : c.status === 'LAB_REQUESTED'
                          ? 'bg-purple-100 text-purple-800'
                          : c.status === 'TREATMENT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Temp: {c.temperatureC}°C</span>
                    <span className="truncate max-w-[140px]">{c.symptoms.slice(0, 2).join(', ')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Case Inspection & Action Workbench (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-5">
          {selectedCase ? (
            <>
              {/* Top Case header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {selectedCase.caseNumber}
                    </span>
                    <span
                      className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full ${
                        selectedCase.riskLevel === 'HIGH'
                          ? 'bg-rose-600 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {selectedCase.riskLevel} RISK ({selectedCase.riskScore}/100)
                    </span>
                    <span className="text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full">
                      Status: {selectedCase.status}
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-slate-900 mt-1">
                    {selectedCase.animalTag} ({selectedCase.species})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Farmer: {selectedCase.farmerName} ({selectedCase.farmerPhone}) • {selectedCase.village}, {selectedCase.district}
                  </p>
                </div>

                {/* Status action buttons */}
                <div className="flex flex-wrap gap-2">
                  {selectedCase.status === 'NEW' && (
                    <button
                      onClick={() => handleAcceptCase(selectedCase)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept Case</span>
                    </button>
                  )}

                  <button
                    onClick={() => onOpenLabModal(selectedCase)}
                    className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <FlaskConical className="w-3.5 h-3.5" />
                    <span>Lab Referral</span>
                  </button>

                  <button
                    onClick={() => onOpenTreatmentModal(selectedCase)}
                    className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Pill className="w-3.5 h-3.5" />
                    <span>Prescribe Treatment</span>
                  </button>

                  {selectedCase.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleCloseCase(selectedCase)}
                      className="border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl transition cursor-pointer"
                    >
                      Close Case
                    </button>
                  )}
                </div>
              </div>

              {/* Multimodal clinical presentation */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                {/* Photo & visual findings */}
                <div className="sm:col-span-5 space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">
                    Uploaded Clinical Image:
                  </span>
                  <img
                    src={selectedCase.imageUrl || 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=600&q=80'}
                    alt={selectedCase.animalTag}
                    className="w-full h-44 rounded-2xl object-cover border border-slate-200 shadow-xs"
                  />
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                    <strong className="text-slate-800">Visual Evidence:</strong> Nodular dermal eruptions (2-3 cm circumscribed) on neck and flank.
                  </div>
                </div>

                {/* Vitals & symptoms */}
                <div className="sm:col-span-7 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Pyrexia (Temp)</span>
                      <span className="text-sm font-black text-rose-600">{selectedCase.temperatureC}°C</span>
                      <span className="text-[10px] text-rose-500 block">Acute High Fever</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Urgency</span>
                      <span className="text-sm font-black text-slate-800">{selectedCase.urgency}</span>
                      <span className="text-[10px] text-slate-500 block">Within 24 Hours</span>
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-slate-800 block mb-1">Reported Symptoms:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCase.symptoms.map((s, i) => (
                        <span
                          key={i}
                          className="bg-slate-100 text-slate-800 font-medium px-2 py-0.5 rounded-md text-[11px]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-[11px]">
                    <span className="font-bold block">AI Multimodal Risk Evaluation:</span>
                    Elevated probability for Capripoxvirus (Lumpy Skin Disease). Secondary differential: Bovine Papillomatosis or Pseudo-lumpy. Immediate ring vaccination advised.
                  </div>
                </div>
              </div>

              {/* Lab Referral Status Box if exists */}
              {selectedCase.labReferral && (
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-purple-950">
                      <FlaskConical className="w-4 h-4 text-purple-700" />
                      <span>Lab Requisition: {selectedCase.labReferral.id}</span>
                    </div>
                    <span className="bg-purple-200 text-purple-900 font-bold px-2 py-0.5 rounded text-[10px]">
                      {selectedCase.labReferral.status}
                    </span>
                  </div>
                  <p className="text-slate-600">
                    Sample: {selectedCase.labReferral.sampleType} | Laboratory:{' '}
                    {selectedCase.labReferral.labName}
                  </p>
                  {selectedCase.labReferral.resultSummary && (
                    <div className="p-2.5 bg-white rounded-xl border border-purple-200 text-purple-950 font-medium">
                      <strong>Result:</strong> {selectedCase.labReferral.resultSummary}
                    </div>
                  )}
                </div>
              )}

              {/* Treatment Plan if prescribed */}
              {selectedCase.treatmentPlan && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-emerald-950">
                      <Pill className="w-4 h-4 text-emerald-700" />
                      <span>Issued Treatment Plan</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      Prescribed by {selectedCase.treatmentPlan.veterinarianName}
                    </span>
                  </div>
                  <p className="text-slate-700 italic">"{selectedCase.treatmentPlan.veterinaryAssessment}"</p>
                  <div className="space-y-1">
                    {selectedCase.treatmentPlan.medicines.map((m, idx) => (
                      <div key={idx} className="flex justify-between bg-white p-2 rounded-lg border border-emerald-100 text-[11px]">
                        <span className="font-bold text-slate-800">{m.name}</span>
                        <span className="text-slate-600">{m.dosage} ({m.duration})</span>
                      </div>
                    ))}
                  </div>
                  {selectedCase.treatmentPlan.followUpDate && (
                    <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5 pt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Next Clinical Follow-up: {selectedCase.treatmentPlan.followUpDate}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <Stethoscope className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-bold">Select a clinical case from queue to inspect</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
