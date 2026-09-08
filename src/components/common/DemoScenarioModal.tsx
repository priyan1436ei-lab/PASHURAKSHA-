import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  FlaskConical,
  Pill,
  Radio,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { UserRole } from '../../types';

interface DemoScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJumpToFarmerScreening: () => void;
  onSwitchRole: (role: UserRole) => void;
}

export const DemoScenarioModal: React.FC<DemoScenarioModalProps> = ({
  isOpen,
  onClose,
  onJumpToFarmerScreening,
  onSwitchRole,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);

  if (!isOpen) return null;

  const steps = [
    {
      num: 1,
      role: 'FARMER',
      title: 'Farmer Health Reporting & Vitals Intake',
      desc: 'Farmer Ramesh Patil in Baramati notices Gauri (Cow A102) has 40.2°C high pyrexia and circular nodular skin eruptions on her neck and flanks.',
      actionLabel: 'Launch Health Report Wizard for Cow A102',
      action: () => {
        onSwitchRole('FARMER');
        onClose();
        onJumpToFarmerScreening();
      },
    },
    {
      num: 2,
      role: 'AI_ENGINE',
      title: 'Multimodal AI Risk Scoring & Triage',
      desc: 'Multimodal engine analyzes high temperature (40.2°C), dermal nodularity, and incomplete vaccination to score Disease Risk at 87/100 (HIGH RISK). Suspected Capripoxvirus.',
      actionLabel: 'View Screening Output & Escalation',
      action: () => {
        onSwitchRole('FARMER');
        onClose();
        onJumpToFarmerScreening();
      },
    },
    {
      num: 3,
      role: 'VETERINARIAN',
      title: 'Automatic Veterinary Dispatch & Clinical Review',
      desc: 'Emergency case VET-MH-PUN-001 is auto-routed to Dr. Sunita Kulkarni at Baramati Taluka Dispensary with clinical evidence and farmer contact details.',
      actionLabel: 'Open Veterinary Dispensary Workbench',
      action: () => {
        onSwitchRole('VETERINARIAN');
        onClose();
      },
    },
    {
      num: 4,
      role: 'LAB',
      title: 'State Diagnostic Lab Referral (DIS Pune)',
      desc: 'Dr. Kulkarni requests skin scraping PCR test from Disease Investigation Section, Aundh. PCR returns POSITIVE for Capripoxvirus DNA.',
      actionLabel: 'Inspect Lab Referral & Diagnostics',
      action: () => {
        onSwitchRole('VETERINARIAN');
        onClose();
      },
    },
    {
      num: 5,
      role: 'TREATMENT',
      title: 'Standardized Treatment & Quarantine Protocol',
      desc: 'Antipyretics (Meloxicam), broad-spectrum coverage (Enrofloxacin), antiseptic zinc spray, and mandatory shed quarantine prescribed with follow-up scheduled.',
      actionLabel: 'Review Issued Prescription Plan',
      action: () => {
        onSwitchRole('VETERINARIAN');
        onClose();
      },
    },
    {
      num: 6,
      role: 'ADMIN',
      title: 'Community Outbreak Clustering & Early Warning',
      desc: 'Geospatial engine clusters 4 matching cases in Baramati Rural within 5 km. District authority dispatches ring vaccination and early warning broadcast.',
      actionLabel: 'View Outbreak Map & Broadcast Alert',
      action: () => {
        onSwitchRole('ADMIN');
        onClose();
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-950/20 rounded-2xl text-amber-950">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="bg-amber-950 text-amber-300 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
                SIH 2026 EVALUATION WORKFLOW
              </span>
              <h2 className="text-xl font-black mt-0.5">
                Cow A102 End-to-End Clinical Scenario
              </h2>
              <p className="text-xs font-semibold text-amber-900">
                Complete walkthrough from Farmer report to AI Screening, Vet Care & Community Alert
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-amber-950/20 text-amber-950 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step navigator & details */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-6 gap-2 border-b border-slate-100 pb-4">
            {steps.map((s) => (
              <button
                key={s.num}
                onClick={() => setActiveStep(s.num)}
                className={`py-2 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                  activeStep === s.num
                    ? 'bg-amber-500 text-amber-950 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>Step {s.num}</span>
              </button>
            ))}
          </div>

          {/* Current Step Showcase */}
          {(() => {
            const current = steps[activeStep - 1];
            return (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider bg-slate-200 text-slate-800 px-2.5 py-0.5 rounded-full">
                      Step {current.num}: {current.role}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Workflow Milestone {current.num} of 6
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-900">{current.title}</h3>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {current.desc}
                  </p>

                  {/* Highlights box */}
                  {current.num === 1 && (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                      <strong className="text-slate-900">Preset Demo Parameters:</strong>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                        <span>Animal: Cow A102 (Gauri)</span>
                        <span>Temp: 40.2°C (Fever)</span>
                        <span>Symptoms: Skin lesions, inappetence</span>
                        <span>Milk Yield: Sharp drop</span>
                      </div>
                    </div>
                  )}

                  {current.num === 2 && (
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-950 space-y-1">
                      <strong className="text-rose-900">AI Screening Output:</strong>
                      <p className="text-[11px]">
                        Disease Risk Score: <strong>87/100 (HIGH)</strong> • Notice: "AI-based screening suggests elevated disease risk. Veterinary verification is recommended."
                      </p>
                    </div>
                  )}

                  {current.num === 6 && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1">
                      <strong className="text-amber-900">Community Early Warning:</strong>
                      <p className="text-[11px]">
                        Spatial-temporal cluster identified in Baramati Rural (5 km radius). Warning broadcast alert pushed to all registered dairy farmers.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  {activeStep > 1 ? (
                    <button
                      onClick={() => setActiveStep(activeStep - 1)}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 cursor-pointer"
                    >
                      ← Previous Step
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2">
                    {activeStep < 6 && (
                      <button
                        onClick={() => setActiveStep(activeStep + 1)}
                        className="text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition cursor-pointer"
                      >
                        Next Step →
                      </button>
                    )}

                    <button
                      onClick={current.action}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{current.actionLabel}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
