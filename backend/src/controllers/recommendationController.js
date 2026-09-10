import {
  findEligibleHospitals,
  getInstantReferralRecommendation,
} from "../services/recommendationService.js";

function parseRequest(body) {
  const {
    requiredServiceId,
    latitude,
    longitude,
  } = body;

  if (
    !Number.isInteger(Number(requiredServiceId)) ||
    !Number.isFinite(Number(latitude)) ||
    !Number.isFinite(Number(longitude))
  ) {
    return null;
  }

  return {
    requiredServiceId: Number(requiredServiceId),
    latitude: Number(latitude),
    longitude: Number(longitude),
  };
}

export async function getRecommendations(req, res) {
  try {
    const request = parseRequest(req.body);

    if (!request) {
      return res.status(400).json({
        success: false,
        message:
          "requiredServiceId, latitude and longitude are required",
      });
    }

    const recommendations = await findEligibleHospitals({
      ...request,
    });

    return res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error("Recommendation failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate recommendations",
    });
  }
} 

export async function getInstantRecommendation(req, res) {
  try {
    const request = parseRequest(req.body);

    if (!request) {
      return res.status(400).json({
        success: false,
        message: "requiredServiceId, latitude and longitude are required",
      });
    }

    const recommendations = await findEligibleHospitals({
      ...request,
      includeUnavailable: true,
    });
    const recommendation = getInstantReferralRecommendation(
      recommendations
    );

    return res.json({
      success: true,
      canInstantRefer: Boolean(recommendation),
      data: recommendation,
      reason:
        recommendation?.instantEligibility?.instantReferralReason ||
        recommendations[0]?.instantEligibility?.instantReferralReason ||
        "Required service is currently unavailable.",
      recommendations,
    });
  } catch (error) {
    console.error("Instant recommendation failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check instant referral availability",
    });
  }
}