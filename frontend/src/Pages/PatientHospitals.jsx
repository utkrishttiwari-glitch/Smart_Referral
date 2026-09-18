import { useEffect, useState } from "react";
import PortalNav from "../components/PortalNav";
import DataConfidenceBadge from "../components/DataConfidenceBadge";
import { useSearchParams } from "react-router-dom";

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
  const [confirming, setConfirming] = useState(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/services`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Unable to load care services.");
        setServices(result.data || []);
        const requestedService = searchParams.get("service");
        if (requestedService) setServiceId(requestedService);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [searchParams]);

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

  async function confirmHospital(recommendation) {
    const hospitalId = recommendation.hospital?.id;
    setConfirming(hospitalId);
    try {
      await fetch(`${API_BASE_URL}/api/hospitals/${hospitalId}/confirm`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataType: "SERVICE_AVAILABILITY" }) });
      if (serviceId) await findHospitals({ preventDefault() {} });
    } finally { setConfirming(null); }
  }

  const selectedService = services.find((service) => String(service.id) === String(serviceId));

  return (
    <div className="sr-page min-h-screen">
      <PortalNav role="patient" />
      <main className="sr-shell sr-search-page py-8 md:py-12">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div className="max-w-3xl"><p className="sr-eyebrow">Patient portal · Find hospital</p><h1 className="sr-title mt-3 text-4xl font-black md:text-5xl">Find the right hospital.</h1><p className="mt-4 leading-7 text-[#6f8198]">Choose the service you need. MedRoute compares current availability, capacity, distance and data confidence.</p></div><span className="sr-live">Live matching</span></div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">{services.slice(0, 3).map((service) => <button key={service.id} type="button" onClick={() => setServiceId(String(service.id))} className={`sr-service-choice ${String(serviceId) === String(service.id) ? "selected" : ""}`}><span>{String(service.name).toLowerCase().includes("card") ? "♡" : String(service.name).toLowerCase().includes("trauma") ? "✦" : "✚"}</span><strong>{service.name}</strong><small>{service.description || "Current hospital availability"}</small></button>)}</div>

        <form onSubmit={findHospitals} className="sr-search-form mt-5"><div><label htmlFor="patient-service" className="text-xs font-black uppercase tracking-wider text-[#8aa0b7]">Required service</label><select id="patient-service" value={serviceId} onChange={(event) => setServiceId(event.target.value)} disabled={loading} className="mt-2 min-h-12 w-full rounded-2xl border border-[#dce8f4] bg-[#f7fbff] px-4 text-sm font-bold text-[#34516f] outline-none focus:border-blue-500 focus:bg-white"><option value="">{loading ? "Loading care services..." : "Select a care service"}</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></div><div><span className="text-xs font-black uppercase tracking-wider text-[#8aa0b7]">Location</span><div className="mt-2 flex min-h-12 items-center rounded-2xl border border-[#dce8f4] bg-[#f7fbff] px-4 text-sm font-bold text-[#34516f]">⌖ Delhi demo location</div></div><button type="submit" disabled={searching || loading} className="sr-btn-primary min-h-12">{searching ? "Finding..." : "Search hospitals"} <span>↗</span></button>{selectedService && <p className="text-xs font-bold text-[#6f8198] sm:col-span-3">Looking for <strong className="text-[#34516f]">{selectedService.name}</strong> near the demo location.</p>}</form>

        {error && <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-800">{error}</div>}
        {chosenHospital && <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800">{chosenHospital.name} is saved as your preferred hospital for this search. No referral was created.</div>}

        {recommendations.length > 0 && <section className="mt-10"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="sr-eyebrow">{selectedService?.name || "Selected care"}</p><h2 className="sr-title mt-2 text-2xl font-black">Recommended hospitals</h2></div><p className="text-sm font-bold text-[#6f8198]">{recommendations.length} options found</p></div><div className="mt-5 grid gap-5 lg:grid-cols-2">{recommendations.map((recommendation, index) => <HospitalCard key={recommendation.hospital?.id || index} recommendation={recommendation} index={index} confirming={confirming === recommendation.hospital?.id} onConfirm={() => confirmHospital(recommendation)} onView={() => setSelectedHospital(recommendation)} onChoose={() => setChosenHospital(recommendation.hospital)} />)}</div></section>}
      </main>
      {selectedHospital && <HospitalDetails recommendation={selectedHospital} onClose={() => setSelectedHospital(null)} onChoose={() => { setChosenHospital(selectedHospital.hospital); setSelectedHospital(null); }} />}
    </div>
  );
}

function HospitalCard({ recommendation, index, confirming, onConfirm, onView, onChoose }) {
  const hospital = recommendation.hospital || {};
  const service = recommendation.service || {};
  const freshness = recommendation.freshness || {};
  const capacity = service.capacity ?? recommendation.capacity ?? "Not listed";
  const confidence = String(freshness.confidence || "Unknown").toUpperCase();
  const reasons = patientReasons(recommendation, capacity);

  return <article className={`sr-recommendation-card ${index === 0 ? "best-match" : ""}`}><div className="sr-hospital-visual"><span>🏥</span>{index === 0 && <b>BEST MATCH</b>}</div><div className="p-6"><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-xl font-black text-[#0c2c59]">{hospital.name || "Hospital"}</h3>{index === 0 && <span className="rounded-full bg-[#eaf4ff] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[#1769e0]">Recommended</span>}</div><p className="mt-1 text-sm text-[#6f8198]">⌖ {hospital.city || "Location available"}{hospital.state ? `, ${hospital.state}` : ""} · {formatNumber(recommendation.distanceKm)} km</p></div></div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><Fact label="Service" value={service.isAvailable === false ? "Unavailable" : "Available"} /><Fact label="Capacity" value={capacity === "Not listed" ? capacity : `${capacity} available`} /><Fact label="Updated" value={freshnessText(freshness)} /><Fact label="Confidence" value={String(freshness.confidence || "Unknown").replaceAll("_", " ")} /></div><p className="mt-4 text-xs font-bold text-[#6f8198]">Data source: {recommendation.serviceDataSource || recommendation.dataSource || "Not recorded"}</p><div className="mt-5"><DataConfidenceBadge recommendation={recommendation} onConfirm={onConfirm} />{confirming && <p className="mt-2 text-xs font-bold text-[#1769e0]">Calling hospital... Prototype call simulation.</p>}</div><div className="mt-5 space-y-2">{reasons.slice(0, 4).map((reason) => <p key={reason} className="text-sm font-semibold text-[#536c86]"><span className="mr-2 font-black text-[#14845c]">✓</span>{reason}</p>)}</div><div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={onView} className="sr-btn-primary">View Hospital <span>→</span></button><button type="button" onClick={onChoose} className="sr-btn-secondary">Choose Hospital</button></div></div></article>;
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


