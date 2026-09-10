export function calculateFreshness(updatedAt) {
  const updatedTime = new Date(String(updatedAt)).getTime();
  const now = Date.now();

  const ageMinutes = (now - updatedTime) / (1000 * 60);

  let score;
  let confidence;

  if (ageMinutes <= 15) {
    score = 100;
    confidence = "HIGH";
  } else if (ageMinutes <= 60) {
    score = 80;
    confidence = "MEDIUM";
  } else if (ageMinutes <= 360) {
    score = 50;
    confidence = "LOW";
  } else {
    score = 20;
    confidence = "VERY_LOW";
  }

  return {
    ageMinutes: Number(ageMinutes.toFixed(2)),
    score,
    confidence,
  };
}