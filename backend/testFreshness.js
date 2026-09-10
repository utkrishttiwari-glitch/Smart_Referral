import { db } from "./src/db.js";
import { calculateFreshness } from "./src/services/freshnessService.js";

const updates = await db.orm.public.HospitalDataUpdate
  .select(
    "id",
    "hospitalId",
    "source",
    "dataType",
    "updatedAt",
    "isVerified"
  )
  .all();

console.log("Records found:", updates.length);

for (const update of updates) {
  const freshness = calculateFreshness(update.updatedAt);

  console.log({
    hospitalId: update.hospitalId,
    source: update.source,
    dataType: update.dataType,
    isVerified: update.isVerified,
    ageMinutes: freshness.ageMinutes,
    freshnessScore: freshness.score,
    confidence: freshness.confidence,
  });
}

await db.close();

console.log("Freshness test completed.");