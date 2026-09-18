import { db } from "../db.js";
import { calculateDistanceKm } from "./distanceService.js";
import { calculateFreshness } from "./freshnessService.js";
import {
  calculateHospitalScore,
  generateRecommendationReasons,
} from "./scoringService.js";

function isSameCalendarDay(updatedAt, now = new Date()) {
  if (!updatedAt) {
    return false;
  }

  const updated = new Date(String(updatedAt));

  return (
    updated.getFullYear() === now.getFullYear() &&
    updated.getMonth() === now.getMonth() &&
    updated.getDate() === now.getDate()
  );
}

function buildInstantEligibility({
  hospital,
  service,
  beds,
  freshness,
  dataVerified,
  dataUpdatedAt,
  serviceFreshness,
  serviceDataVerified,
  serviceDataUpdatedAt,
  score,
  now = new Date(),
}) {
  const serviceAvailable =
    service?.isAvailable === true;

  const availableBeds = (beds || []).reduce(
    (total, bed) => total + Number(bed.availableBeds || 0),
    0
  );

  const capacityAvailable =
    availableBeds > 0 &&
    (service?.capacity === null ||
      service?.capacity === undefined ||
      service.capacity > 0);

  const bedsUpdatedToday =
    (beds || []).length > 0 &&
    beds.every((bed) => isSameCalendarDay(bed.updatedAt, now));

  const dataUpdatedToday =
    isSameCalendarDay(dataUpdatedAt, now) &&
    bedsUpdatedToday;

  const serviceDataUpdatedToday = isSameCalendarDay(
    serviceDataUpdatedAt,
    now
  );

  const veryHighConfidence =
    hospital?.isActive === true &&
    serviceAvailable &&
    capacityAvailable &&
    dataUpdatedToday &&
    serviceDataUpdatedToday &&
    dataVerified === true &&
    serviceDataVerified === true &&
    freshness?.confidence === "HIGH" &&
    serviceFreshness?.confidence === "HIGH" &&
    Number(score?.totalScore || 0) >= 80;

  let reason = "Instant referral is not currently available.";

  if (!hospital?.isActive) {
    reason = "The hospital is not currently active.";
  } else if (!serviceAvailable) {
    reason = "Required service is currently unavailable.";
  } else if (!capacityAvailable) {
    reason = "No current capacity is available.";
  } else if (!dataUpdatedToday) {
    reason = "Hospital availability data was not updated today.";
  } else if (!serviceDataUpdatedToday || serviceFreshness?.confidence !== "HIGH" || !serviceDataVerified) {
    reason = "Required service availability could not be confidently verified.";
  } else if (!dataVerified || freshness?.confidence !== "HIGH") {
    reason = "Hospital availability could not be confidently verified.";
  } else if (Number(score?.totalScore || 0) < 80) {
    reason = "The recommendation does not meet the very-high-confidence rule.";
  }

  return {
    canInstantRefer: veryHighConfidence,
    instantReferralConfidence: veryHighConfidence
      ? "VERY_HIGH"
      : "NOT_AVAILABLE",
    instantReferralReason: veryHighConfidence ? null : reason,
    serviceAvailable,
    capacityAvailable,
    availableBeds,
    hospitalActive: hospital?.isActive === true,
    dataVerified: dataVerified === true,
    dataUpdatedToday,
    lastUpdatedAt: dataUpdatedAt || null,
  };
}

export async function findEligibleHospitals({
  requiredServiceId,
  latitude,
  longitude,
  includeUnavailable = false,
}) {
  const hospitalServices = await db.orm.public.HospitalService
    .where({
      serviceId: requiredServiceId,
    })
    .select(
      "id",
      "hospitalId",
      "serviceId",
      "isAvailable",
      "capacity",
      "notes",
      "updatedAt"
    )
    .all();

  const eligibleHospitals = [];

  for (const hospitalService of hospitalServices) {
    const hospital = await db.orm.public.Hospital.first({
      id: hospitalService.hospitalId,
      isActive: true,
    });

    if (!hospital) {
      continue;
    }

    if (!includeUnavailable && !hospitalService.isAvailable) {
      continue;
    }

    if (
      !includeUnavailable &&
      hospitalService.capacity !== null &&
      hospitalService.capacity <= 0
    ) {
      continue;
    }

    const distanceKm = calculateDistanceKm(
      latitude,
      longitude,
      hospital.latitude,
      hospital.longitude
    );

    const dataUpdates =
      await db.orm.public.HospitalDataUpdate
        .where({
          hospitalId: hospital.id,
          dataType: "BED_AVAILABILITY",
        })
        .select(
          "id",
          "source",
          "dataType",
          "updatedAt",
          "isVerified"
        )
        .all();

    const dataUpdate = dataUpdates.sort(
      (a, b) =>
        new Date(String(b.updatedAt)).getTime() -
        new Date(String(a.updatedAt)).getTime()
    )[0] || null;

    const beds = await db.orm.public.BedAvailability
      .where({ hospitalId: hospital.id })
      .select(
        "id",
        "bedType",
        "totalBeds",
        "availableBeds",
        "updatedAt"
      )
      .all();

    const serviceDataUpdates = await db.orm.public.HospitalDataUpdate
      .where({
        hospitalId: hospital.id,
        dataType: "SERVICE_AVAILABILITY",
      })
      .select(
        "id",
        "source",
        "dataType",
        "updatedAt",
        "isVerified"
      )
      .all();

    const serviceDataUpdate = serviceDataUpdates.sort(
      (a, b) =>
        new Date(String(b.updatedAt)).getTime() -
        new Date(String(a.updatedAt)).getTime()
    )[0] || null;

    let freshness = null;

    if (dataUpdate) {
      freshness = calculateFreshness(dataUpdate.updatedAt);
    }

    const serviceFreshness = calculateFreshness(
      serviceDataUpdate?.updatedAt || hospitalService.updatedAt
    );

   const recommendationData = {
  hospital,
  service: hospitalService,
  distanceKm: Number(distanceKm.toFixed(2)),
  freshness,
  dataSource: dataUpdate?.source ?? null,
  dataVerified: dataUpdate?.isVerified ?? false,
  serviceFreshness,
  serviceDataSource: serviceDataUpdate?.source ?? null,
  serviceDataVerified: serviceDataUpdate?.isVerified ?? false,
  serviceDataUpdatedAt: serviceDataUpdate?.updatedAt ?? hospitalService.updatedAt,
  beds,
  dataUpdatedAt: dataUpdate?.updatedAt ?? null,
};

const score = calculateHospitalScore(recommendationData);

const reasons = generateRecommendationReasons(recommendationData);

eligibleHospitals.push({
  ...recommendationData,
  score,
  reasons,
  instantEligibility: buildInstantEligibility({
    ...recommendationData,
    score,
  }),
});
  }

  return eligibleHospitals.sort(
  (a, b) => b.score.totalScore - a.score.totalScore
);
}

export function getInstantReferralRecommendation(recommendations) {
  const eligible = recommendations.filter(
    (recommendation) =>
      recommendation.instantEligibility?.canInstantRefer === true
  );

  return eligible[0] || null;
}