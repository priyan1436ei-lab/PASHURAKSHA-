import React, { useState, useEffect } from 'react';
import {
  Animal,
  HealthReport,
  VetCase,
  LabReferral,
  TreatmentPlan,
  OutbreakCluster,
  NotificationItem,
  UserRole,
  SupportedLanguage,
} from './types';
import { api } from './services/api';
import { Header } from './components/common/Header';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { DemoScenarioModal } from './components/common/DemoScenarioModal';
import { FarmerDashboard } from './components/farmer/FarmerDashboard';
import { HealthReportWizard } from './components/farmer/HealthReportWizard';
import { AnimalRegistrationModal } from './components/farmer/AnimalRegistrationModal';
import { AnimalProfileModal } from './components/farmer/AnimalProfileModal';
import { VetDashboard } from './components/vet/VetDashboard';
import { LabReferralModal } from './components/vet/LabReferralModal';
import { TreatmentModal } from './components/vet/TreatmentModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { IVRSimulationModal } from './components/ivr/IVRSimulationModal';
import { INITIAL_ANIMALS, INITIAL_HEALTH_REPORTS, INITIAL_VET_CASES, INITIAL_OUTBREAK_CLUSTERS, INITIAL_NOTIFICATIONS } from './data/mockData';

export default function App() {
  // State
  const [currentRole, setCurrentRole] = useState<UserRole>('FARMER');
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('en');

  // Entities
  const [animals, setAnimals] = useState<Animal[]>(INITIAL_ANIMALS);
  const [reports, setReports] = useState<HealthReport[]>(INITIAL_HEALTH_REPORTS);
  const [vetCases, setVetCases] = useState<VetCase[]>(INITIAL_VET_CASES);
  const [outbreaks, setOutbreaks] = useState<OutbreakCluster[]>(INITIAL_OUTBREAK_CLUSTERS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Modals state
  const [isHealthWizardOpen, setIsHealthWizardOpen] = useState<boolean>(false);
  const [wizardAnimal, setWizardAnimal] = useState<Animal | undefined>(undefined);

  const [isRegistrationOpen, setIsRegistrationOpen] = useState<boolean>(false);

  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [profileAnimal, setProfileAnimal] = useState<Animal | null>(null);

  const [isLabModalOpen, setIsLabModalOpen] = useState<boolean>(false);
  const [selectedVetCaseForLab, setSelectedVetCaseForLab] = useState<VetCase | null>(null);

  const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState<boolean>(false);
  const [selectedVetCaseForTreatment, setSelectedVetCaseForTreatment] = useState<VetCase | null>(null);

  const [isIVROpen, setIsIVROpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isDemoScenarioOpen, setIsDemoScenarioOpen] = useState<boolean>(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Initial load
  useEffect(() => {
    async function loadData() {
      try {
        const [anims, reps, cases, clusts, notifs] = await Promise.all([
          api.getAnimals(),
          api.getHealthReports(),
          api.getVetCases(),
          api.getOutbreaks(),
          api.getNotifications(),
        ]);
        if (anims && anims.length > 0) setAnimals(anims);
        if (reps && reps.length > 0) setReports(reps);
        if (cases && cases.length > 0) setVetCases(cases);
        if (clusts && clusts.length > 0) setOutbreaks(clusts);
        if (notifs && notifs.length > 0) setNotifications(notifs);
      } catch (err) {
        console.warn('Using local store fallback:', err);
      }
    }
    loadData();
  }, []);

  // Handlers
  const handleReportSubmitted = (
    newReport: HealthReport,
    escalatedCase: VetCase | null,
    isOffline: boolean
  ) => {
    setReports((prev) => [newReport, ...prev]);

    if (escalatedCase) {
      setVetCases((prev) => [escalatedCase, ...prev]);

      // Add high-priority notification
      const alertNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: `🚨 HIGH RISK ESCALATION: ${newReport.animalTag}`,
        message: `AI screening scored ${newReport.riskScore}/100. Dispatched to Taluka Veterinary Dispensary for immediate clinical verification.`,
        type: 'HIGH_RISK_ALERT',
        caseId: escalatedCase.id,
        createdAt: new Date().toISOString(),
        isRead: false,
        targetRole: 'ALL',
      };
      setNotifications((prev) => [alertNotif, ...prev]);
    }

    if (isOffline) {
      showToast('Report saved in offline storage. Synchronizes automatically upon reconnect.');
    } else {
      showToast(`Health screening logged for ${newReport.animalTag}.`);
    }
  };

  const handleAnimalRegistered = (newAnimal: Animal) => {
    setAnimals((prev) => [newAnimal, ...prev]);
    showToast(`Livestock ${newAnimal.tagNumber} (${newAnimal.name}) registered successfully.`);
  };

  const handleUpdateCase = (updatedCase: VetCase) => {
    setVetCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
    showToast(`Case ${updatedCase.caseNumber} updated: Status is now ${updatedCase.status}.`);
  };

  const handleReferralCreated = (referral: LabReferral) => {
    setVetCases((prev) =>
      prev.map((c) => {
        if (c.id === referral.caseId) {
          return { ...c, status: 'LAB_REQUESTED', labReferral: referral };
        }
        return c;
      })
    );
    showToast(`Laboratory referral order dispatched to DIS Aundh, Pune.`);
  };

  const handleUpdateLabStatus = (labId: string, status: LabReferral['status'], summary?: string) => {
    setVetCases((prev) =>
      prev.map((c) => {
        if (c.labReferral?.id === labId) {
          return {
            ...c,
            labReferral: {
              ...c.labReferral,
              status,
              resultSummary: summary || c.labReferral.resultSummary,
            },
          };
        }
        return c;
      })
    );
    showToast(`Diagnostic test status updated to ${status}.`);
  };

  const handleTreatmentPrescribed = (plan: TreatmentPlan) => {
    setVetCases((prev) =>
      prev.map((c) => {
        if (c.id === plan.caseId) {
          return {
            ...c,
            status: 'TREATMENT',
            treatmentPlan: plan,
            followUpDate: plan.followUpDate,
          };
        }
        return c;
      })
    );
    showToast(`Standard veterinary prescription and isolation regimen issued.`);
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(
    (n) => !n.isRead && (n.targetRole === 'ALL' || n.targetRole === currentRole)
  ).length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col">
      {/* Top Main Navigation Header */}
      <Header
        currentRole={currentRole}
        onSelectRole={setCurrentRole}
        currentLang={currentLang}
        onSelectLang={setCurrentLang}
        onOpenIVR={() => setIsIVROpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onRunDemoScenario={() => setIsDemoScenarioOpen(true)}
        unreadCount={unreadCount}
      />

      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl border border-slate-700 animate-slide-up flex items-center gap-2 max-w-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Role-Based Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {currentRole === 'FARMER' && (
          <FarmerDashboard
            animals={animals}
            reports={reports}
            vetCases={vetCases}
            outbreaks={outbreaks}
            currentLang={currentLang}
            onOpenReportWizard={(anim) => {
              setWizardAnimal(anim || animals.find((a) => a.tagNumber === 'Cow A102'));
              setIsHealthWizardOpen(true);
            }}
            onOpenRegistration={() => setIsRegistrationOpen(true)}
            onOpenProfile={(anim) => {
              setProfileAnimal(anim);
              setIsProfileOpen(true);
            }}
            onOpenIVR={() => setIsIVROpen(true)}
          />
        )}

        {currentRole === 'VETERINARIAN' && (
          <VetDashboard
            vetCases={vetCases}
            onOpenLabModal={(c) => {
              setSelectedVetCaseForLab(c);
              setIsLabModalOpen(true);
            }}
            onOpenTreatmentModal={(c) => {
              setSelectedVetCaseForTreatment(c);
              setIsTreatmentModalOpen(true);
            }}
            onUpdateCase={handleUpdateCase}
          />
        )}

        {currentRole === 'ADMIN' && (
          <AdminDashboard
            animals={animals}
            reports={reports}
            vetCases={vetCases}
            outbreaks={outbreaks}
            currentLang={currentLang}
          />
        )}
      </main>

      {/* Modals */}
      <HealthReportWizard
        isOpen={isHealthWizardOpen}
        onClose={() => setIsHealthWizardOpen(false)}
        animals={animals}
        preselectedAnimal={wizardAnimal}
        currentLang={currentLang}
        onReportSubmitted={handleReportSubmitted}
      />

      <AnimalRegistrationModal
        isOpen={isRegistrationOpen}
        onClose={() => setIsRegistrationOpen(false)}
        onAnimalRegistered={handleAnimalRegistered}
      />

      <AnimalProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        animal={profileAnimal}
        reports={reports}
        vetCases={vetCases}
        onCheckHealth={(anim) => {
          setWizardAnimal(anim);
          setIsHealthWizardOpen(true);
        }}
      />

      <LabReferralModal
        isOpen={isLabModalOpen}
        onClose={() => setIsLabModalOpen(false)}
        vetCase={selectedVetCaseForLab}
        onReferralCreated={handleReferralCreated}
        onUpdateLabStatus={handleUpdateLabStatus}
      />

      <TreatmentModal
        isOpen={isTreatmentModalOpen}
        onClose={() => setIsTreatmentModalOpen(false)}
        vetCase={selectedVetCaseForTreatment}
        onTreatmentPrescribed={handleTreatmentPrescribed}
      />

      <IVRSimulationModal
        isOpen={isIVROpen}
        onClose={() => setIsIVROpen(false)}
        onIVRReportSubmitted={() => {
          showToast('IVR Voice intake report recorded. Dispatched to veterinary officer.');
        }}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        currentRole={currentRole}
        onSelectCase={(caseId) => {
          setCurrentRole('VETERINARIAN');
        }}
        onMarkAllRead={handleMarkAllRead}
      />

      <DemoScenarioModal
        isOpen={isDemoScenarioOpen}
        onClose={() => setIsDemoScenarioOpen(false)}
        onSwitchRole={(role) => setCurrentRole(role)}
        onJumpToFarmerScreening={() => {
          const cow102 = animals.find((a) => a.tagNumber === 'Cow A102') || animals[0];
          setWizardAnimal(cow102);
          setIsHealthWizardOpen(true);
        }}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-bold text-slate-800">PashuRaksha AI</span> • Smart India Hackathon 2026 (Problem Statement 26128)
          </div>
          <div className="text-[11px] text-slate-500">
            Assisting Rural Livestock Healthcare with AI Screening, Offline Sync & Early Warnings
          </div>
        </div>
      </footer>
    </div>
  );
}
