import { db } from "./src/db.js";
import { findEligibleHospitals } from "./src/services/recommendationService.js";

try {
  const hospitals = await findEligibleHospitals({
    requiredServiceId: 2,
    latitude: 28.6139,
    longitude: 77.2090,
  });

  console.log("\nEligible hospitals:\n");

  for (const item of hospitals) {
    console.log({
  id: item.hospital.id,
  name: item.hospital.name,
  service: item.service.serviceId,
  capacity: item.service.capacity,
  distanceKm: item.distanceKm,
  freshnessScore: item.freshness?.score ?? null,
  freshnessConfidence: item.freshness?.confidence ?? null,
  dataSource: item.dataSource,
  dataVerified: item.dataVerified,
  score: item.score.totalScore,
scoreBreakdown: item.score,
reasons: item.reasons,
});
  }
} catch (error) {
  console.error("Recommendation test failed:", error);
} finally {
  await db.close();
}