import React, { useState } from 'react';
import {
  X,
  Syringe,
  AlertTriangle,
  Stethoscope,
  Calendar,
  Pill,
  ShieldCheck,
  ChevronRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Animal, HealthReport, VetCase } from '../../types';

interface AnimalProfileModalProps {
  animal: Animal | null;
  reports: HealthReport[];
  vetCases: VetCase[];
  isOpen: boolean;
  onClose: () => void;
  onCheckHealth: (animal: Animal) => void;
}

export const AnimalProfileModal: React.FC<AnimalProfileModalProps> = ({
  animal,
  reports,
  vetCases,
  isOpen,
  onClose,
  onCheckHealth,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'vaccines' | 'history' | 'treatments'>(
    'overview'
  );

  if (!isOpen || !animal) return null;

  const animalReports = reports.filter((r) => r.animalId === animal.id || r.animalTag === animal.tagNumber);
  const animalCases = vetCases.filter((c) => c.animalId === animal.id || c.animalTag === animal.tagNumber);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header Hero */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <img
              src={animal.photoUrl}
              alt={animal.tagNumber}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white/80 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black">{animal.tagNumber}</h2>
                <span className="bg-emerald-600/80 text-emerald-100 text-xs px-2 py-0.5 rounded-full font-bold">
                  {animal.species}
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                {animal.name} • {animal.breed} • {animal.ageMonths} Months ({animal.gender})
              </p>
              <p className="text-[11px] text-emerald-200 mt-0.5">
                Owner: {animal.farmerName} • {animal.village}, {animal.district}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-emerald-700/60 text-emerald-200 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 gap-4 text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 cursor-pointer transition ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Overview & Vitals
          </button>
          <button
            onClick={() => setActiveTab('vaccines')}
            className={`py-3 border-b-2 cursor-pointer transition ${
              activeTab === 'vaccines'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Vaccination ({animal.vaccinations.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 cursor-pointer transition ${
              activeTab === 'history'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            AI Screening History ({animalReports.length})
          </button>
          <button
            onClick={() => setActiveTab('treatments')}
            className={`py-3 border-b-2 cursor-pointer transition ${
              activeTab === 'treatments'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Clinical Cases ({animalCases.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 text-xs text-slate-700 space-y-4">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Weight</span>
                  <span className="text-sm font-bold text-slate-800">{animal.weightKg} kg</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Vaccination</span>
                  <span
                    className={`text-sm font-bold ${
                      animal.vaccinationStatus === 'COMPLETE'
                        ? 'text-emerald-700'
                        : animal.vaccinationStatus === 'PARTIAL'
                        ? 'text-amber-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {animal.vaccinationStatus}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Screenings</span>
                  <span className="text-sm font-bold text-slate-800">{animalReports.length} Reports</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Registered</span>
                  <span className="text-sm font-bold text-slate-800">
                    {new Date(animal.registeredAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Past Medical Background */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-1">Previous Diseases / Clinical Notes</h4>
                <p className="text-slate-600">
                  {animal.previousDiseases.length > 0
                    ? animal.previousDiseases.join(', ')
                    : 'No previous major infectious disease incidents documented.'}
                </p>
              </div>

              {/* Quick Health Check CTA */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-emerald-950">Notice unusual symptoms?</h4>
                  <p className="text-[11px] text-emerald-800">
                    Perform an instant multimodal AI risk screening for this livestock.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onCheckHealth(animal);
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Screen Health</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'vaccines' && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900">National Livestock Vaccination Schedule</h4>
              {animal.vaccinations.length === 0 ? (
                <p className="text-slate-400 py-4 text-center">No vaccination entries logged yet.</p>
              ) : (
                animal.vaccinations.map((v, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                        <Syringe className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">{v.vaccineName}</span>
                        <div className="text-[11px] text-slate-500">
                          Administered: {v.dateAdministered}
                        </div>
                      </div>
                    </div>
                    {v.nextDueDate && (
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Next Due
                        </span>
                        <span className="font-semibold text-amber-700">{v.nextDueDate}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900">AI Screening & Risk Reports</h4>
              {animalReports.length === 0 ? (
                <p className="text-slate-400 py-4 text-center">No health screenings on record.</p>
              ) : (
                animalReports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rep.riskLevel === 'HIGH'
                            ? 'bg-rose-100 text-rose-800'
                            : rep.riskLevel === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {rep.riskLevel} RISK ({rep.riskScore}/100)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(rep.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium">{rep.screeningResult}</p>
                    <div className="text-[11px] text-slate-500 flex items-center gap-3">
                      <span>Temp: {rep.temperatureC}°C</span>
                      <span>•</span>
                      <span>Symptoms: {rep.symptoms.join(', ')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'treatments' && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900">Veterinary Treatment & Follow-ups</h4>
              {animalCases.length === 0 ? (
                <p className="text-slate-400 py-4 text-center">
                  No active clinical cases or prescriptions for this livestock.
                </p>
              ) : (
                animalCases.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-900">{c.caseNumber}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                        Status: {c.status}
                      </span>
                    </div>
                    {c.vetAssessment && (
                      <p className="text-xs text-slate-700">
                        <strong>Clinical Assessment:</strong> {c.vetAssessment}
                      </p>
                    )}
                    {c.treatmentPlan && (
                      <div className="bg-slate-50 p-2.5 rounded-lg text-[11px] space-y-1">
                        <span className="font-bold text-slate-800 block">Prescribed Medicines:</span>
                        {c.treatmentPlan.medicines.map((m, idx) => (
                          <div key={idx} className="flex justify-between text-slate-600">
                            <span>{m.name}</span>
                            <span>{m.dosage} ({m.duration})</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {c.followUpDate && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-800 font-semibold mt-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Scheduled Follow-up: {c.followUpDate}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
