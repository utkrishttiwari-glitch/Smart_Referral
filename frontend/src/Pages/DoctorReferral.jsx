import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PortalNav from "../components/PortalNav";

const API_BASE_URL = import.meta.env.VITE_API_URL + "";
const LOCATION = { latitude: 28.6139, longitude: 77.209 };
const serviceVisuals = {
  emergency: "✚",
  trauma: "✦",
  cardiac: "♡",
};

function DoctorReferral({ instantMode = false }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [report, setReport] = useState(null);
  const [form, setForm] = useState({ patientName: "", age: "", gender: "" });
  const [loadingServices, setLoadingServices] = useState(true);
  const [checking, setChecking] = useState(false);
  const [creating, setCreating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [createdReferralId, setCreatedReferralId] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/services`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Unable to load services.");
        setServices(result.data || []);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoadingServices(false));
  }, []);

  function updateForm(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function selectReport(event) {
    const file = event.target.files?.[0];
    if (file) setReport(file);
  }

  function continueFromPatient(event) {
    event.preventDefault();
    if (!form.patientName.trim() || !form.age || !form.gender) {
      setError("Add the patient's name, age, and gender to continue.");
      return;
    }
    setError("");
    setStep(2);
  }

  function continueFromDocument(event) {
    event.preventDefault();
    setError("");
    setStep(3);
  }

  async function checkAvailability(event) {
    event?.preventDefault();
    if (!selectedServiceId) {
      setError("Select the care service the patient needs.");
      return;
    }
    setChecking(true);
    setError("");
    setNotice("");
    setRecommendations([]);
    setSelectedRecommendation(null);
    try {
      const endpoint = instantMode ? "/api/recommendations/instant" : "/api/recommendations";
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requiredServiceId: Number(selectedServiceId), ...LOCATION }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to check hospital availability.");
      const matches = instantMode ? result.recommendations || [] : result.data || [];
      setRecommendations(matches);
      if (instantMode) {
        if (result.canInstantRefer && result.data) {
          setSelectedRecommendation(result.data);
          setNotice("Instant referral ready. The selected hospital passed every current availability check.");
        } else {
          setNotice(result.reason || "Instant referral is not currently available.");
        }
      }
      setStep(4);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setChecking(false);
    }
  }

  async function createReferral() {
    if (!selectedRecommendation?.hospital?.id) {
      setError("Select a recommended hospital first.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const notes = `Age: ${form.age}; Gender: ${form.gender}`;
      const endpoint = instantMode ? "/api/referrals/instant" : "/api/referrals";
      const body = {
        patientName: form.patientName.trim(),
        referringDoctorName: "Doctor portal",
        requiredServiceId: Number(selectedServiceId),
        destinationHospitalId: Number(selectedRecommendation.hospital.id),
        reason: instantMode ? "Emergency instant referral" : "Standard clinical referral",
        notes,
        ...(instantMode ? LOCATION : {}),
      };
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to create referral.");

      const referral = result.data?.referral || result.data;
      if (report && referral?.id) {
        const reportBody = new FormData();
        reportBody.append("report", report);
        await fetch(`${API_BASE_URL}/api/reports/${referral.id}`, { method: "POST", body: reportBody });
      }
      setNotice(instantMode ? "Instant referral created. The receiving hospital has been alerted." : "Referral created and sent to the receiving hospital.");
        setCreatedReferralId(referral?.id || null);
      setStep(5);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCreating(false);
    }
  }

  async function simulateHospitalConfirmation() {
    const candidate = recommendations[0]?.hospital;

    if (!candidate?.id) {
      setError("No hospital is available to confirm yet.");
      return;
    }

    setConfirming(true);
    setError("");
    setNotice("Prototype call simulation: Calling hospital...");

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const response = await fetch(
        `${API_BASE_URL}/api/hospitals/${candidate.id}/confirm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataType: "SERVICE_AVAILABILITY" }),
        }
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Hospital confirmation failed.");
      }

      setNotice("Prototype call simulation complete: Hospital availability confirmed. Rechecking current data...");
      await checkAvailability();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setConfirming(false);
    }
  }

  const selectedService = services.find((service) => String(service.id) === String(selectedServiceId));
  const instantReady = Boolean(selectedRecommendation?.instantEligibility?.canInstantRefer);

  return (
    <div className="sr-page min-h-screen">
      <PortalNav role="doctor" />
      <main className="sr-shell py-8 md:py-12">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><Link to="/doctor" className="text-sm font-semibold text-blue-600">← Doctor dashboard</Link><p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-blue-600">{instantMode ? "Emergency pathway" : "Clinical referral"}</p><h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">{instantMode ? "Instant emergency referral" : "Refer a patient"}</h1><p className="mt-3 text-slate-500">{instantMode ? "Find a highly confident available hospital and refer immediately." : "Provide the essentials and let MedRoute handle the complex matching."}</p></div>{instantMode && <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-800">⚡ Emergency mode</span>}</div>
        <Progress step={step} />
        {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">{error}</div>}
        {notice && <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-semibold text-blue-800">{notice}</div>}

        {step === 1 && <section className="mx-auto mt-8 max-w-3xl rounded-3xl bg-white p-7 shadow-sm md:p-10"><StepHeading eyebrow="Step 01" title="Who needs care?" description="Start with the details needed to coordinate this patient safely." /><form onSubmit={continueFromPatient} className="mt-8 space-y-5"><Field label="Patient name" name="patientName" value={form.patientName} onChange={updateForm} placeholder="Full name" /><div className="grid gap-5 sm:grid-cols-2"><Field label="Age" name="age" value={form.age} onChange={updateForm} placeholder="Age" type="number" /><label className="text-sm font-semibold text-slate-700">Gender<select name="gender" value={form.gender} onChange={updateForm} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-normal outline-none focus:border-blue-500"><option value="">Select gender</option><option>Female</option><option>Male</option><option>Other</option><option>Prefer not to say</option></select></label></div><button className="w-full rounded-2xl bg-blue-600 px-5 py-4 text-sm font-bold text-white hover:bg-blue-700">Continue to document →</button></form></section>}
        {step === 2 && <section className="mx-auto mt-8 max-w-3xl rounded-3xl bg-white p-7 shadow-sm md:p-10"><StepHeading eyebrow="Step 02" title="Upload medical information" description="Attach a document for the receiving team. MedRoute does not claim to analyze the file automatically." /><label htmlFor="doctor-report" className="mt-8 flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-blue-200 bg-blue-50/60 px-6 py-16 text-center hover:border-blue-400"><span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">📄</span><strong className="mt-5 text-lg text-blue-800">{report ? report.name : "Upload medical report"}</strong><span className="mt-2 text-sm text-slate-500">Drag and drop or browse · PDF, JPG, JPEG, PNG</span><input id="doctor-report" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={selectReport} className="hidden" /></label>{report && <div className="mt-4 flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"><span>✓ {report.name} · {formatFileSize(report.size)}</span><button type="button" onClick={() => setReport(null)} className="text-red-600">Remove</button></div>}<div className="mt-8 flex gap-3"><button type="button" onClick={() => setStep(1)} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600">Back</button><button type="button" onClick={continueFromDocument} className="flex-1 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white">Continue to service →</button></div></section>}
        {step === 3 && <section className="mt-8"><StepHeading eyebrow="Step 03" title="What care does this patient need?" description="Choose from the real medical services currently configured in MedRoute." /><div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{services.map((service) => <ServiceCard key={service.id} service={service} selected={String(selectedServiceId) === String(service.id)} onSelect={() => setSelectedServiceId(String(service.id))} />)}</div><div className="mt-8 flex gap-3"><button type="button" onClick={() => setStep(2)} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600">Back</button><button type="button" onClick={checkAvailability} disabled={!selectedServiceId || checking || loadingServices} className="flex-1 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{checking ? "Checking hospitals..." : instantMode ? "Check Instant Availability" : "Find Suitable Hospitals"}</button></div></section>}
        {step === 4 && <RecommendationStep instantMode={instantMode} recommendations={recommendations} selected={selectedRecommendation} setSelected={setSelectedRecommendation} selectedService={selectedService} ready={instantReady} checking={checking} onCreate={createReferral} creating={creating} confirming={confirming} onConfirm={simulateHospitalConfirmation} onBack={() => setStep(3)} onStandard={() => navigate("/doctor/referral")} />}
        {step === 5 && <section className="mx-auto mt-10 max-w-2xl rounded-3xl bg-white p-10 text-center shadow-sm"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">✓</div><h2 className="mt-5 text-3xl font-bold text-slate-900">{instantMode ? "Instant referral sent" : "Referral created"}</h2><p className="mt-3 leading-7 text-slate-500">{notice}</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Link to="/doctor" className="rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white">Back to dashboard</Link>{instantMode && <Link to="/doctor/tracking" className="rounded-full border border-blue-200 px-5 py-3 text-sm font-bold text-blue-700">View tracking</Link>}</div></section>}
        {step === 5 && <section className="mx-auto mt-10 max-w-2xl rounded-3xl bg-white p-10 text-center shadow-sm"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">✓</div><p className="mt-5 text-xs font-bold uppercase tracking-widest text-emerald-600">{instantMode ? "INSTANT EMERGENCY REFERRAL CREATED" : "Referral created"}</p><h2 className="mt-2 text-3xl font-bold text-slate-900">{instantMode ? "Instant referral sent" : "Referral created"}</h2><p className="mt-3 leading-7 text-slate-500">{notice}</p>{createdReferralId && <p className="mt-4 text-sm font-bold text-slate-700">Referral #{createdReferralId}</p>}<div className="mt-7 flex flex-wrap justify-center gap-3"><Link to="/doctor" className="rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white">Back to dashboard</Link>{createdReferralId && <Link to={`/tracking?id=${createdReferralId}`} className="rounded-full border border-blue-200 px-5 py-3 text-sm font-bold text-blue-700">{instantMode ? "Track Emergency" : "Track Referral"}</Link>}</div></section>}
      </main>
    </div>
  );
}

function Progress({ step }) { return <div className="mt-8 grid max-w-3xl grid-cols-4 gap-2">{["Patient", "Document", "Service", "Referral"].map((label, index) => <div key={label} className="flex items-center gap-2"><span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${step > index ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"}`}>{String(index + 1).padStart(2, "0")}</span><span className="hidden text-xs font-bold text-slate-500 sm:inline">{label}</span></div>)}</div>; }
function StepHeading({ eyebrow, title, description }) { return <div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">{eyebrow}</p><h2 className="mt-2 text-2xl font-bold text-slate-900">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></div>; }
function Field({ label, name, value, onChange, placeholder, type = "text" }) { return <label className="block text-sm font-semibold text-slate-700">{label}<input name={name} value={value} onChange={onChange} placeholder={placeholder} type={type} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-normal outline-none focus:border-blue-500 focus:bg-white" /></label>; }
function ServiceCard({ service, selected, onSelect }) { const key = String(service.name || "").toLowerCase(); const visual = key.includes("trauma") ? serviceVisuals.trauma : key.includes("cardio") ? serviceVisuals.cardiac : serviceVisuals.emergency; return <button type="button" onClick={onSelect} className={`overflow-hidden rounded-3xl border-2 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${selected ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-100" : "border-transparent"}`}><div className="relative flex h-36 items-center justify-center bg-[#eaf4ff]"><span className="text-6xl font-black text-[#1769e0]">{visual}</span><span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-blue-700">{selected ? "✓ Selected" : "Select"}</span></div><div className="p-5"><h3 className="text-lg font-bold text-slate-900">{service.name}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{service.description || "Specialist care matched to current hospital availability."}</p></div></button>; }
function RecommendationStep({ instantMode, recommendations, selected, setSelected, selectedService, ready, onCreate, creating, confirming, onConfirm, onBack, onStandard }) { return <section className="mt-8"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Step 04 · {selectedService?.name || "Care"}</p><h2 className="mt-2 text-3xl font-bold text-slate-900">{instantMode ? ready ? "Instant referral ready" : "Instant referral not available" : "Choose a receiving hospital"}</h2><p className="mt-2 text-sm text-slate-500">{instantMode ? "The backend has evaluated live availability, capacity, freshness, and verification." : "Review the current matching signals before sending the referral."}</p></div></div>{instantMode && <div className={`mt-6 rounded-3xl p-6 ${ready ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}><h3 className="text-lg font-bold">{ready ? "✓ INSTANT REFERRAL READY" : "INSTANT REFERRAL NOT AVAILABLE"}</h3>{ready ? <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2"><li>✓ Emergency service available</li><li>✓ Capacity currently available</li><li>✓ Hospital data verified</li><li>✓ Availability updated today</li><li>✓ Very high confidence</li></ul> : <><p className="mt-3 text-sm leading-6">The system cannot safely confirm a suitable hospital for instant referral.</p><button type="button" onClick={onConfirm} disabled={confirming || recommendations.length === 0} className="mt-5 rounded-2xl border border-amber-300 bg-white px-5 py-3 text-sm font-bold text-amber-800 disabled:opacity-50">{confirming ? "Calling hospital..." : "Call Hospital to Confirm"}</button><p className="mt-3 text-xs text-amber-700">Prototype call simulation. No actual phone call is placed.</p></>}</div>}{recommendations.length === 0 ? <div className="mt-6 rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm">No eligible hospitals were found.</div> : <div className="mt-6 grid gap-5 lg:grid-cols-2">{recommendations.map((recommendation, index) => <RecommendationCard key={recommendation.hospital?.id || index} recommendation={recommendation} selected={selected?.hospital?.id === recommendation.hospital?.id} onSelect={() => setSelected(recommendation)} />)}</div>}<div className="mt-8 flex flex-wrap gap-3"><button type="button" onClick={onBack} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600">Back</button>{instantMode && !ready ? <button type="button" onClick={onStandard} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white">Continue with Standard Referral</button> : <button type="button" disabled={!selected || creating || (instantMode && !ready)} onClick={onCreate} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{creating ? "Sending..." : instantMode ? "Refer Instantly" : "Create Standard Referral"}</button>}</div></section>; }
function RecommendationCard({ recommendation, selected, onSelect }) { const hospital = recommendation.hospital || {}; const service = recommendation.service || {}; const freshness = recommendation.freshness || {}; const eligibility = recommendation.instantEligibility || {}; return <button type="button" onClick={onSelect} className={`rounded-3xl border-2 bg-white p-6 text-left shadow-sm ${selected ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"}`}><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-bold text-slate-900">{hospital.name}</h3><p className="mt-1 text-sm text-slate-500">{hospital.city || "Location available"}</p></div>{selected && <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">Selected</span>}</div><div className="mt-5 grid grid-cols-2 gap-3"><Metric label="Service" value={service.isAvailable === false ? "Unavailable" : "Available ✓"} /><Metric label="Capacity" value={service.capacity ?? eligibility.availableBeds ?? "Not listed"} /><Metric label="Distance" value={`${Number(recommendation.distanceKm || 0).toFixed(1)} km`} /><Metric label="Confidence" value={eligibility.instantReferralConfidence || freshness.confidence || "Unknown"} /><Metric label="Score" value={`${Number(recommendation.score?.totalScore || 0).toFixed(0)}/100`} /><Metric label="Data" value={eligibility.dataUpdatedToday ? "Updated today" : freshness.ageMinutes ? `${Math.round(freshness.ageMinutes)} min old` : "Needs review"} /></div><div className="mt-5 space-y-1 text-sm text-slate-600">{(recommendation.reasons || []).slice(0, 4).map((reason) => <p key={reason}>✓ {reason}</p>)}</div></button>; }
function Metric({ label, value }) { return <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-sm font-bold text-slate-800">{value}</p></div>; }
function formatFileSize(bytes) { if (!bytes) return "0 KB"; return `${(bytes / 1024).toFixed(1)} KB`; }
export default DoctorReferral;


