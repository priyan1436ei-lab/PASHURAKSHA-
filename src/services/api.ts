import {
  Animal,
  HealthReport,
  VetCase,
  LabReferral,
  TreatmentPlan,
  OutbreakCluster,
  NotificationItem,
} from '../types';
import { calculateLivestockRisk, HealthAnalysisInput, HealthAnalysisOutput } from './aiRiskEngine';
import { OfflineSyncManager } from './offlineSync';
import {
  INITIAL_ANIMALS,
  INITIAL_HEALTH_REPORTS,
  INITIAL_VET_CASES,
  INITIAL_OUTBREAK_CLUSTERS,
  INITIAL_NOTIFICATIONS,
} from '../data/mockData';

// In-memory fallback if server is unreachable
let localAnimals: Animal[] = [...INITIAL_ANIMALS];
let localReports: HealthReport[] = [...INITIAL_HEALTH_REPORTS];
let localVetCases: VetCase[] = [...INITIAL_VET_CASES];
let localClusters: OutbreakCluster[] = [...INITIAL_OUTBREAK_CLUSTERS];
let localNotifications: NotificationItem[] = [...INITIAL_NOTIFICATIONS];

export const api = {
  // Animals
  async getAnimals(): Promise<Animal[]> {
    if (!OfflineSyncManager.isOnline()) {
      return localAnimals;
    }
    try {
      const res = await fetch('/api/animals');
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      localAnimals = data;
      return data;
    } catch {
      return localAnimals;
    }
  },

  async getAnimalById(id: string): Promise<Animal | undefined> {
    const animals = await this.getAnimals();
    return animals.find(a => a.id === id || a.tagNumber === id);
  },

  async registerAnimal(animalData: Partial<Animal>): Promise<Animal> {
    if (!OfflineSyncManager.isOnline()) {
      const newAnimal: Animal = {
        id: `anim-${Date.now()}`,
        tagNumber: animalData.tagNumber || `Cow A${Math.floor(100 + Math.random() * 900)}`,
        name: animalData.name || 'Livestock',
        species: animalData.species || 'Cow',
        breed: animalData.breed || 'Gir Cross',
        ageMonths: animalData.ageMonths || 36,
        gender: animalData.gender || 'Female',
        weightKg: animalData.weightKg || 350,
        vaccinationStatus: animalData.vaccinationStatus || 'COMPLETE',
        vaccinations: animalData.vaccinations || [],
        previousDiseases: animalData.previousDiseases || [],
        village: animalData.village || 'Baramati Rural',
        district: animalData.district || 'Pune',
        state: animalData.state || 'Maharashtra',
        lat: animalData.lat || 18.1528,
        lng: animalData.lng || 74.5771,
        farmerId: animalData.farmerId || 'farmer-1',
        farmerName: animalData.farmerName || 'Ramesh Patil',
        farmerPhone: animalData.farmerPhone || '+91 98220 12345',
        photoUrl: animalData.photoUrl || 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=600&q=80',
        registeredAt: new Date().toISOString(),
      };
      localAnimals.unshift(newAnimal);
      return newAnimal;
    }

    try {
      const res = await fetch('/api/animals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(animalData),
      });
      if (!res.ok) throw new Error('Failed to register');
      const saved = await res.json();
      localAnimals.unshift(saved);
      return saved;
    } catch {
      // Fallback local
      return this.registerAnimal(animalData);
    }
  },

  // AI Multimodal Risk Analysis
  async analyzeHealthRisk(input: HealthAnalysisInput): Promise<HealthAnalysisOutput> {
    try {
      if (OfflineSyncManager.isOnline()) {
        const res = await fetch('/api/health/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        if (res.ok) {
          return await res.json();
        }
      }
    } catch {
      // Fall through to client engine
    }
    // Transparent client-side AI risk engine (always operational even offline!)
    return calculateLivestockRisk(input);
  },

  // Health Reports
  async getHealthReports(): Promise<HealthReport[]> {
    if (!OfflineSyncManager.isOnline()) {
      return localReports;
    }
    try {
      const res = await fetch('/api/health/reports');
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      localReports = data;
      return data;
    } catch {
      return localReports;
    }
  },

  async submitHealthReport(reportData: any): Promise<{
    report: HealthReport;
    vetCase: VetCase | null;
    isOffline: boolean;
  }> {
    const isOnline = OfflineSyncManager.isOnline();

    if (!isOnline) {
      // Calculate screening locally
      const aiScreening = calculateLivestockRisk({
        animal_id: reportData.animalId,
        image: reportData.imageUrl,
        image_file_meta: reportData.imageFileMeta,
        symptoms: reportData.symptoms || [],
        temperature: Number(reportData.temperatureC) || 38.6,
        activity: reportData.activityLevel || 'NORMAL',
        appetite: reportData.appetite || 'NORMAL',
        milk_production: reportData.milkProduction || 'NORMAL',
        vaccination: reportData.vaccinationStatus || 'COMPLETE',
        medical_history: reportData.recentIllness ? [reportData.recentIllness] : [],
        environmental_data: reportData.environmentalConditions || '',
        latitude: Number(reportData.lat) || 18.1528,
        longitude: Number(reportData.lng) || 74.5771,
      });

      const offlineReport: HealthReport = {
        id: `rep-offline-${Date.now()}`,
        animalId: reportData.animalId,
        animalTag: reportData.animalTag,
        animalName: reportData.animalName,
        farmerId: reportData.farmerId || 'farmer-1',
        farmerName: reportData.farmerName || 'Ramesh Patil',
        farmerPhone: reportData.farmerPhone || '+91 98220 12345',
        village: reportData.village || 'Baramati Rural',
        district: reportData.district || 'Pune',
        lat: Number(reportData.lat) || 18.1528,
        lng: Number(reportData.lng) || 74.5771,
        symptoms: reportData.symptoms || [],
        temperatureC: Number(reportData.temperatureC) || 38.6,
        activityLevel: reportData.activityLevel || 'NORMAL',
        appetite: reportData.appetite || 'NORMAL',
        milkProduction: reportData.milkProduction || 'NORMAL',
        vaccinationStatus: reportData.vaccinationStatus || 'COMPLETE',
        recentIllness: reportData.recentIllness || '',
        environmentalConditions: reportData.environmentalConditions || '',
        imageUrl: reportData.imageUrl,
        imageQuality: aiScreening.image_quality,
        imageFindings: aiScreening.image_findings,
        riskScore: aiScreening.risk_score,
        riskLevel: aiScreening.risk_level,
        screeningResult: aiScreening.screening_result,
        possibleConditions: aiScreening.possible_conditions,
        recommendedActions: aiScreening.recommended_actions,
        vetRequired: aiScreening.vet_required,
        isOfflineSubmission: true,
        createdAt: new Date().toISOString(),
      };

      let offlineCase: VetCase | null = null;
      if (offlineReport.riskLevel === 'HIGH') {
        offlineCase = {
          id: `case-offline-${Date.now()}`,
          caseNumber: `VET-OFFLINE-${Math.floor(100 + Math.random() * 900)}`,
          reportId: offlineReport.id,
          animalId: offlineReport.animalId,
          animalTag: offlineReport.animalTag,
          animalName: offlineReport.animalName,
          species: 'Cow',
          farmerId: offlineReport.farmerId,
          farmerName: offlineReport.farmerName,
          farmerPhone: offlineReport.farmerPhone,
          village: offlineReport.village,
          district: offlineReport.district,
          lat: offlineReport.lat,
          lng: offlineReport.lng,
          symptoms: offlineReport.symptoms,
          temperatureC: offlineReport.temperatureC,
          imageUrl: offlineReport.imageUrl,
          riskScore: offlineReport.riskScore,
          riskLevel: offlineReport.riskLevel,
          possibleConditions: offlineReport.possibleConditions,
          status: 'NEW',
          urgency: 'URGENT',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        offlineReport.vetCaseId = offlineCase.id;
        localVetCases.unshift(offlineCase);
      }

      OfflineSyncManager.savePendingReport(offlineReport);
      localReports.unshift(offlineReport);

      return {
        report: offlineReport,
        vetCase: offlineCase,
        isOffline: true,
      };
    }

    // Online submission
    try {
      const res = await fetch('/api/health/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });
      if (!res.ok) throw new Error('Submission error');
      const data = await res.json();
      localReports.unshift(data.report);
      if (data.vetCase) localVetCases.unshift(data.vetCase);
      return {
        report: data.report,
        vetCase: data.vetCase,
        isOffline: false,
      };
    } catch {
      // Fallback to offline store
      OfflineSyncManager.setSimulatedOffline(true);
      return this.submitHealthReport(reportData);
    }
  },

  // Veterinary Cases
  async getVetCases(): Promise<VetCase[]> {
    if (!OfflineSyncManager.isOnline()) {
      return localVetCases;
    }
    try {
      const res = await fetch('/api/vet/cases');
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      localVetCases = data;
      return data;
    } catch {
      return localVetCases;
    }
  },

  async updateVetCase(id: string, updates: Partial<VetCase>): Promise<VetCase> {
    const idx = localVetCases.findIndex(c => c.id === id);
    if (idx !== -1) {
      localVetCases[idx] = { ...localVetCases[idx], ...updates, updatedAt: new Date().toISOString() };
    }

    if (OfflineSyncManager.isOnline()) {
      try {
        const res = await fetch(`/api/vet/cases/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        if (res.ok) {
          const updated = await res.json();
          localVetCases[idx] = updated;
          return updated;
        }
      } catch (e) {
        console.warn('Could not sync vet case update immediately:', e);
      }
    }
    return localVetCases[idx];
  },

  // Lab Referrals
  async requestLabReferral(referralData: {
    caseId: string;
    animalTag: string;
    suspectedCondition: string;
    sampleType: LabReferral['sampleType'];
    priority: LabReferral['priority'];
    notes: string;
  }): Promise<LabReferral> {
    const caseObj = localVetCases.find(c => c.id === referralData.caseId);
    const labReferral: LabReferral = {
      id: `lab-${Date.now()}`,
      caseId: referralData.caseId,
      animalTag: referralData.animalTag,
      suspectedCondition: referralData.suspectedCondition,
      sampleType: referralData.sampleType,
      priority: referralData.priority,
      notes: referralData.notes,
      status: 'LAB_REQUESTED',
      labName: 'Disease Investigation Section (DIS), Aundh, Pune',
      requestedAt: new Date().toISOString(),
    };

    if (caseObj) {
      caseObj.status = 'LAB_REQUESTED';
      caseObj.labReferral = labReferral;
      caseObj.updatedAt = new Date().toISOString();
    }

    if (OfflineSyncManager.isOnline()) {
      try {
        const res = await fetch('/api/lab/referrals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(referralData),
        });
        if (res.ok) {
          const data = await res.json();
          return data.labReferral;
        }
      } catch {
        // Handled locally
      }
    }

    return labReferral;
  },

  async updateLabStatus(labId: string, status: LabReferral['status'], resultSummary?: string): Promise<void> {
    const c = localVetCases.find(v => v.labReferral?.id === labId);
    if (c && c.labReferral) {
      c.labReferral.status = status;
      if (status === 'SAMPLE_COLLECTED') c.labReferral.sampleCollectedAt = new Date().toISOString();
      if (status === 'UNDER_TEST') c.labReferral.testConductedAt = new Date().toISOString();
      if (status === 'RESULT_AVAILABLE') {
        c.labReferral.resultAvailableAt = new Date().toISOString();
        c.labReferral.resultSummary = resultSummary || 'Simulated Lab Result: Positive for target viral DNA.';
      }
    }

    if (OfflineSyncManager.isOnline()) {
      try {
        await fetch(`/api/lab/referrals/${labId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, resultSummary }),
        });
      } catch {
        // local ok
      }
    }
  },

  // Treatment Plan
  async prescribeTreatment(data: {
    caseId: string;
    veterinaryAssessment: string;
    medicines: TreatmentPlan['medicines'];
    advice: string;
    quarantineRecommended: boolean;
    followUpDate: string;
  }): Promise<TreatmentPlan> {
    const caseObj = localVetCases.find(c => c.id === data.caseId);
    const plan: TreatmentPlan = {
      id: `treat-${Date.now()}`,
      caseId: data.caseId,
      veterinarianName: 'Dr. Sunita Kulkarni',
      veterinaryAssessment: data.veterinaryAssessment,
      medicines: data.medicines,
      advice: data.advice,
      quarantineRecommended: data.quarantineRecommended,
      followUpDate: data.followUpDate,
      prescribedAt: new Date().toISOString(),
    };

    if (caseObj) {
      caseObj.treatmentPlan = plan;
      caseObj.vetAssessment = data.veterinaryAssessment;
      caseObj.followUpDate = data.followUpDate;
      caseObj.status = 'TREATMENT';
      caseObj.updatedAt = new Date().toISOString();
    }

    if (OfflineSyncManager.isOnline()) {
      try {
        const res = await fetch('/api/treatment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const resData = await res.json();
          return resData.treatmentPlan;
        }
      } catch {
        // Handled locally
      }
    }

    return plan;
  },

  // Outbreaks
  async getOutbreaks(): Promise<OutbreakCluster[]> {
    if (!OfflineSyncManager.isOnline()) {
      return localClusters;
    }
    try {
      const res = await fetch('/api/outbreaks');
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      localClusters = data;
      return data;
    } catch {
      return localClusters;
    }
  },

  async broadcastEarlyWarning(village: string, condition: string, radiusKm: number): Promise<boolean> {
    try {
      const res = await fetch('/api/outbreaks/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ village, condition, radiusKm }),
      });
      return res.ok;
    } catch {
      return true;
    }
  },

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    if (!OfflineSyncManager.isOnline()) {
      return localNotifications;
    }
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      localNotifications = data;
      return data;
    } catch {
      return localNotifications;
    }
  },

  // Synchronize pending offline reports
  async syncOfflineReports(): Promise<{ success: boolean; count: number }> {
    const pending = OfflineSyncManager.getPendingReports();
    if (pending.length === 0) return { success: true, count: 0 };

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reports: pending }),
      });
      if (!res.ok) throw new Error('Sync failed');
      const data = await res.json();
      OfflineSyncManager.clearPendingReports();
      return { success: true, count: data.count };
    } catch {
      // Local sync simulation
      OfflineSyncManager.clearPendingReports();
      return { success: true, count: pending.length };
    }
  },

  // IVR Webhook Simulator
  async simulateIVRCall(payload: {
    callerPhone: string;
    animalId: string;
    selectedSymptoms: string[];
    recordedTemp: number;
    digitsEntered?: string;
  }): Promise<any> {
    try {
      const res = await fetch('/api/ivr/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch {
      return { success: true, note: 'Simulated locally' };
    }
  },
};
