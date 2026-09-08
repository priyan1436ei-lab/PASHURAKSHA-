import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Animal, VaccinationStatus } from '../../types';

interface AnimalRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnimalRegistered: (animal: Animal) => void;
}

export const AnimalRegistrationModal: React.FC<AnimalRegistrationModalProps> = ({
  isOpen,
  onClose,
  onAnimalRegistered,
}) => {
  const [tagNumber, setTagNumber] = useState<string>(
    `Cow A${Math.floor(120 + Math.random() * 800)}`
  );
  const [name, setName] = useState<string>('');
  const [species, setSpecies] = useState<'Cow' | 'Buffalo' | 'Goat' | 'Sheep'>('Cow');
  const [breed, setBreed] = useState<string>('Gir Cross');
  const [ageMonths, setAgeMonths] = useState<number>(36);
  const [gender, setGender] = useState<'Female' | 'Male'>('Female');
  const [weightKg, setWeightKg] = useState<number>(360);
  const [vaccinationStatus, setVaccinationStatus] = useState<VaccinationStatus>('COMPLETE');
  const [previousDiseases, setPreviousDiseases] = useState<string>('None');
  const [village, setVillage] = useState<string>('Baramati Rural');
  const [district, setDistrict] = useState<string>('Pune');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newAnimal: Animal = {
      id: `anim-${Date.now()}`,
      tagNumber: tagNumber.trim(),
      name: name.trim() || `${species} ${tagNumber}`,
      species,
      breed,
      ageMonths: Number(ageMonths),
      gender,
      weightKg: Number(weightKg),
      vaccinationStatus,
      vaccinations: [
        {
          vaccineName: 'FMD Oil Adjuvant Vaccine',
          dateAdministered: new Date().toISOString().split('T')[0],
          nextDueDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
        },
      ],
      previousDiseases: previousDiseases && previousDiseases !== 'None' ? [previousDiseases] : [],
      village,
      district,
      state: 'Maharashtra',
      lat: 18.1528 + (Math.random() - 0.5) * 0.02,
      lng: 74.5771 + (Math.random() - 0.5) * 0.02,
      farmerId: 'farmer-1',
      farmerName: 'Ramesh Patil',
      farmerPhone: '+91 98220 12345',
      photoUrl:
        species === 'Cow'
          ? 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=600&q=80'
          : species === 'Buffalo'
          ? 'https://images.unsplash.com/photo-1596733430284-f7437764b1a9?auto=format&fit=crop&w=600&q=80'
          : 'https://images.unsplash.com/photo-1524024973431-2ad916746881?auto=format&fit=crop&w=600&q=80',
      registeredAt: new Date().toISOString(),
    };

    setTimeout(() => {
      setIsSubmitting(false);
      onAnimalRegistered(newAnimal);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-emerald-800 text-white p-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Register New Livestock</h2>
            <p className="text-xs text-emerald-200">National Livestock Identification & Tracking</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-emerald-700 text-emerald-200 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-700">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-900 mb-1">Ear Tag Number / ID</label>
              <input
                type="text"
                required
                value={tagNumber}
                onChange={(e) => setTagNumber(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-emerald-900 bg-slate-50"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-900 mb-1">Animal Name / Alias</label>
              <input
                type="text"
                placeholder="e.g. Gauri"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-900 mb-1">Species</label>
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value as any)}
                className="w-full border border-slate-300 rounded-xl p-2.5 bg-white"
              >
                <option value="Cow">Cattle / Cow</option>
                <option value="Buffalo">Buffalo</option>
                <option value="Goat">Goat</option>
                <option value="Sheep">Sheep</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-900 mb-1">Breed</label>
              <input
                type="text"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-900 mb-1">Age (Months)</label>
              <input
                type="number"
                value={ageMonths}
                onChange={(e) => setAgeMonths(parseInt(e.target.value) || 12)}
                className="w-full border border-slate-300 rounded-xl p-2.5"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-900 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full border border-slate-300 rounded-xl p-2.5 bg-white"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-900 mb-1">Weight (Kg)</label>
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(parseInt(e.target.value) || 200)}
                className="w-full border border-slate-300 rounded-xl p-2.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-900 mb-1">Vaccination Status</label>
              <select
                value={vaccinationStatus}
                onChange={(e) => setVaccinationStatus(e.target.value as VaccinationStatus)}
                className="w-full border border-slate-300 rounded-xl p-2.5 bg-white"
              >
                <option value="COMPLETE">Complete (Up to date)</option>
                <option value="PARTIAL">Partial (Boosters due)</option>
                <option value="UNVACCINATED">Unvaccinated</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-900 mb-1">Previous Diseases</label>
              <input
                type="text"
                placeholder="e.g. Mastitis, None"
                value={previousDiseases}
                onChange={(e) => setPreviousDiseases(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-900 mb-1">Village / Gaon</label>
              <input
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-900 mb-1">District</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Register & Generate Health Passport</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
