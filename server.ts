import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_ANIMALS,
  INITIAL_HEALTH_REPORTS,
  INITIAL_VET_CASES,
  INITIAL_OUTBREAK_CLUSTERS,
  INITIAL_NOTIFICATIONS,
  DEMO_FARMERS,
  DEMO_VETS,
} from './src/data/mockData';
import { calculateLivestockRisk } from './src/services/aiRiskEngine';
import { detectOutbreakClusters, generateEarlyWarningAlertText } from './src/services/outbreakDetection';
import {
  Animal,
  HealthReport,
  VetCase,
  LabReferral,
  TreatmentPlan,
  OutbreakCluster,
  NotificationItem,
} from './src/types';

// In-memory persistent database abstraction for demo prototype
let animals: Animal[] = [...INITIAL_ANIMALS];
let healthReports: HealthReport[] = [...INITIAL_HEALTH_REPORTS];
let vetCases: VetCase[] = [...INITIAL_VET_CASES];
let outbreakClusters: OutbreakCluster[] = [...INITIAL_OUTBREAK_CLUSTERS];
let notifications: NotificationItem[] = [...INITIAL_NOTIFICATIONS];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ===================== REST API ROUTES =====================

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      system: 'PashuRaksha AI – Smart Livestock Disease Management & Early Warning System',
      sihProblemStatement: '26128',
      version: '1.0.0-prototype',
      timestamp: new Date().toISOString(),
    });
  });

  // Auth mock endpoints
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { role, phone, email } = req.body;
    if (role === 'VETERINARIAN') {
      res.json({ user: DEMO_VETS[0], token: 'demo-vet-jwt-token-123' });
    } else if (role === 'ADMIN') {
      res.json({
        user: {
          id: 'admin-1',
          name: 'Dr. Vijay Deshmukh',
          designation: 'District Animal Husbandry Officer & State Surveillance Lead',
          district: 'Pune District, Maharashtra',
        },
        token: 'demo-admin-jwt-token-456',
      });
    } else {
      res.json({ user: DEMO_FARMERS[0], token: 'demo-farmer-jwt-token-789' });
    }
  });

  app.post('/api/auth/register', (req: Request, res: Response) => {
    res.json({ success: true, message: 'Registration simulated successfully' });
  });

  // Farmers
  app.get('/api/farmers/:id', (req: Request, res: Response) => {
    const farmer = DEMO_FARMERS.find(f => f.id === req.params.id) || DEMO_FARMERS[0];
    res.json(farmer);
  });

  app.post('/api/farmers', (req: Request, res: Response) => {
    const newFarmer = {
      id: `farmer-${Date.now()}`,
      ...req.body,
    };
    DEMO_FARMERS.push(newFarmer);
    res.status(201).json(newFarmer);
  });

  // Animals
  app.get('/api/animals', (req: Request, res: Response) => {
    res.json(animals);
  });

  app.get('/api/animals/:id', (req: Request, res: Response) => {
    const animal = animals.find(a => a.id === req.params.id || a.tagNumber === req.params.id);
    if (!animal) {
      return res.status(404).json({ error: 'Animal not found' });
    }
    res.json(animal);
  });

  app.post('/api/animals', (req: Request, res: Response) => {
    const {
      tagNumber,
      name,
      species,
      breed,
      ageMonths,
      gender,
      weightKg,
      vaccinationStatus,
      previousDiseases,
      village,
      district,
      state,
      lat,
      lng,
      farmerId,
      farmerName,
      farmerPhone,
      photoUrl,
    } = req.body;

    const newAnimal: Animal = {
      id: `anim-${Date.now()}`,
      tagNumber: tagNumber || `Cow A${Math.floor(100 + Math.random() * 900)}`,
      name: name || 'Unnamed Livestock',
      species: species || 'Cow',
      breed: breed || 'Indigenous Crossbred',
      ageMonths: Number(ageMonths) || 36,
      gender: gender || 'Female',
      weightKg: Number(weightKg) || 350,
      vaccinationStatus: vaccinationStatus || 'COMPLETE',
      vaccinations: [
        {
          vaccineName: 'FMD Oil Adjuvant',
          dateAdministered: new Date().toISOString().split('T')[0],
          nextDueDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
        },
      ],
      previousDiseases: previousDiseases ? (Array.isArray(previousDiseases) ? previousDiseases : [previousDiseases]) : [],
      village: village || 'Baramati Rural',
      district: district || 'Pune',
      state: state || 'Maharashtra',
      lat: Number(lat) || 18.1528,
      lng: Number(lng) || 74.5771,
      farmerId: farmerId || 'farmer-1',
      farmerName: farmerName || 'Ramesh Patil',
      farmerPhone: farmerPhone || '+91 98220 12345',
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=600&q=80',
      registeredAt: new Date().toISOString(),
    };

    animals.unshift(newAnimal);
    res.status(201).json(newAnimal);
  });

  // AI Multimodal Health Analysis Engine
  app.post('/api/health/analyze', (req: Request, res: Response) => {
    try {
      const {
        animal_id,
        image,
        image_file_meta,
        symptoms = [],
        temperature = 38.6,
        activity = 'NORMAL',
        appetite = 'NORMAL',
        milk_production = 'NORMAL',
        vaccination = 'COMPLETE',
        medical_history = [],
        environmental_data = '',
        latitude = 18.1528,
        longitude = 74.5771,
      } = req.body;

      const analysisResult = calculateLivestockRisk({
        animal_id,
        image,
        image_file_meta,
        symptoms,
        temperature: Number(temperature),
        activity,
        appetite,
        milk_production,
        vaccination,
        medical_history,
        environmental_data,
        latitude: Number(latitude),
        longitude: Number(longitude),
      });

      res.json(analysisResult);
    } catch (err: any) {
      console.error('Error in /api/health/analyze:', err);
      res.status(500).json({ error: 'AI screening inference error', details: err.message });
    }
  });

  // Health Reports
  app.get('/api/health/reports', (req: Request, res: Response) => {
    res.json(healthReports);
  });

  app.get('/api/health/reports/:id', (req: Request, res: Response) => {
    const report = healthReports.find(r => r.id === req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json(report);
  });

  app.post('/api/health/reports', (req: Request, res: Response) => {
    try {
      const data = req.body;
      const reportId = `rep-${Date.now()}`;

      // Calculate AI screening if not already computed
      const aiOutput = calculateLivestockRisk({
        animal_id: data.animalId,
        image: data.imageUrl,
        image_file_meta: data.imageFileMeta,
        symptoms: data.symptoms || [],
        temperature: Number(data.temperatureC) || 38.6,
        activity: data.activityLevel || 'NORMAL',
        appetite: data.appetite || 'NORMAL',
        milk_production: data.milkProduction || 'NORMAL',
        vaccination: data.vaccinationStatus || 'COMPLETE',
        medical_history: data.recentIllness ? [data.recentIllness] : [],
        environmental_data: data.environmentalConditions || '',
        latitude: Number(data.lat) || 18.1528,
        longitude: Number(data.lng) || 74.5771,
      });

      const newReport: HealthReport = {
        id: reportId,
        animalId: data.animalId,
        animalTag: data.animalTag,
        animalName: data.animalName,
        farmerId: data.farmerId || 'farmer-1',
        farmerName: data.farmerName || 'Ramesh Patil',
        farmerPhone: data.farmerPhone || '+91 98220 12345',
        village: data.village || 'Baramati Rural',
        district: data.district || 'Pune',
        lat: Number(data.lat) || 18.1528,
        lng: Number(data.lng) || 74.5771,
        symptoms: data.symptoms || [],
        temperatureC: Number(data.temperatureC) || 38.6,
        activityLevel: data.activityLevel || 'NORMAL',
        appetite: data.appetite || 'NORMAL',
        milkProduction: data.milkProduction || 'NORMAL',
        vaccinationStatus: data.vaccinationStatus || 'COMPLETE',
        recentIllness: data.recentIllness || '',
        environmentalConditions: data.environmentalConditions || '',
        imageUrl: data.imageUrl,
        imageQuality: aiOutput.image_quality,
        imageFindings: aiOutput.image_findings,
        riskScore: aiOutput.risk_score,
        riskLevel: aiOutput.risk_level,
        screeningResult: aiOutput.screening_result,
        possibleConditions: aiOutput.possible_conditions,
        recommendedActions: aiOutput.recommended_actions,
        vetRequired: aiOutput.vet_required,
        isOfflineSubmission: data.isOfflineSubmission || false,
        syncedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      let createdCase: VetCase | null = null;

      // Automatic Veterinary Escalation if HIGH risk
      if (newReport.riskLevel === 'HIGH') {
        const caseId = `case-${Date.now()}`;
        createdCase = {
          id: caseId,
          caseNumber: `VET-MH-PUN-${Math.floor(100 + Math.random() * 900)}`,
          reportId: newReport.id,
          animalId: newReport.animalId,
          animalTag: newReport.animalTag,
          animalName: newReport.animalName,
          species: 'Cow',
          farmerId: newReport.farmerId,
          farmerName: newReport.farmerName,
          farmerPhone: newReport.farmerPhone,
          village: newReport.village,
          district: newReport.district,
          lat: newReport.lat,
          lng: newReport.lng,
          symptoms: newReport.symptoms,
          temperatureC: newReport.temperatureC,
          imageUrl: newReport.imageUrl,
          riskScore: newReport.riskScore,
          riskLevel: newReport.riskLevel,
          possibleConditions: newReport.possibleConditions,
          status: 'NEW',
          urgency: newReport.riskScore >= 85 ? 'CRITICAL' : 'URGENT',
          assignedVetId: 'vet-1',
          assignedVetName: 'Dr. Sunita Kulkarni',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        newReport.vetCaseId = caseId;
        vetCases.unshift(createdCase);

        // Add high-risk notification
        notifications.unshift({
          id: `notif-${Date.now()}`,
          title: `🚨 HIGH-RISK CASE: ${newReport.animalTag}`,
          message: `🚨 HIGH-RISK CASE: ${newReport.animalTag} (Risk Score: ${newReport.riskScore}/100) in ${newReport.village}. Veterinary review required.`,
          type: 'HIGH_RISK_ALERT',
          targetRole: 'VETERINARIAN',
          caseId: createdCase.id,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }

      healthReports.unshift(newReport);

      // Re-evaluate outbreak clusters
      const updatedClusters = detectOutbreakClusters(healthReports);
      if (updatedClusters.length > outbreakClusters.length) {
        // New cluster detected!
        const latestCluster = updatedClusters[0];
        notifications.unshift({
          id: `notif-outbreak-${Date.now()}`,
          title: `⚠ Potential Outbreak Hotspot: ${latestCluster.village}`,
          message: generateEarlyWarningAlertText(latestCluster),
          type: 'OUTBREAK_HOTSPOT',
          targetRole: 'ALL',
          village: latestCluster.village,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
      outbreakClusters = updatedClusters.length > 0 ? updatedClusters : outbreakClusters;

      res.status(201).json({
        report: newReport,
        vetCase: createdCase,
        aiScreening: aiOutput,
      });
    } catch (err: any) {
      console.error('Error saving health report:', err);
      res.status(500).json({ error: 'Failed to create report', details: err.message });
    }
  });

  // Veterinary Cases
  app.get('/api/vet/cases', (req: Request, res: Response) => {
    res.json(vetCases);
  });

  app.get('/api/vet/cases/:id', (req: Request, res: Response) => {
    const c = vetCases.find(v => v.id === req.params.id);
    if (!c) return res.status(404).json({ error: 'Case not found' });
    res.json(c);
  });

  app.put('/api/vet/cases/:id', (req: Request, res: Response) => {
    const idx = vetCases.findIndex(v => v.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Case not found' });

    vetCases[idx] = {
      ...vetCases[idx],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    res.json(vetCases[idx]);
  });

  // Lab Referrals
  app.post('/api/lab/referrals', (req: Request, res: Response) => {
    const { caseId, animalTag, suspectedCondition, sampleType, notes, priority } = req.body;
    const caseIndex = vetCases.findIndex(c => c.id === caseId);
    if (caseIndex === -1) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const labReferral: LabReferral = {
      id: `lab-${Date.now()}`,
      caseId,
      animalTag: animalTag || vetCases[caseIndex].animalTag,
      suspectedCondition: suspectedCondition || 'Suspected Capripoxvirus / LSD',
      sampleType: sampleType || 'Skin Scraping',
      priority: priority || 'PRIORITY',
      notes: notes || 'EDTA and viral transport medium swab for PCR screening.',
      status: 'LAB_REQUESTED',
      labName: 'Disease Investigation Section (DIS), Aundh, Pune',
      requestedAt: new Date().toISOString(),
    };

    vetCases[caseIndex].status = 'LAB_REQUESTED';
    vetCases[caseIndex].labReferral = labReferral;
    vetCases[caseIndex].updatedAt = new Date().toISOString();

    // Add notification
    notifications.unshift({
      id: `notif-lab-${Date.now()}`,
      title: `🔬 Lab Referral: ${vetCases[caseIndex].animalTag}`,
      message: `Sample requisition sent to DIS Pune for ${vetCases[caseIndex].animalTag}. Status: LAB REQUESTED.`,
      type: 'LAB_UPDATE',
      targetRole: 'ALL',
      caseId,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ case: vetCases[caseIndex], labReferral });
  });

  app.put('/api/lab/referrals/:id', (req: Request, res: Response) => {
    const { status, resultSummary } = req.body;
    const c = vetCases.find(v => v.labReferral?.id === req.params.id);
    if (!c || !c.labReferral) {
      return res.status(404).json({ error: 'Lab referral not found' });
    }

    c.labReferral.status = status;
    if (status === 'SAMPLE_COLLECTED') {
      c.labReferral.sampleCollectedAt = new Date().toISOString();
    } else if (status === 'UNDER_TEST') {
      c.labReferral.testConductedAt = new Date().toISOString();
    } else if (status === 'RESULT_AVAILABLE') {
      c.labReferral.resultAvailableAt = new Date().toISOString();
      c.labReferral.resultSummary = resultSummary || 'Simulated Lab Result: Positive for target viral DNA/pathogen.';
    }

    c.updatedAt = new Date().toISOString();
    res.json(c.labReferral);
  });

  // Treatment Prescription
  app.post('/api/treatment', (req: Request, res: Response) => {
    const {
      caseId,
      veterinaryAssessment,
      medicines,
      advice,
      quarantineRecommended,
      followUpDate,
    } = req.body;

    const caseIndex = vetCases.findIndex(c => c.id === caseId);
    if (caseIndex === -1) return res.status(404).json({ error: 'Case not found' });

    const treatmentPlan: TreatmentPlan = {
      id: `treat-${Date.now()}`,
      caseId,
      veterinarianName: 'Dr. Sunita Kulkarni',
      veterinaryAssessment: veterinaryAssessment || 'Clinical symptoms confirmed by veterinary inspection.',
      medicines: medicines || [],
      advice: advice || 'Provide clean water, soft feed, and strict fly exclusion.',
      quarantineRecommended: quarantineRecommended ?? true,
      followUpDate: followUpDate || new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      prescribedAt: new Date().toISOString(),
    };

    vetCases[caseIndex].treatmentPlan = treatmentPlan;
    vetCases[caseIndex].vetAssessment = veterinaryAssessment;
    vetCases[caseIndex].followUpDate = treatmentPlan.followUpDate;
    vetCases[caseIndex].status = 'TREATMENT';
    vetCases[caseIndex].updatedAt = new Date().toISOString();

    notifications.unshift({
      id: `notif-treat-${Date.now()}`,
      title: `💊 Treatment Prescribed for ${vetCases[caseIndex].animalTag}`,
      message: `Veterinary treatment prescribed. Follow-up scheduled for ${treatmentPlan.followUpDate}.`,
      type: 'TREATMENT_UPDATE',
      targetRole: 'FARMER',
      caseId,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ case: vetCases[caseIndex], treatmentPlan });
  });

  // Follow-up
  app.post('/api/followup', (req: Request, res: Response) => {
    const { caseId, followUpDate, notes } = req.body;
    const caseIndex = vetCases.findIndex(c => c.id === caseId);
    if (caseIndex === -1) return res.status(404).json({ error: 'Case not found' });

    vetCases[caseIndex].followUpDate = followUpDate;
    vetCases[caseIndex].status = 'FOLLOW_UP';
    vetCases[caseIndex].updatedAt = new Date().toISOString();

    res.json({ case: vetCases[caseIndex] });
  });

  // Outbreaks
  app.get('/api/outbreaks', (req: Request, res: Response) => {
    const computedClusters = detectOutbreakClusters(healthReports);
    res.json(computedClusters.length > 0 ? computedClusters : outbreakClusters);
  });

  app.post('/api/outbreaks/analyze', (req: Request, res: Response) => {
    const clusters = detectOutbreakClusters(healthReports);
    outbreakClusters = clusters;
    res.json({
      clustersFound: clusters.length,
      clusters,
    });
  });

  // Notifications
  app.get('/api/notifications', (req: Request, res: Response) => {
    res.json(notifications);
  });

  app.post('/api/notifications', (req: Request, res: Response) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      ...req.body,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    notifications.unshift(newNotif);
    res.status(201).json(newNotif);
  });

  // Offline Sync Queue Endpoint
  app.post('/api/sync', (req: Request, res: Response) => {
    try {
      const { reports = [] } = req.body;
      const syncedReports: HealthReport[] = [];
      const createdCases: VetCase[] = [];

      for (const repData of reports) {
        const aiOutput = calculateLivestockRisk({
          animal_id: repData.animalId,
          image: repData.imageUrl,
          image_file_meta: repData.imageFileMeta,
          symptoms: repData.symptoms || [],
          temperature: Number(repData.temperatureC) || 38.6,
          activity: repData.activityLevel || 'NORMAL',
          appetite: repData.appetite || 'NORMAL',
          milk_production: repData.milkProduction || 'NORMAL',
          vaccination: repData.vaccinationStatus || 'COMPLETE',
          medical_history: repData.recentIllness ? [repData.recentIllness] : [],
          environmental_data: repData.environmentalConditions || '',
          latitude: Number(repData.lat) || 18.1528,
          longitude: Number(repData.lng) || 74.5771,
        });

        const syncedReport: HealthReport = {
          ...repData,
          id: repData.id || `rep-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          riskScore: aiOutput.risk_score,
          riskLevel: aiOutput.risk_level,
          screeningResult: aiOutput.screening_result,
          possibleConditions: aiOutput.possible_conditions,
          recommendedActions: aiOutput.recommended_actions,
          vetRequired: aiOutput.vet_required,
          isOfflineSubmission: true,
          syncedAt: new Date().toISOString(),
        };

        if (syncedReport.riskLevel === 'HIGH') {
          const caseId = `case-${Date.now()}`;
          const newCase: VetCase = {
            id: caseId,
            caseNumber: `VET-MH-PUN-${Math.floor(100 + Math.random() * 900)}`,
            reportId: syncedReport.id,
            animalId: syncedReport.animalId,
            animalTag: syncedReport.animalTag,
            animalName: syncedReport.animalName,
            species: 'Cow',
            farmerId: syncedReport.farmerId,
            farmerName: syncedReport.farmerName,
            farmerPhone: syncedReport.farmerPhone,
            village: syncedReport.village,
            district: syncedReport.district,
            lat: syncedReport.lat,
            lng: syncedReport.lng,
            symptoms: syncedReport.symptoms,
            temperatureC: syncedReport.temperatureC,
            imageUrl: syncedReport.imageUrl,
            riskScore: syncedReport.riskScore,
            riskLevel: syncedReport.riskLevel,
            possibleConditions: syncedReport.possibleConditions,
            status: 'NEW',
            urgency: 'URGENT',
            assignedVetId: 'vet-1',
            assignedVetName: 'Dr. Sunita Kulkarni',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          syncedReport.vetCaseId = caseId;
          vetCases.unshift(newCase);
          createdCases.push(newCase);
        }

        healthReports.unshift(syncedReport);
        syncedReports.push(syncedReport);
      }

      // Add sync notification
      if (syncedReports.length > 0) {
        notifications.unshift({
          id: `notif-sync-${Date.now()}`,
          title: '🔄 Offline Reports Synchronized',
          message: `Successfully synchronized ${syncedReports.length} livestock health report(s) with district registry.`,
          type: 'OFFLINE_SYNC',
          targetRole: 'ALL',
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }

      res.json({
        success: true,
        count: syncedReports.length,
        syncedReports,
        createdCases,
      });
    } catch (err: any) {
      console.error('Error during /api/sync:', err);
      res.status(500).json({ error: 'Sync failed', details: err.message });
    }
  });

  // IVR Webhook / Simulation API
  app.post('/api/ivr/webhook', (req: Request, res: Response) => {
    const { callerPhone, animalId, digitsEntered, speechTranscript, selectedSymptoms, recordedTemp } = req.body;

    const matchedAnimal = animals.find(a => a.tagNumber.toLowerCase().includes((animalId || '102').toLowerCase())) || animals[0];

    const parsedSymptoms: string[] = selectedSymptoms || ['High Fever', 'Skin Lesions / Nodules'];
    const tempC = Number(recordedTemp) || 40.2;

    const reportId = `rep-ivr-${Date.now()}`;
    const aiOutput = calculateLivestockRisk({
      animal_id: matchedAnimal.id,
      symptoms: parsedSymptoms,
      temperature: tempC,
      activity: 'REDUCED',
      appetite: 'REDUCED',
      vaccination: matchedAnimal.vaccinationStatus,
      latitude: matchedAnimal.lat,
      longitude: matchedAnimal.lng,
    });

    const ivrReport: HealthReport = {
      id: reportId,
      animalId: matchedAnimal.id,
      animalTag: matchedAnimal.tagNumber,
      animalName: matchedAnimal.name,
      farmerId: matchedAnimal.farmerId,
      farmerName: matchedAnimal.farmerName,
      farmerPhone: callerPhone || matchedAnimal.farmerPhone,
      village: matchedAnimal.village,
      district: matchedAnimal.district,
      lat: matchedAnimal.lat,
      lng: matchedAnimal.lng,
      symptoms: parsedSymptoms,
      temperatureC: tempC,
      activityLevel: 'REDUCED',
      appetite: 'REDUCED',
      milkProduction: 'SLIGHT_DROP',
      vaccinationStatus: matchedAnimal.vaccinationStatus,
      recentIllness: 'Reported via automated IVR Kisan Helpline toll-free',
      environmentalConditions: 'IVR Voice Intake',
      imageQuality: 'GOOD',
      imageFindings: ['Image not applicable for voice IVR intake'],
      riskScore: aiOutput.risk_score,
      riskLevel: aiOutput.risk_level,
      screeningResult: aiOutput.screening_result,
      possibleConditions: aiOutput.possible_conditions,
      recommendedActions: aiOutput.recommended_actions,
      vetRequired: aiOutput.vet_required,
      createdAt: new Date().toISOString(),
    };

    healthReports.unshift(ivrReport);

    let createdCase: VetCase | null = null;
    if (ivrReport.riskLevel === 'HIGH') {
      const caseId = `case-ivr-${Date.now()}`;
      createdCase = {
        id: caseId,
        caseNumber: `VET-IVR-${Math.floor(100 + Math.random() * 900)}`,
        reportId: ivrReport.id,
        animalId: matchedAnimal.id,
        animalTag: matchedAnimal.tagNumber,
        animalName: matchedAnimal.name,
        species: matchedAnimal.species,
        farmerId: matchedAnimal.farmerId,
        farmerName: matchedAnimal.farmerName,
        farmerPhone: callerPhone || matchedAnimal.farmerPhone,
        village: matchedAnimal.village,
        district: matchedAnimal.district,
        lat: matchedAnimal.lat,
        lng: matchedAnimal.lng,
        symptoms: parsedSymptoms,
        temperatureC: tempC,
        riskScore: ivrReport.riskScore,
        riskLevel: ivrReport.riskLevel,
        possibleConditions: ivrReport.possibleConditions,
        status: 'NEW',
        urgency: 'URGENT',
        assignedVetId: 'vet-1',
        assignedVetName: 'Dr. Sunita Kulkarni',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      ivrReport.vetCaseId = caseId;
      vetCases.unshift(createdCase);

      notifications.unshift({
        id: `notif-ivr-${Date.now()}`,
        title: `📞 IVR Report Escalated: ${matchedAnimal.tagNumber}`,
        message: `Toll-free IVR health report recorded for ${matchedAnimal.tagNumber} (${matchedAnimal.farmerName}, ${matchedAnimal.village}). Risk Score: ${ivrReport.riskScore}/100.`,
        type: 'HIGH_RISK_ALERT',
        targetRole: 'VETERINARIAN',
        caseId,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      channel: 'IVR_VOICE_GATEWAY',
      callSessionId: `session-${Date.now()}`,
      report: ivrReport,
      vetCase: createdCase,
      twimlOrExotelResponse: `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="alice" language="hi-IN">Aapki report darj kar li gayi hai. Doctor ko soochit kiya gaya hai.</Say></Response>`,
    });
  });

  // Broadcast Early Warning
  app.post('/api/outbreaks/broadcast', (req: Request, res: Response) => {
    const { village, condition, radiusKm } = req.body;
    const alertMessage = `⚠ GOVERNMENT ANIMAL HUSBANDRY ADVISORY: Potential ${condition || 'livestock disease'} hotspot detected in ${village || 'Baramati'}. Farmers within ${radiusKm || 5} km are advised to isolate symptomatic livestock and permit ring vaccination.`;

    notifications.unshift({
      id: `notif-broadcast-${Date.now()}`,
      title: `📢 District Early Warning: ${village}`,
      message: alertMessage,
      type: 'OUTBREAK_HOTSPOT',
      targetRole: 'ALL',
      village,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    res.json({ success: true, message: 'Broadcast disseminated to all registered dairy farmers and field vets.' });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PashuRaksha AI] Full-stack Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
