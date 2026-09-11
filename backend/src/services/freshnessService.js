export function calculateFreshness(updatedAt) {
  const updatedTime = new Date(String(updatedAt)).getTime();
  const now = Date.now();

  if (!Number.isFinite(updatedTime)) {
    return {
      ageMinutes: null,
      score: 0,
      confidence: "VERY_LOW",
      isUpdatedToday: false,
    };
  }

  const ageMinutes = (now - updatedTime) / (1000 * 60);
  const updatedDate = new Date(updatedTime);
  const nowDate = new Date(now);
  const isUpdatedToday =
    updatedDate.getFullYear() === nowDate.getFullYear() &&
    updatedDate.getMonth() === nowDate.getMonth() &&
    updatedDate.getDate() === nowDate.getDate();

  let score;
  let confidence;

  if (isUpdatedToday && ageMinutes <= 15) {
    score = 100;
    confidence = "HIGH";
  } else if (isUpdatedToday) {
    score = 80;
    confidence = "MEDIUM";
  } else if (ageMinutes <= 24 * 60) {
    score = 50;
    confidence = "LOW";
  } else {
    score = 20;
    confidence = "LOW";
  }

  return {
    ageMinutes: Number(ageMinutes.toFixed(2)),
    score,
    confidence,
    isUpdatedToday,
  };
}