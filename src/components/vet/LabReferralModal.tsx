import React, { useState } from 'react';
import { X, FlaskConical, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { VetCase, LabReferral } from '../../types';
import { api } from '../../services/api';

interface LabReferralModalProps {
  vetCase: VetCase | null;
  isOpen: boolean;
  onClose: () => void;
  onReferralCreated: (referral: LabReferral) => void;
  onUpdateLabStatus: (labId: string, status: LabReferral['status'], summary?: string) => void;
}

export const LabReferralModal: React.FC<LabReferralModalProps> = ({
  vetCase,
  isOpen,
  onClose,
  onReferralCreated,
  onUpdateLabStatus,
}) => {
  const [suspectedCondition, setSuspectedCondition] = useState<string>(
    vetCase?.possibleConditions?.[0]?.name || 'Lumpy Skin Disease (Capripoxvirus)'
  );
  const [sampleType, setSampleType] = useState<LabReferral['sampleType']>('SKIN_SCRAPING');
  const [priority, setPriority] = useState<LabReferral['priority']>('URGENT');
  const [notes, setNotes] = useState<string>(
    'Multiple nodular cutaneous lesions observed. Requesting PCR confirmation and differential testing for pseudo-lumpy disease.'
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !vetCase) return null;

  const existingReferral = vetCase.labReferral;

  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const ref = await api.requestLabReferral({
        caseId: vetCase.id,
        animalTag: vetCase.animalTag,
        suspectedCondition,
        sampleType,
        priority,
        notes,
      });
      onReferralCreated(ref);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdvanceStatus = async (nextStatus: LabReferral['status'], resultSummary?: string) => {
    if (!existingReferral) return;
    await api.updateLabStatus(existingReferral.id, nextStatus, resultSummary);
    onUpdateLabStatus(existingReferral.id, nextStatus, resultSummary);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-purple-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-700 rounded-xl">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Veterinary Diagnostic Lab Referral</h2>
              <p className="text-xs text-purple-200">
                Case {vetCase.caseNumber} • {vetCase.animalTag} ({vetCase.species})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-purple-800 text-purple-200 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If Referral already exists, show lifecycle & simulate lab progress */}
        {existingReferral ? (
          <div className="p-5 space-y-4 text-xs text-slate-700">
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-950 text-sm">Lab Tracking ID: {existingReferral.id}</span>
                <span className="font-bold px-2 py-0.5 rounded bg-purple-200 text-purple-900 text-[10px]">
                  {existingReferral.status}
                </span>
              </div>
              <p className="text-slate-600">
                <strong>Facility:</strong> {existingReferral.labName || 'Disease Investigation Section, Pune'}
              </p>
              <p className="text-slate-600">
                <strong>Sample:</strong> {existingReferral.sampleType} | <strong>Priority:</strong>{' '}
                {existingReferral.priority}
              </p>
              <p className="text-slate-600">
                <strong>Suspected:</strong> {existingReferral.suspectedCondition}
              </p>
            </div>

            {/* Test Results if available */}
            {existingReferral.resultSummary && (
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 space-y-1 text-emerald-950">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Verified Diagnostic Result Available</span>
                </div>
                <p className="text-xs font-medium mt-1">{existingReferral.resultSummary}</p>
                <span className="text-[10px] text-emerald-700 block mt-1">
                  Validated by State Veterinary Virology Reference Laboratory.
                </span>
              </div>
            )}

            {/* Interactive Demo Progression Controls */}
            <div className="border-t border-slate-200 pt-3">
              <span className="font-bold text-slate-800 block mb-2">
                Simulate Diagnostic Lifecycle Steps:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleAdvanceStatus('SAMPLE_COLLECTED')}
                  className={`p-2 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                    existingReferral.status === 'SAMPLE_COLLECTED'
                      ? 'bg-purple-700 text-white border-purple-700'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                  }`}
                >
                  1. Sample Collected
                </button>

                <button
                  onClick={() => handleAdvanceStatus('UNDER_TEST')}
                  className={`p-2 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                    existingReferral.status === 'UNDER_TEST'
                      ? 'bg-purple-700 text-white border-purple-700'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                  }`}
                >
                  2. Under PCR Testing
                </button>

                <button
                  onClick={() =>
                    handleAdvanceStatus(
                      'RESULT_AVAILABLE',
                      'POSITIVE for Capripoxvirus DNA via Real-Time PCR (Ct value: 21.4). Immediate ring vaccination and isolation mandated.'
                    )
                  }
                  className={`p-2 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                    existingReferral.status === 'RESULT_AVAILABLE'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}
                >
                  3. Result: Positive
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Create New Referral Form */
          <form onSubmit={handleSubmitNew} className="p-5 space-y-4 text-xs text-slate-700">
            <div>
              <label className="block font-bold text-slate-900 mb-1">Suspected Condition</label>
              <input
                type="text"
                required
                value={suspectedCondition}
                onChange={(e) => setSuspectedCondition(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 font-semibold text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-900 mb-1">Sample Type</label>
                <select
                  value={sampleType}
                  onChange={(e) => setSampleType(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-medium"
                >
                  <option value="SKIN_SCRAPING">Skin Scraping / Scabs</option>
                  <option value="BLOOD">Whole Blood / Serum</option>
                  <option value="NASAL_SWAB">Nasal / Oral Swab</option>
                  <option value="MILK_SAMPLE">Milk Sample</option>
                  <option value="TISSUE_BIOPSY">Tissue Biopsy</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">Testing Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-medium"
                >
                  <option value="URGENT">Urgent (24-48 Hours)</option>
                  <option value="EMERGENCY">Emergency (Same Day)</option>
                  <option value="ROUTINE">Routine Surveillance</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-900 mb-1">
                Designated Diagnostic Reference Laboratory
              </label>
              <input
                type="text"
                readOnly
                value="Disease Investigation Section (DIS), Aundh, Pune, Maharashtra"
                className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-slate-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-900 mb-1">
                Clinical Observations & Special Instructions
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <FlaskConical className="w-4 h-4" />
              <span>Dispatch Lab Requisition Order</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
