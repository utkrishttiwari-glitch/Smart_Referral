import { useEffect, useState } from "react";
import PortalNav from "../components/PortalNav";

const API_BASE_URL = "http://localhost:5000";

function PatientHospitals() {
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [chosenHospital, setChosenHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/services`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Unable to load care services.");
        setServices(result.data || []);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  async function findHospitals(event) {
    event.preventDefault();
    if (!serviceId) {
      setError("Choose the kind of care you need first.");
      return;
    }

    setSearching(true);
    setError("");
    setRecommendations([]);
    try {
      const response = await fetch(`${API_BASE_URL}/api/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredServiceId: Number(serviceId),
          latitude: 28.6139,
          longitude: 77.209,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to find suitable hospitals.");
      setRecommendations(result.data || []);
      if (!result.data?.length) setError("No suitable hospitals were found for this service right now.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSearching(false);
    }
  }

  const selectedService = services.find((service) => String(service.id) === String(serviceId));

  return (
    <div className="min-h-screen bg-slate-50">
      <PortalNav role="patient" />
      <main className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        <div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">Hospital recommendation</p><h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">Find care that fits your needs.</h1><p className="mt-4 leading-7 text-slate-500">Choose a service and SmartReferral will compare real hospital availability, capacity, distance, and data freshness.</p></div>

        <form onSubmit={findHospitals} className="mt-8 rounded-3xl bg-white p-6 shadow-sm md:p-8"><label htmlFor="patient-service" className="text-lg font-bold text-slate-900">What kind of care do you need?</label><div className="mt-4 flex flex-col gap-3 sm:flex-row"><select id="patient-service" value={serviceId} onChange={(event) => setServiceId(event.target.value)} disabled={loading} className="min-h-12 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500 focus:bg-white"><option value="">{loading ? "Loading care services..." : "Select a care service"}</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select><button type="submit" disabled={searching || loading} className="min-h-12 rounded-2xl bg-blue-600 px-6 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{searching ? "Finding hospitals..." : "Find Hospitals"}</button></div>{selectedService && <p className="mt-3 text-sm text-slate-500">Looking for <strong className="text-slate-700">{selectedService.name}</strong> near the demo location.</p>}</form>

        {error && <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-800">{error}</div>}
        {chosenHospital && <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800">{chosenHospital.name} is saved as your preferred hospital for this search. No referral was created.</div>}

        {recommendations.length > 0 && <section className="mt-10"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-bold uppercase tracking-widest text-slate-400">{selectedService?.name || "Selected care"}</p><h2 className="mt-2 text-2xl font-bold text-slate-900">Recommended hospitals</h2></div><p className="text-sm text-slate-500">{recommendations.length} options found</p></div><div className="mt-5 grid gap-5 lg:grid-cols-2">{recommendations.map((recommendation, index) => <HospitalCard key={recommendation.hospital?.id || index} recommendation={recommendation} index={index} onView={() => setSelectedHospital(recommendation)} onChoose={() => setChosenHospital(recommendation.hospital)} />)}</div></section>}
      </main>
      {selectedHospital && <HospitalDetails recommendation={selectedHospital} onClose={() => setSelectedHospital(null)} onChoose={() => { setChosenHospital(selectedHospital.hospital); setSelectedHospital(null); }} />}
    </div>
  );
}

function HospitalCard({ recommendation, index, onView, onChoose }) {
  const hospital = recommendation.hospital || {};
  const service = recommendation.service || {};
  const freshness = recommendation.freshness || {};
  const capacity = service.capacity ?? recommendation.capacity ?? "Not listed";
  const confidence = String(freshness.confidence || "Unknown").toUpperCase();
  const reasons = patientReasons(recommendation, capacity);

  return <article className={`rounded-3xl border bg-white p-6 shadow-sm ${index === 0 ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200"}`}><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-xl font-bold text-slate-900">{hospital.name || "Hospital"}</h3>{index === 0 && <span className="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700">Recommended</span>}</div><p className="mt-1 text-sm text-slate-500">{hospital.city || "Location available"}{hospital.state ? `, ${hospital.state}` : ""}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${confidence === "HIGH" ? "bg-emerald-50 text-emerald-700" : confidence === "MEDIUM" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{confidence}</span></div><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4"><Fact label="Service" value="Available" /><Fact label="Beds" value={capacity} /><Fact label="Distance" value={`${formatNumber(recommendation.distanceKm)} km`} /><Fact label="Data" value={freshnessText(freshness)} /></div><div className="mt-5 space-y-2">{reasons.map((reason) => <p key={reason} className="text-sm text-slate-600"><span className="mr-2 font-bold text-emerald-600">✓</span>{reason}</p>)}</div>{isStale(freshness) && <p className="mt-5 rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">Availability may have changed. Please confirm before visiting.</p>}<div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={onView} className="rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">View Hospital</button><button type="button" onClick={onChoose} className="rounded-full border border-blue-200 px-5 py-3 text-sm font-bold text-blue-700 hover:bg-blue-50">Choose Hospital</button></div></article>;
}

function HospitalDetails({ recommendation, onClose, onChoose }) {
  const hospital = recommendation.hospital || {};
  const service = recommendation.service || {};
  const freshness = recommendation.freshness || {};
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 p-5" role="dialog" aria-modal="true"><div className="mx-auto mt-10 max-w-2xl rounded-3xl bg-white p-7 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-widest text-blue-600">Hospital details</p><h2 className="mt-2 text-3xl font-bold text-slate-900">{hospital.name || "Hospital"}</h2><p className="mt-2 text-slate-500">{hospital.city || "Location available"}{hospital.address ? ` · ${hospital.address}` : ""}</p></div><button type="button" onClick={onClose} className="text-2xl text-slate-400" aria-label="Close details">×</button></div><div className="mt-7 grid gap-4 sm:grid-cols-2"><Fact label="Phone" value={hospital.phone || "Contact information not listed"} /><Fact label="Required service" value={`${service.name || "Care service"} · Available`} /><Fact label="Beds" value={service.capacity ?? recommendation.capacity ?? "Not listed"} /><Fact label="Distance" value={`${formatNumber(recommendation.distanceKm)} km`} /><Fact label="Availability" value={freshnessText(freshness)} /><Fact label="Confidence" value={String(freshness.confidence || "Unknown").toUpperCase()} /></div><div className="mt-8 flex flex-wrap gap-3"><button type="button" onClick={onChoose} className="rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white">Choose This Hospital</button><button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600">Close</button></div></div></div>;
}

function Fact({ label, value }) { return <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-sm font-bold text-slate-800">{value}</p></div>; }
function formatNumber(value) { const number = Number(value); return Number.isFinite(number) ? number.toFixed(1) : "—"; }
function freshnessText(freshness) { const age = Number(freshness.ageMinutes); if (freshness.confidence === "HIGH" && Number.isFinite(age)) return `${Math.round(age)} min ago`; if (freshness.confidence === "HIGH") return "Confirmed recently"; if (freshness.confidence === "MEDIUM") return "Updated earlier"; if (freshness.confidence === "LOW") return "Needs confirmation"; return "Not available"; }
function isStale(freshness) { return String(freshness.confidence || "").toUpperCase() === "LOW" || Number(freshness.ageMinutes) > 60; }
function patientReasons(recommendation, capacity) { const reasons = []; if (recommendation.service?.available !== false) reasons.push("Required care is available"); if (capacity !== "Not listed" && Number(capacity) > 0) reasons.push("Beds currently available"); if (Number(recommendation.distanceKm) <= 10) reasons.push("Nearby"); if (recommendation.freshness?.confidence === "HIGH") reasons.push("Hospital data was updated recently"); return reasons.length ? reasons : ["Matches your selected care needs"]; }
export default PatientHospitals;
