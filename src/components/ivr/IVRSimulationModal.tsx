import React, { useState } from 'react';
import {
  X,
  PhoneCall,
  PhoneOff,
  Volume2,
  Mic,
  CheckCircle2,
  Radio,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';

interface IVRSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIVRReportSubmitted: () => void;
}

export const IVRSimulationModal: React.FC<IVRSimulationModalProps> = ({
  isOpen,
  onClose,
  onIVRReportSubmitted,
}) => {
  const [callState, setCallState] = useState<
    'IDLE' | 'RINGING' | 'CONNECTED' | 'ENDED'
  >('IDLE');
  const [ivrStep, setIvrStep] = useState<number>(1);
  const [pressedDigits, setPressedDigits] = useState<string>('');
  const [animalTagInput, setAnimalTagInput] = useState<string>('102');
  const [symptomChoice, setSymptomChoice] = useState<string>('Skin Lesions & High Fever');
  const [tempInput, setTempInput] = useState<string>('40.2');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleStartCall = () => {
    setCallState('RINGING');
    setPressedDigits('');
    setIvrStep(1);
    setTimeout(() => {
      setCallState('CONNECTED');
    }, 1200);
  };

  const handleEndCall = () => {
    setCallState('ENDED');
    setTimeout(() => {
      setCallState('IDLE');
      onClose();
    }, 1500);
  };

  const handlePressKeypad = (digit: string) => {
    setPressedDigits((prev) => prev + digit);

    if (ivrStep === 1) {
      // Language selected
      setIvrStep(2);
    } else if (ivrStep === 2) {
      // Menu option: 1 for report sick animal
      if (digit === '1') setIvrStep(3);
    } else if (ivrStep === 3) {
      // Animal tag entered
      setAnimalTagInput((prev) => prev + digit);
    } else if (ivrStep === 4) {
      // Symptom choice
      if (digit === '1') setSymptomChoice('High Fever (>40°C)');
      if (digit === '2') setSymptomChoice('Skin Nodules / Lesions');
      if (digit === '3') setSymptomChoice('Loss of Appetite & Weakness');
      setIvrStep(5);
    }
  };

  const handleConfirmTag = () => {
    setIvrStep(4);
  };

  const handleCompleteIVRReport = async () => {
    setIsProcessing(true);
    try {
      await api.simulateIVRCall({
        callerPhone: '+91 98220 12345',
        animalId: `Cow A${animalTagInput}`,
        selectedSymptoms: ['High Fever', 'Skin Lesions / Nodules', 'Loss of Appetite'],
        recordedTemp: parseFloat(tempInput) || 40.2,
      });

      // Also trigger a real health report for Cow A102
      await api.submitHealthReport({
        animalId: 'anim-102',
        animalTag: `Cow A${animalTagInput || '102'}`,
        animalName: 'Gauri (IVR Voice Intake)',
        farmerName: 'Ramesh Patil',
        farmerPhone: '+91 98220 12345',
        village: 'Baramati Rural',
        district: 'Pune',
        lat: 18.1528,
        lng: 74.5771,
        symptoms: ['High Fever', 'Skin Lesions / Nodules'],
        temperatureC: parseFloat(tempInput) || 40.2,
        activityLevel: 'REDUCED',
        appetite: 'REDUCED',
        milkProduction: 'SHARP_DROP',
        vaccinationStatus: 'PARTIAL',
        recentIllness: 'Reported via 1800 Kisan IVR Phone Helpline',
        imageUrl: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=600&q=80',
      });

      setIvrStep(6);
      onIVRReportSubmitted();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 text-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-700 flex flex-col">
        {/* Phone screen top bar */}
        <div className="bg-slate-800/80 px-4 py-3 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold tracking-wide text-slate-300">
              Kisan IVR Helpline Simulator
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Call Display Screen */}
        <div className="p-5 text-center space-y-3 bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-800">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">
            Toll-Free Livestock Emergency Hotline
          </span>
          <h3 className="text-xl font-mono font-black tracking-widest text-white">
            1800-180-1551
          </h3>

          {callState === 'IDLE' && (
            <p className="text-xs text-slate-400">
              Feature phone voice reporting for farmers in low-connectivity rural zones.
            </p>
          )}

          {callState === 'RINGING' && (
            <p className="text-xs text-amber-400 font-semibold animate-pulse">
              Connecting to Kisan Animal Health Gateway...
            </p>
          )}

          {callState === 'CONNECTED' && (
            <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-700/60 text-left text-xs space-y-1.5 animate-fade-in">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  Voice Intake Active
                </span>
                <span className="font-mono text-[11px]">00:24</span>
              </div>

              {/* Step instructions */}
              {ivrStep === 1 && (
                <p className="text-slate-200">
                  "PashuRaksha mein aapka swagat hai. For English, press 1. Hindi ke liye 2 dabayein. Marathi sathi 3 daba."
                </p>
              )}

              {ivrStep === 2 && (
                <p className="text-slate-200">
                  "Pashu ki bimari darj karne ke liye 1 dabayein. Tikakaran jankari ke liye 2 dabayein."
                </p>
              )}

              {ivrStep === 3 && (
                <div className="space-y-1">
                  <p className="text-slate-200">
                    "Kripya pashu ka Ear Tag number enter karein, fir '#' dabayein."
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={animalTagInput}
                      onChange={(e) => setAnimalTagInput(e.target.value)}
                      placeholder="Tag (e.g. 102)"
                      className="bg-slate-800 text-white font-mono font-bold px-2 py-1 rounded text-xs w-28 border border-slate-600"
                    />
                    <button
                      onClick={handleConfirmTag}
                      className="bg-emerald-600 text-white px-2.5 py-1 rounded text-xs font-bold cursor-pointer"
                    >
                      Enter (#)
                    </button>
                  </div>
                </div>
              )}

              {ivrStep === 4 && (
                <p className="text-slate-200">
                  "Lakshan chunein: Tej bukhar ke liye 1 dabayein. Chamdi par ganth/fodiyan ke liye 2 dabayein."
                </p>
              )}

              {ivrStep === 5 && (
                <div className="space-y-1.5">
                  <p className="text-slate-200">
                    "Thermometer reading (°C) confirm karein: <strong>{tempInput}°C</strong>."
                  </p>
                  <button
                    onClick={handleCompleteIVRReport}
                    disabled={isProcessing}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded-lg text-xs transition cursor-pointer"
                  >
                    {isProcessing ? 'Logging Voice Report...' : 'Confirm Reading (Press 1)'}
                  </button>
                </div>
              )}

              {ivrStep === 6 && (
                <div className="text-emerald-300 font-medium space-y-1">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <p>
                    "Aapki report safaltapoorvak darj ho chuki hai. Case number SMS dwara bhej diya gaya hai aur Dr. Sunita Kulkarni ko alert dispatch kiya gaya hai."
                  </p>
                </div>
              )}
            </div>
          )}

          {callState === 'ENDED' && (
            <p className="text-xs text-rose-400 font-semibold">Call Disconnected.</p>
          )}
        </div>

        {/* Dialpad buttons */}
        <div className="p-4 bg-slate-950 space-y-4">
          <div className="grid grid-cols-3 gap-2.5 max-w-[220px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => (
              <button
                key={k}
                onClick={() => handlePressKeypad(k)}
                disabled={callState !== 'CONNECTED'}
                className={`w-14 h-12 rounded-2xl font-mono text-base font-bold flex flex-col items-center justify-center transition cursor-pointer ${
                  callState === 'CONNECTED'
                    ? 'bg-slate-800 hover:bg-slate-700 text-white active:scale-95 border border-slate-700'
                    : 'bg-slate-900 text-slate-600 border border-slate-800'
                }`}
              >
                <span>{k}</span>
              </button>
            ))}
          </div>

          {/* Call / Hangup bottom buttons */}
          <div className="flex items-center justify-center gap-4 pt-2">
            {callState === 'IDLE' ? (
              <button
                onClick={handleStartCall}
                className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg transition active:scale-95 cursor-pointer"
                title="Dial Kisan Helpline"
              >
                <PhoneCall className="w-6 h-6" />
              </button>
            ) : (
              <button
                onClick={handleEndCall}
                className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg transition active:scale-95 cursor-pointer"
                title="End Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
