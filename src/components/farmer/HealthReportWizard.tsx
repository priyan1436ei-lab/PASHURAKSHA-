import React, { useState } from 'react';
import {
  X,
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Thermometer,
  Activity,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Info,
  Sparkles,
  Stethoscope,
  Clock,
  WifiOff,
} from 'lucide-react';
import {
  Animal,
  ActivityLevel,
  AppetiteLevel,
  MilkDropLevel,
  VaccinationStatus,
  HealthReport,
  VetCase,
  SupportedLanguage,
} from '../../types';
import { getTranslation } from '../../i18n/translations';
import { calculateLivestockRisk, HealthAnalysisOutput } from '../../services/aiRiskEngine';
import { api } from '../../services/api';
import { OfflineSyncManager } from '../../services/offlineSync';

interface HealthReportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  animals: Animal[];
  preselectedAnimal?: Animal;
  currentLang: SupportedLanguage;
  onReportSubmitted: (report: HealthReport, vetCase: VetCase | null, isOffline: boolean) => void;
}

// Sample presets for photo demonstrations
const DEMO_PRESET_IMAGES = [
  {
    label: 'Cow A102 – Skin Nodules / Lesions (LSD Suspected)',
    url: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=600&q=80',
    quality: 'GOOD',
    blurScore: 85,
    brightness: 120,
    fileSize: 180000,
  },
  {
    label: 'Healthy Normal Cattle Coat',
    url: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=600&q=80',
    quality: 'GOOD',
    blurScore: 90,
    brightness: 135,
    fileSize: 220000,
  },
  {
    label: 'Poor Quality / Dark Blurry Photo (Quality Test)',
    url: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=100&q=20',
    quality: 'POOR',
    blurScore: 12,
    brightness: 25,
    fileSize: 8000, // < 15KB -> triggers quality failure!
  },
];

export const HealthReportWizard: React.FC<HealthReportWizardProps> = ({
  isOpen,
  onClose,
  animals,
  preselectedAnimal,
  currentLang,
  onReportSubmitted,
}) => {
  const t = getTranslation(currentLang);

  const [step, setStep] = useState<number>(1);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>(
    preselectedAnimal ? preselectedAnimal.id : animals[0]?.id || ''
  );

  // Step 2: Image
  const [imageUrl, setImageUrl] = useState<string>(
    preselectedAnimal?.photoUrl || DEMO_PRESET_IMAGES[0].url
  );
  const [imageMeta, setImageMeta] = useState<any>({
    blurScore: 85,
    brightness: 120,
    fileSize: 180000,
  });
  const [imageQualityError, setImageQualityError] = useState<string | null>(null);

  // Step 3: Symptoms checklist
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([
    'High Fever',
    'Skin Lesions / Nodules',
    'Loss of Appetite',
  ]);
  const [customSymptom, setCustomSymptom] = useState<string>('');

  // Step 4: Health information / vitals
  const [temperatureC, setTemperatureC] = useState<number>(40.2);
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('REDUCED');
  const [appetite, setAppetite] = useState<AppetiteLevel>('REDUCED');
  const [milkProduction, setMilkProduction] = useState<MilkDropLevel>('SHARP_DROP');
  const [vaccinationStatus, setVaccinationStatus] = useState<VaccinationStatus>('PARTIAL');
  const [recentIllness, setRecentIllness] = useState<string>('Overdue for LSD annual booster');
  const [environmentalConditions, setEnvironmentalConditions] = useState<string>(
    'Warm humid monsoon season with high biting fly vector density'
  );

  // Step 5: Location
  const [village, setVillage] = useState<string>('Baramati Rural');
  const [district, setDistrict] = useState<string>('Pune');
  const [lat, setLat] = useState<number>(18.1528);
  const [lng, setLng] = useState<number>(74.5771);
  const [gpsStatus, setGpsStatus] = useState<string>('GPS Lock: Precise (± 4m)');

  // Step 6: Screening result
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [screeningOutput, setScreeningOutput] = useState<HealthAnalysisOutput | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);
  const [submittedReport, setSubmittedReport] = useState<HealthReport | null>(null);
  const [escalatedCase, setEscalatedCase] = useState<VetCase | null>(null);
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentAnimal = animals.find((a) => a.id === selectedAnimalId) || animals[0];

  const symptomOptions = [
    { id: 'fever', label: t.symptoms.fever },
    { id: 'cough', label: t.symptoms.cough },
    { id: 'nasalDischarge', label: t.symptoms.nasalDischarge },
    { id: 'skinLesions', label: t.symptoms.skinLesions },
    { id: 'swelling', label: t.symptoms.swelling },
    { id: 'lossOfAppetite', label: t.symptoms.lossOfAppetite },
    { id: 'reducedMilk', label: t.symptoms.reducedMilk },
    { id: 'difficultyWalking', label: t.symptoms.difficultyWalking },
    { id: 'weakness', label: t.symptoms.weakness },
    { id: 'mouthBlisters', label: t.symptoms.mouthBlisters },
    { id: 'salivation', label: t.symptoms.salivation },
    { id: 'eyeDischarge', label: t.symptoms.eyeDischarge },
    { id: 'diarrhea', label: t.symptoms.diarrhea },
    { id: 'rapidBreathing', label: t.symptoms.rapidBreathing },
  ];

  const handleToggleSymptom = (label: string) => {
    if (selectedSymptoms.includes(label)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== label));
    } else {
      setSelectedSymptoms([...selectedSymptoms, label]);
    }
  };

  const handleAddCustomSymptom = () => {
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
      setSelectedSymptoms([...selectedSymptoms, customSymptom.trim()]);
      setCustomSymptom('');
    }
  };

  // Image Quality Verification
  const verifyImageQuality = (fileSize?: number, blurScore?: number, brightness?: number) => {
    if (fileSize && fileSize < 15000) {
      setImageQualityError('Image quality is insufficient. Please capture a clearer image in daylight.');
      return false;
    }
    if (blurScore !== undefined && blurScore < 20) {
      setImageQualityError('Image quality is insufficient due to blur. Please steady your camera.');
      return false;
    }
    if (brightness !== undefined && (brightness < 30 || brightness > 250)) {
      setImageQualityError('Image quality is insufficient due to poor lighting. Please photograph animal in daylight.');
      return false;
    }
    setImageQualityError(null);
    return true;
  };

  const handleImagePresetSelect = (preset: typeof DEMO_PRESET_IMAGES[0]) => {
    setImageUrl(preset.url);
    setImageMeta({
      fileSize: preset.fileSize,
      blurScore: preset.blurScore,
      brightness: preset.brightness,
    });
    verifyImageQuality(preset.fileSize, preset.blurScore, preset.brightness);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size
    const isQualityOk = verifyImageQuality(file.size, 75, 120);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageUrl(event.target?.result as string);
      setImageMeta({ fileSize: file.size, blurScore: isQualityOk ? 75 : 15, brightness: 120 });
    };
    reader.readAsDataURL(file);
  };

  // Run AI analysis preview on entering Step 6
  const handleProceedToScreening = () => {
    const output = calculateLivestockRisk({
      animal_id: currentAnimal?.id || 'anim-102',
      image: imageUrl,
      image_file_meta: imageMeta,
      symptoms: selectedSymptoms,
      temperature: tempUnit === 'F' ? Number((((temperatureC - 32) * 5) / 9).toFixed(1)) : temperatureC,
      activity: activityLevel,
      appetite: appetite,
      milk_production: milkProduction,
      vaccination: vaccinationStatus,
      medical_history: recentIllness ? [recentIllness] : [],
      environmental_data: environmentalConditions,
      latitude: lat,
      longitude: lng,
    });

    setScreeningOutput(output);
    setStep(6);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const normalizedTemp = tempUnit === 'F' ? Number((((temperatureC - 32) * 5) / 9).toFixed(1)) : temperatureC;
      const isOfflineMode = !OfflineSyncManager.isOnline();
      setWasOffline(isOfflineMode);

      const result = await api.submitHealthReport({
        animalId: currentAnimal?.id || 'anim-102',
        animalTag: currentAnimal?.tagNumber || 'Cow A102',
        animalName: currentAnimal?.name || 'Gauri',
        farmerId: currentAnimal?.farmerId || 'farmer-1',
        farmerName: currentAnimal?.farmerName || 'Ramesh Patil',
        farmerPhone: currentAnimal?.farmerPhone || '+91 98220 12345',
        village: village || currentAnimal?.village || 'Baramati Rural',
        district: district || currentAnimal?.district || 'Pune',
        lat,
        lng,
        symptoms: selectedSymptoms,
        temperatureC: normalizedTemp,
        activityLevel,
        appetite,
        milkProduction,
        vaccinationStatus,
        recentIllness,
        environmentalConditions,
        imageUrl,
        imageFileMeta: imageMeta,
      });

      setSubmittedReport(result.report);
      setEscalatedCase(result.vetCase);
      setSubmissionSuccess(true);
      onReportSubmitted(result.report, result.vetCase, result.isOffline);
    } catch (err) {
      console.error('Submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-emerald-800 text-white p-4 sm:p-5 flex items-center justify-between border-b border-emerald-700">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-600 text-emerald-100 text-[11px] font-bold px-2 py-0.5 rounded">
                STEP {step} OF 6
              </span>
              <h2 className="text-lg sm:text-xl font-bold">
                {step === 1 && t.steps.step1}
                {step === 2 && t.steps.step2}
                {step === 3 && t.steps.step3}
                {step === 4 && t.steps.step4}
                {step === 5 && t.steps.step5}
                {step === 6 && t.steps.step6}
              </h2>
            </div>
            <p className="text-xs text-emerald-200 mt-0.5">
              Multimodal livestock disease screening & triage system
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-emerald-700 text-emerald-200 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-slate-100 w-full flex">
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <div
              key={num}
              className={`flex-1 transition-all duration-300 ${
                step >= num ? 'bg-emerald-600' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Step Content Container */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-slate-800">
          {/* STEP 1: Select Animal */}
          {step === 1 && (
            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Choose Livestock from Your Herd
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {animals.map((anim) => (
                  <div
                    key={anim.id}
                    onClick={() => {
                      setSelectedAnimalId(anim.id);
                      if (anim.village) setVillage(anim.village);
                      if (anim.lat) setLat(anim.lat);
                      if (anim.lng) setLng(anim.lng);
                    }}
                    className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-center gap-3.5 ${
                      selectedAnimalId === anim.id
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <img
                      src={anim.photoUrl}
                      alt={anim.tagNumber}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{anim.tagNumber}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                          {anim.species}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 truncate">{anim.name} • {anim.breed}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span>{anim.village}</span>
                        <span>•</span>
                        <span
                          className={`font-semibold ${
                            anim.vaccinationStatus === 'COMPLETE'
                              ? 'text-emerald-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {anim.vaccinationStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Photo Upload & Image Quality Check */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Upload or Photograph Animal</h3>
                <p className="text-xs text-slate-500">
                  Visual analysis checks for nodular skin lesions, erosions, mucosal discharge, or udder swelling.
                </p>
              </div>

              {/* Quality error alert if detected */}
              {imageQualityError && (
                <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 flex items-start gap-3 text-rose-800 animate-shake">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900">
                      Image Quality Check Failed
                    </h4>
                    <p className="text-xs mt-1 font-medium">{imageQualityError}</p>
                    <p className="text-[11px] text-rose-600 mt-1">
                      Requirement: File size &gt; 15 KB, sufficient daytime lighting, and steady camera.
                    </p>
                  </div>
                </div>
              )}

              {/* Preview Box */}
              <div className="relative rounded-2xl border-2 border-dashed border-slate-300 p-4 flex flex-col items-center justify-center bg-slate-50 overflow-hidden min-h-[200px]">
                {imageUrl ? (
                  <div className="relative w-full flex flex-col items-center">
                    <img
                      src={imageUrl}
                      alt="Uploaded livestock preview"
                      className="max-h-56 rounded-xl object-contain shadow-xs border border-slate-200"
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                          imageQualityError
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {imageQualityError ? (
                          <AlertCircle className="w-3.5 h-3.5" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        {imageQualityError ? 'POOR QUALITY (RETAKE NEEDED)' : 'IMAGE QUALITY: GOOD'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6">
                    <Camera className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                    <p className="text-xs text-slate-600 font-medium">Click to capture or choose file</p>
                  </div>
                )}
              </div>

              {/* File upload input */}
              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold py-2.5 px-4 rounded-xl border border-emerald-300 transition cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Choose Photo from Device</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Demo sample photos presets for easy hackathon demonstration */}
              <div>
                <span className="text-xs font-bold text-slate-600 block mb-2">
                  Demo Presets for Testing Quality Check:
                </span>
                <div className="space-y-2">
                  {DEMO_PRESET_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleImagePresetSelect(preset)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition cursor-pointer ${
                        imageUrl === preset.url
                          ? 'border-emerald-600 bg-emerald-50/60 font-semibold text-emerald-900'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="truncate pr-2">{preset.label}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                          preset.quality === 'POOR'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {preset.quality}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Symptoms Checklist */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Select Observed Symptoms</h3>
                <p className="text-xs text-slate-500">
                  Tick all symptoms noticed by farmer or dairy worker in the past 24–48 hours.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                {symptomOptions.map((sym) => {
                  const isChecked = selectedSymptoms.includes(sym.label);
                  return (
                    <div
                      key={sym.id}
                      onClick={() => handleToggleSymptom(sym.label)}
                      className={`p-3 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                        isChecked
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <span className="text-xs">{sym.label}</span>
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border ${
                          isChecked
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Other symptom entry */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <input
                  type="text"
                  placeholder="Add other symptom (e.g. Grunting, Drooping ears)..."
                  value={customSymptom}
                  onChange={(e) => setCustomSymptom(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomSymptom();
                    }
                  }}
                  className="flex-1 text-xs border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSymptom}
                  className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Health Information & Farm Context */}
          {step === 4 && (
            <div className="space-y-4">
              {/* Temperature slider & number */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-rose-500" />
                    Rectal Body Temperature
                  </span>
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setTempUnit('C')}
                      className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                        tempUnit === 'C' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      °C
                    </button>
                    <button
                      type="button"
                      onClick={() => setTempUnit('F')}
                      className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                        tempUnit === 'F' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      °F
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={tempUnit === 'C' ? 36.5 : 97.7}
                    max={tempUnit === 'C' ? 42.5 : 108.5}
                    step={0.1}
                    value={temperatureC}
                    onChange={(e) => setTemperatureC(parseFloat(e.target.value))}
                    className="flex-1 accent-emerald-600 cursor-pointer"
                  />
                  <span
                    className={`text-lg font-black px-3 py-1 rounded-xl border ${
                      temperatureC >= (tempUnit === 'C' ? 40.0 : 104.0)
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : temperatureC >= (tempUnit === 'C' ? 39.5 : 103.1)
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    {temperatureC} {tempUnit === 'C' ? '°C' : '°F'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Normal bovine baseline: 38.0°C – 39.2°C (100.4°F – 102.5°F). Fever threshold: &gt;39.5°C.
                </p>
              </div>

              {/* Activity level */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-500" />
                  Activity & Alertness Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['NORMAL', 'REDUCED', 'LETHARGIC'] as ActivityLevel[]).map((act) => (
                    <button
                      key={act}
                      type="button"
                      onClick={() => setActivityLevel(act)}
                      className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        activityLevel === act
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {act}
                    </button>
                  ))}
                </div>
              </div>

              {/* Appetite & Milk Production */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Appetite & Cud Chewing
                  </label>
                  <select
                    value={appetite}
                    onChange={(e) => setAppetite(e.target.value as AppetiteLevel)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="NORMAL">Normal eating & rumination</option>
                    <option value="REDUCED">Reduced feed consumption</option>
                    <option value="ANOREXIA">Complete anorexia (Off-feed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Milk Yield Impact
                  </label>
                  <select
                    value={milkProduction}
                    onChange={(e) => setMilkProduction(e.target.value as MilkDropLevel)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="NORMAL">Normal lactation yield</option>
                    <option value="SLIGHT_DROP">Slight decline (&lt; 20%)</option>
                    <option value="SHARP_DROP">Sharp drop (&gt; 50% decrease)</option>
                    <option value="NA">Not in lactation / Male</option>
                  </select>
                </div>
              </div>

              {/* Vaccination & Environmental conditions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Herd Vaccination Status
                  </label>
                  <select
                    value={vaccinationStatus}
                    onChange={(e) => setVaccinationStatus(e.target.value as VaccinationStatus)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="COMPLETE">Fully vaccinated (Up-to-date)</option>
                    <option value="PARTIAL">Partially vaccinated / Boosters overdue</option>
                    <option value="UNVACCINATED">Unvaccinated / Unknown history</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Environmental Conditions
                  </label>
                  <input
                    type="text"
                    value={environmentalConditions}
                    onChange={(e) => setEnvironmentalConditions(e.target.value)}
                    placeholder="e.g. Humid monsoon, stagnant water, flies..."
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Location / GPS */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Farm Location & Geotagging</h3>
                <p className="text-xs text-slate-500">
                  Critical for localized cluster analysis and community outbreak early warnings.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Village / Gaon</label>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Taluka & District</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-950 block">
                      Geographic GPS Coordinates
                    </span>
                    <span className="text-xs text-emerald-800 font-mono">
                      Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}
                    </span>
                    <p className="text-[11px] text-emerald-700 mt-0.5">{gpsStatus}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setGpsStatus('GPS Locked: Updated');
                  }}
                  className="text-xs font-bold bg-white text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-300 hover:bg-emerald-100 transition cursor-pointer"
                >
                  Refresh GPS
                </button>
              </div>

              {/* Simulated offline toggle preview notice */}
              {!OfflineSyncManager.isOnline() && (
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 flex items-center gap-3 text-amber-900 text-xs">
                  <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Offline Mode active.</strong> Your report will be securely saved in local storage and will sync automatically once internet reconnects.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 6: AI Multimodal Screening Result & Submit */}
          {step === 6 && (
            <div className="space-y-4">
              {submissionSuccess ? (
                <div className="text-center py-6 space-y-4 animate-scale-in">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      {wasOffline ? 'Report Saved Offline' : 'Health Screening Report Submitted'}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                      {wasOffline
                        ? 'Report saved offline. It will automatically sync when internet is available.'
                        : 'Your report has been logged with the Maharashtra Animal Husbandry Department.'}
                    </p>
                  </div>

                  {/* Escalation details if High risk */}
                  {escalatedCase && (
                    <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 text-left max-w-lg mx-auto">
                      <div className="flex items-center gap-2 text-rose-800 font-bold text-xs mb-1">
                        <Stethoscope className="w-4 h-4" />
                        <span>AUTOMATIC VETERINARY DISPATCH CREATED</span>
                      </div>
                      <p className="text-xs text-slate-700">
                        Case ID: <strong className="font-mono">{escalatedCase.caseNumber}</strong> assigned to{' '}
                        <strong>{escalatedCase.assignedVetName || 'Taluka Veterinary Officer'}</strong>.
                      </p>
                      <p className="text-[11px] text-rose-700 mt-1">
                        Field veterinarian notified for clinical examination and ring vaccination.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={onClose}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Done & Return to Dashboard
                  </button>
                </div>
              ) : (
                screeningOutput && (
                  <div className="space-y-4 animate-fade-in">
                    {/* Risk Score Card */}
                    <div
                      className={`p-5 rounded-2xl border-2 flex flex-col sm:flex-row items-center justify-between gap-4 ${
                        screeningOutput.risk_level === 'HIGH'
                          ? 'bg-rose-50 border-rose-400'
                          : screeningOutput.risk_level === 'MEDIUM'
                          ? 'bg-amber-50 border-amber-400'
                          : 'bg-emerald-50 border-emerald-400'
                      }`}
                    >
                      <div>
                        <span
                          className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block mb-1.5 ${
                            screeningOutput.risk_level === 'HIGH'
                              ? 'bg-rose-600 text-white'
                              : screeningOutput.risk_level === 'MEDIUM'
                              ? 'bg-amber-500 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          Risk Level: {screeningOutput.risk_level}
                        </span>
                        <h4 className="text-xl sm:text-2xl font-black text-slate-900">
                          Disease Risk Score: {screeningOutput.risk_score}/100
                        </h4>
                        <p className="text-xs text-slate-700 font-medium mt-1 leading-relaxed">
                          {screeningOutput.screening_result}
                        </p>
                      </div>

                      {/* Visual gauge representation */}
                      <div className="w-24 h-24 rounded-full border-8 border-white shadow-md flex items-center justify-center bg-white shrink-0">
                        <div className="text-center">
                          <span
                            className={`text-2xl font-black ${
                              screeningOutput.risk_level === 'HIGH'
                                ? 'text-rose-600'
                                : screeningOutput.risk_level === 'MEDIUM'
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {screeningOutput.risk_score}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-bold">/100</span>
                        </div>
                      </div>
                    </div>

                    {/* Prominent Disclaimer */}
                    <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-start gap-2.5 text-amber-900 text-xs">
                      <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-amber-950 font-bold">
                          AI Screening – Not a confirmed diagnosis.
                        </strong>
                        <span>
                          Predictions represent assistive risk estimation based on multimodal vitals.
                          {screeningOutput.vet_required &&
                            ' Veterinary verification is strongly recommended.'}
                        </span>
                      </div>
                    </div>

                    {/* Suspected Conditions breakdown */}
                    <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-2">
                      <span className="text-xs font-bold text-slate-700 block">
                        Differential Screening Indications:
                      </span>
                      <div className="space-y-2">
                        {screeningOutput.possible_conditions.map((cond, idx) => (
                          <div
                            key={idx}
                            className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs"
                          >
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-bold text-slate-900">{cond.name}</span>
                              <span className="font-mono font-bold text-emerald-700">
                                {Math.round(cond.confidence * 100)}% Confidence
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600">{cond.reasoning}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommended Actions */}
                    <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-2">
                      <span className="text-xs font-bold text-slate-700 block">
                        Immediate Recommended Actions:
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {screeningOutput.recommended_actions.map((act, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Automatic escalation note */}
                    {screeningOutput.vet_required && (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>
                          🚨 <strong>High Risk:</strong> Submitting will automatically escalate this case to the taluka veterinary medical dispensary for clinical review.
                        </span>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        {!submissionSuccess && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              {step < 5 && (
                <button
                  type="button"
                  disabled={step === 2 && !!imageQualityError}
                  onClick={() => setStep(step + 1)}
                  className={`flex items-center gap-1 text-xs font-bold text-white px-5 py-2.5 rounded-xl transition shadow-xs cursor-pointer ${
                    step === 2 && !!imageQualityError
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {step === 5 && (
                <button
                  type="button"
                  onClick={handleProceedToScreening}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Run AI Multimodal Risk Analysis</span>
                </button>
              )}

              {step === 6 && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalSubmit}
                  className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Transmitting Report...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Transmit Report</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
