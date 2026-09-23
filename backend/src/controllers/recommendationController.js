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
        message:
          "requiredServiceId, latitude and longitude are required",
      });
    }

    /*
     * Instant mode intentionally includes unavailable hospitals
     * so that the backend can explain why Instant Referral is blocked.
     */
    const recommendations = await findEligibleHospitals({
      ...request,
      includeUnavailable: true,
    });

    /*
     * This function is the backend authority for Instant Referral.
     * The frontend must not determine eligibility itself.
     */
    const recommendation =
      getInstantReferralRecommendation(recommendations);

    const canInstantRefer = Boolean(recommendation);

    /*
     * Only return a failure reason when Instant Referral
     * is actually unavailable.
     *
     * When canInstantRefer === true:
     * reason = null
     *
     * This prevents contradictory responses such as:
     *
     * canInstantRefer: true
     * reason: "Required service is currently unavailable."
     */
    let reason = null;

    if (!canInstantRefer) {
      /*
       * Find the first meaningful eligibility reason.
       */
      const reasonRecommendation = recommendations.find(
        (item) =>
          item?.instantEligibility?.instantReferralReason
      );

      reason =
        reasonRecommendation?.instantEligibility
          ?.instantReferralReason ||
        "Instant referral is not currently available.";
    }

    return res.json({
      success: true,

      // Backend-controlled eligibility
      canInstantRefer,

      // Selected hospital when eligible, otherwise null
      data: recommendation || null,

      // Failure explanation only
      reason,

      // Full ranked recommendation list
      recommendations,
    });
  } catch (error) {
    console.error(
      "Instant recommendation failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to check instant referral availability",
    });
  }
}