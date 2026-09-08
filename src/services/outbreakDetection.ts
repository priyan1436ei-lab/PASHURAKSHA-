import { HealthReport, OutbreakCluster, RiskLevel } from '../types';

/**
 * Calculates distance between two points on Earth using the Haversine formula (in km)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Detects potential outbreak clusters from health reports using spatial-temporal proximity
 * and symptom/condition signature matching (DBSCAN-style approximation).
 */
export function detectOutbreakClusters(
  reports: HealthReport[],
  distanceThresholdKm: number = 7.5,
  timeWindowDays: number = 7,
  minCasesForHotspot: number = 3
): OutbreakCluster[] {
  const now = new Date().getTime();
  const timeThresholdMs = timeWindowDays * 24 * 60 * 60 * 1000;

  // Filter reports within the recent time window
  const recentReports = reports.filter(r => {
    const reportTime = new Date(r.createdAt).getTime();
    return now - reportTime <= timeThresholdMs;
  });

  // Group by village / spatial proximity
  const clusters: OutbreakCluster[] = [];
  const visited = new Set<string>();

  for (let i = 0; i < recentReports.length; i++) {
    const baseReport = recentReports[i];
    if (visited.has(baseReport.id)) continue;

    const group: HealthReport[] = [baseReport];
    visited.add(baseReport.id);

    for (let j = i + 1; j < recentReports.length; j++) {
      const candidate = recentReports[j];
      if (visited.has(candidate.id)) continue;

      const dist = calculateDistanceKm(
        baseReport.lat,
        baseReport.lng,
        candidate.lat,
        candidate.lng
      );

      // Check disease similarity: matching conditions or shared critical symptoms
      const baseConditions = baseReport.possibleConditions.map(c => c.name.toLowerCase());
      const candidateConditions = candidate.possibleConditions.map(c => c.name.toLowerCase());
      const hasConditionMatch = baseConditions.some(bc =>
        candidateConditions.some(cc => bc.includes('lumpy') && cc.includes('lumpy') || bc.includes('foot') && cc.includes('foot') || bc.includes('hemorrhagic') && cc.includes('hemorrhagic'))
      );

      const sharedSymptoms = baseReport.symptoms.filter(s =>
        candidate.symptoms.includes(s)
      );

      if (dist <= distanceThresholdKm && (hasConditionMatch || sharedSymptoms.length >= 2)) {
        group.push(candidate);
        visited.add(candidate.id);
      }
    }

    if (group.length >= minCasesForHotspot) {
      // Calculate cluster centroid
      const avgLat = group.reduce((acc, r) => acc + r.lat, 0) / group.length;
      const avgLng = group.reduce((acc, r) => acc + r.lng, 0) / group.length;

      // Count dominant symptoms
      const symptomFrequency: Record<string, number> = {};
      group.forEach(r => {
        r.symptoms.forEach(s => {
          symptomFrequency[s] = (symptomFrequency[s] || 0) + 1;
        });
      });

      const dominantSymptoms = Object.entries(symptomFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([sym]) => sym);

      // Identify leading suspected condition
      const conditionFrequency: Record<string, number> = {};
      group.forEach(r => {
        r.possibleConditions.forEach(c => {
          conditionFrequency[c.name] = (conditionFrequency[c.name] || 0) + 1;
        });
      });

      const suspectedCondition = Object.entries(conditionFrequency).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Undifferentiated Cluster';

      // Determine risk level based on average score & high-risk count
      const avgScore = group.reduce((acc, r) => acc + r.riskScore, 0) / group.length;
      const highRiskCount = group.filter(r => r.riskLevel === 'HIGH').length;

      let riskLevel: RiskLevel = 'LOW';
      if (avgScore >= 70 || highRiskCount >= 2) {
        riskLevel = 'HIGH';
      } else if (avgScore >= 40) {
        riskLevel = 'MEDIUM';
      }

      // Dates
      const sortedDates = group.map(r => new Date(r.createdAt).getTime()).sort();
      const firstDetectedDate = new Date(sortedDates[0]).toISOString();
      const lastDetectedDate = new Date(sortedDates[sortedDates.length - 1]).toISOString();

      clusters.push({
        id: `cluster-${baseReport.village.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        clusterName: `${baseReport.village} Hotspot Cluster`,
        village: baseReport.village,
        district: baseReport.district,
        lat: avgLat,
        lng: avgLng,
        caseCount: group.length,
        dominantSymptoms,
        suspectedCondition,
        riskLevel,
        radiusKm: Math.max(distanceThresholdKm, 5),
        firstDetectedDate,
        lastDetectedDate,
        affectedAnimalTags: group.map(r => r.animalTag),
        status: riskLevel === 'HIGH' ? 'ACTIVE_HOTSPOT' : 'MONITORING',
        advisorySent: true,
      });
    }
  }

  return clusters;
}

/**
 * Format Early Warning Alert string
 */
export function generateEarlyWarningAlertText(cluster: OutbreakCluster): string {
  return `⚠ Potential livestock disease hotspot detected in ${cluster.village}, ${cluster.district}. Multiple (${cluster.caseCount}) similar reports of ${cluster.dominantSymptoms.join(', ')} have been recorded nearby within ${cluster.radiusKm} km. Veterinary investigation recommended.`;
}
