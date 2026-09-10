const WEIGHTS = {
  service: 0.35,
  capacity: 0.25,
  distance: 0.20,
  freshness: 0.10,
  reliability: 0.10,
};

export function calculateCapacityScore(capacity) {
  if (capacity === null || capacity === undefined) {
    return 50;
  }

  if (capacity >= 10) {
    return 100;
  }

  return capacity * 10;
}

export function calculateDistanceScore(distanceKm) {
  if (distanceKm <= 2) {
    return 100;
  }

  if (distanceKm >= 20) {
    return 0;
  }

  return 100 - ((distanceKm - 2) / 18) * 100;
}

export function calculateFreshnessScore(freshness) {
  return freshness?.score ?? 0;
}

export function calculateReliabilityScore(dataVerified) {
  return dataVerified ? 100 : 50;
}

export function calculateHospitalScore(hospital) {
  const serviceScore = 100;

  const capacityScore = calculateCapacityScore(
    hospital.service.capacity
  );

  const distanceScore = calculateDistanceScore(
    hospital.distanceKm
  );

  const freshnessScore = calculateFreshnessScore(
    hospital.freshness
  );

  const reliabilityScore = calculateReliabilityScore(
    hospital.dataVerified
  );

  const totalScore =
    serviceScore * WEIGHTS.service +
    capacityScore * WEIGHTS.capacity +
    distanceScore * WEIGHTS.distance +
    freshnessScore * WEIGHTS.freshness +
    reliabilityScore * WEIGHTS.reliability;

  return {
    totalScore: Number(totalScore.toFixed(2)),
    serviceScore,
    capacityScore: Number(capacityScore.toFixed(2)),
    distanceScore: Number(distanceScore.toFixed(2)),
    freshnessScore,
    reliabilityScore,
  };
}

export function generateRecommendationReasons(hospital) {
  const reasons = [];

  reasons.push("Required service is available");

  if (hospital.service.capacity > 0) {
    reasons.push(
      `${hospital.service.capacity} capacity units currently available`
    );
  }

  if (hospital.distanceKm <= 5) {
    reasons.push(
      `Hospital is nearby (${hospital.distanceKm} km away)`
    );
  } else {
    reasons.push(
      `Hospital is ${hospital.distanceKm} km away`
    );
  }

  if (hospital.freshness?.confidence === "HIGH") {
    reasons.push("Hospital data is recently updated");
  } else if (hospital.freshness?.confidence === "MEDIUM") {
    reasons.push("Hospital data is moderately fresh");
  } else if (hospital.freshness?.confidence === "LOW") {
    reasons.push("Hospital data may be outdated");
  } else {
    reasons.push("Hospital data is very stale — verify availability");
  }

  if (hospital.dataVerified) {
    reasons.push(`Data source verified (${hospital.dataSource})`);
  } else {
    reasons.push("Data source is not verified");
  }

  return reasons;
}