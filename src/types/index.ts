export type UserRole = 'FARMER' | 'VETERINARIAN' | 'ADMIN';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type ActivityLevel = 'NORMAL' | 'REDUCED' | 'LETHARGIC';
export type AppetiteLevel = 'NORMAL' | 'REDUCED' | 'ANOREXIA';
export type MilkDropLevel = 'NORMAL' | 'SLIGHT_DROP' | 'SHARP_DROP' | 'NA';
export type VaccinationStatus = 'COMPLETE' | 'PARTIAL' | 'UNVACCINATED';

export type VetCaseStatus = 
  | 'NEW'
  | 'VET_ACCEPTED'
  | 'ACCEPTED'
  | 'LAB_REQUESTED'
  | 'TREATMENT'
  | 'FOLLOW_UP'
  | 'RESOLVED'
  | 'CLOSED';

export type CaseStatus = VetCaseStatus;

export type LabStatus = 
  | 'LAB_REQUESTED'
  | 'SAMPLE_COLLECTED'
  | 'UNDER_TEST'
  | 'RESULT_AVAILABLE';

export interface Animal {
  id: string;
  tagNumber: string;
  name: string;
  species: 'Cow' | 'Buffalo' | 'Goat' | 'Sheep';
  breed: string;
  ageMonths: number;
  gender: 'Female' | 'Male';
  weightKg: number;
  vaccinationStatus: VaccinationStatus;
  vaccinations: Array<{
    vaccineName: string;
    dateAdministered: string;
    nextDueDate: string;
  }>;
  previousDiseases: string[];
  village: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  photoUrl: string;
  registeredAt: string;
}

export interface PossibleCondition {
  name: string;
  confidence: number;
  reasoning: string;
  icdCode?: string;
  contagious: boolean;
}

export interface HealthReport {
  id: string;
  animalId: string;
  animalTag: string;
  animalName: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  village: string;
  district: string;
  lat: number;
  lng: number;
  symptoms: string[];
  temperatureC: number;
  activityLevel: ActivityLevel;
  appetite: AppetiteLevel;
  milkProduction: MilkDropLevel;
  vaccinationStatus: VaccinationStatus;
  recentIllness: string;
  environmentalConditions: string;
  imageUrl?: string;
  imageQuality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  imageFindings: string[];
  riskScore: number;
  riskLevel: RiskLevel;
  screeningResult: string;
  possibleConditions: PossibleCondition[];
  recommendedActions: string[];
  vetRequired: boolean;
  vetCaseId?: string;
  isOfflineSubmission?: boolean;
  syncedAt?: string;
  createdAt: string;
}

export interface LabReferral {
  id: string;
  caseId: string;
  animalTag: string;
  suspectedCondition: string;
  sampleType: 'Blood' | 'Skin Scraping' | 'Nasal Swab' | 'Milk' | 'Fecal';
  priority: 'ROUTINE' | 'PRIORITY' | 'EMERGENCY';
  notes: string;
  status: LabStatus;
  labName: string;
  requestedAt: string;
  sampleCollectedAt?: string;
  testConductedAt?: string;
  resultAvailableAt?: string;
  resultSummary?: string;
}

export interface TreatmentPrescription {
  medicineName: string;
  dosage: string;
  duration: string;
  instructions: string;
}

export interface TreatmentPlan {
  id: string;
  caseId: string;
  veterinarianName: string;
  veterinaryAssessment: string;
  medicines: TreatmentPrescription[];
  advice: string;
  quarantineRecommended: boolean;
  followUpDate: string;
  prescribedAt: string;
}

export interface VetCase {
  id: string;
  caseNumber: string;
  reportId: string;
  animalId: string;
  animalTag: string;
  animalName: string;
  species: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  village: string;
  district: string;
  lat: number;
  lng: number;
  symptoms: string[];
  temperatureC: number;
  imageUrl?: string;
  riskScore: number;
  riskLevel: RiskLevel;
  possibleConditions: PossibleCondition[];
  status: VetCaseStatus;
  urgency: 'ROUTINE' | 'URGENT' | 'CRITICAL';
  assignedVetId?: string;
  assignedVetName?: string;
  assignedDispensary?: string;
  vetAssessment?: string;
  labReferral?: LabReferral;
  treatmentPlan?: TreatmentPlan;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OutbreakCluster {
  id: string;
  clusterName: string;
  village: string;
  district: string;
  lat: number;
  lng: number;
  caseCount: number;
  dominantSymptoms: string[];
  suspectedCondition: string;
  riskLevel: RiskLevel;
  radiusKm: number;
  firstDetectedDate: string;
  lastDetectedDate: string;
  affectedAnimalTags: string[];
  status: 'ACTIVE_HOTSPOT' | 'MONITORING' | 'CONTAINED';
  advisorySent: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 
    | 'HIGH_RISK_ALERT'
    | 'OUTBREAK_HOTSPOT'
    | 'VET_ESCALATION'
    | 'LAB_UPDATE'
    | 'TREATMENT_UPDATE'
    | 'VACCINATION_REMINDER'
    | 'OFFLINE_SYNC';
  targetRole: 'FARMER' | 'VETERINARIAN' | 'ADMIN' | 'ALL';
  recipientId?: string;
  village?: string;
  isRead: boolean;
  createdAt: string;
  caseId?: string;
}

export type SupportedLanguage = 'en' | 'hi' | 'mr';
