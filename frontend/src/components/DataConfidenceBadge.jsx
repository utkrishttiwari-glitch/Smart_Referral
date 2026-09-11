function DataConfidenceBadge({ recommendation, onConfirm }) {
  const eligibility = recommendation?.instantEligibility || {};
  const freshness = recommendation?.freshness || {};
  const confidence = String(eligibility.instantReferralConfidence || (freshness.confidence === "HIGH" && recommendation?.dataVerified ? "VERY_HIGH" : freshness.confidence || "LOW")).replace("VERY_LOW", "LOW").toUpperCase();
  const reliable = confidence === "VERY_HIGH" || confidence === "HIGH";
  const reason = eligibility.instantReferralReason || (reliable ? "Service available • Capacity available • Verified • Updated today" : "Service or bed availability has not been updated recently.");

  return <div className={`rounded-2xl border p-4 ${reliable ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
    <div className={`text-xs font-bold uppercase tracking-widest ${reliable ? "text-emerald-700" : "text-amber-800"}`}>{confidence.replaceAll("_", " ")} CONFIDENCE</div>
    <p className={`mt-2 text-sm ${reliable ? "text-emerald-800" : "text-amber-900"}`}>{reason}</p>
    {!reliable && onConfirm && <button type="button" onClick={onConfirm} className="mt-3 rounded-full bg-white px-4 py-2 text-xs font-bold text-amber-800 shadow-sm">Call Hospital to Confirm</button>}
  </div>;
}

export default DataConfidenceBadge;
