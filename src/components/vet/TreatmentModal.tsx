import React, { useState } from 'react';
import { X, Pill, Plus, Trash2, Calendar, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { VetCase, TreatmentPlan } from '../../types';
import { api } from '../../services/api';

interface TreatmentModalProps {
  vetCase: VetCase | null;
  isOpen: boolean;
  onClose: () => void;
  onTreatmentPrescribed: (treatment: TreatmentPlan) => void;
}

export const TreatmentModal: React.FC<TreatmentModalProps> = ({
  vetCase,
  isOpen,
  onClose,
  onTreatmentPrescribed,
}) => {
  const [assessment, setAssessment] = useState<string>(
    'Clinical examination confirms acute pyrexia with generalized nodular cutis eruptions consistent with Lumpy Skin Disease. Secondary bacterial complication prevention required.'
  );

  const [medicines, setMedicines] = useState<Array<{ name: string; dosage: string; duration: string }>>([
    { name: 'Meloxicam + Paracetamol (Melonex Plus)', dosage: '15 ml I/M once daily', duration: '3 days' },
    { name: 'Enrofloxacin 10% (Floxidin)', dosage: '15 ml I/M once daily', duration: '5 days' },
    { name: 'Ivermectin 1%', dosage: '7 ml S/C single dose', duration: 'Day 1' },
    { name: 'Topical Potassium Permanganate (0.1%) + Zinc Spray', dosage: 'Apply over lesions twice daily', duration: '7 days' },
  ]);

  const [newMedName, setNewMedName] = useState<string>('');
  const [newMedDosage, setNewMedDosage] = useState<string>('');
  const [newMedDuration, setNewMedDuration] = useState<string>('');

  const [advice, setAdvice] = useState<string>(
    'Keep animal in isolated mosquito/fly-net shed. Provide soft digestible green fodder and electro-mineral hydration. Do not mix with lactating herd.'
  );
  const [quarantine, setQuarantine] = useState<boolean>(true);
  const [followUpDate, setFollowUpDate] = useState<string>(
    new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !vetCase) return null;

  const handleAddMedicine = () => {
    if (newMedName.trim()) {
      setMedicines([
        ...medicines,
        {
          name: newMedName.trim(),
          dosage: newMedDosage.trim() || 'As directed',
          duration: newMedDuration.trim() || '3 days',
        },
      ]);
      setNewMedName('');
      setNewMedDosage('');
      setNewMedDuration('');
    }
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const plan = await api.prescribeTreatment({
        caseId: vetCase.id,
        veterinaryAssessment: assessment,
        medicines,
        advice,
        quarantineRecommended: quarantine,
        followUpDate,
      });
      onTreatmentPrescribed(plan);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-700 rounded-xl">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Veterinary Treatment Prescription</h2>
              <p className="text-xs text-emerald-200">
                Case {vetCase.caseNumber} • {vetCase.animalTag} ({vetCase.farmerName})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-emerald-800 text-emerald-200 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-700 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block font-bold text-slate-900 mb-1">
              Veterinary Clinical Assessment & Differential Diagnosis
            </label>
            <textarea
              rows={2}
              required
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Medicines prescription table */}
          <div>
            <label className="block font-bold text-slate-900 mb-1.5">
              Prescribed Medicines & Therapeutics
            </label>
            <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
              {medicines.map((med, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 text-xs"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <span className="font-bold text-slate-900 block truncate">{med.name}</span>
                    <span className="text-[11px] text-slate-500">
                      {med.dosage} • {med.duration}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMedicine(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Add item row */}
              <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Medicine name"
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white"
                />
                <input
                  type="text"
                  placeholder="Dosage (e.g. 10ml I/M)"
                  value={newMedDosage}
                  onChange={(e) => setNewMedDosage(e.target.value)}
                  className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Duration (e.g. 3 days)"
                    value={newMedDuration}
                    onChange={(e) => setNewMedDuration(e.target.value)}
                    className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddMedicine}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Farm advice */}
          <div>
            <label className="block font-bold text-slate-900 mb-1">
              Bio-security & Supportive Nursing Instructions
            </label>
            <textarea
              rows={2}
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2.5"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Isolate Animal (Quarantine)</span>
                <span className="text-[11px] text-slate-500">Prevent spread to neighboring pens</span>
              </div>
              <input
                type="checkbox"
                checked={quarantine}
                onChange={(e) => setQuarantine(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-900 mb-1">Mandatory Follow-up Date</label>
              <input
                type="date"
                required
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-bold text-slate-800"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Issue Official Veterinary Prescription & Treatment Plan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
