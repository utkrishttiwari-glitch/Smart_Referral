import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PortalNav from "../components/PortalNav";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://smart-referral-backend.onrender.com";
const LOCATION = { latitude: 28.6139, longitude: 77.209 };

const serviceVisuals = {
  emergency: "✚",
  trauma: "✦",
  cardiac: "♡",
};

function DoctorReferral({ instantMode = false }) {
  const navigate = useNavigate();

  // Mode: Standard (false) vs Emergency/Instant (true). Default state is OFF (unless route is instantMode)
  const [isEmergency, setIsEmergency] = useState(Boolean(instantMode));

  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [canInstantRefer, setCanInstantRefer] = useState(false);
  const [instantReason, setInstantReason] = useState("");

  const [report, setReport] = useState(null);
  const [form, setForm] = useState({ patientName: "", age: "", gender: "" });

  const [loadingServices, setLoadingServices] = useState(true);
  const [checking, setChecking] = useState(false);
  const [creating, setCreating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [createdReferralId, setCreatedReferralId] = useState(null);
  const [createdReferralData, setCreatedReferralData] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/services`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to load services.");
        }
        setServices(result.data || []);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoadingServices(false));
  }, []);

  function handleToggleEmergency(newValue) {
    setIsEmergency(newValue);
    setError("");
    setNotice("");
    // If currently on recommendations step and a service is selected, re-check availability with the new mode
    if (step === 4 && selectedServiceId) {
      checkAvailability(null, newValue);
    }
  }

  function updateForm(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
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

  async function checkAvailability(event, emergencyModeOverride) {
    event?.preventDefault();
    if (!selectedServiceId) {
      setError("Select the care service the patient needs.");
      return;
    }

    const activeEmergency =
      typeof emergencyModeOverride === "boolean"
        ? emergencyModeOverride
        : isEmergency;

    setChecking(true);
    setError("");
    setNotice("");
    setRecommendations([]);
    setSelectedRecommendation(null);
    setCanInstantRefer(false);
    setInstantReason("");

    try {
      // Backend authority: calls the respective recommendation endpoint
      const endpoint = activeEmergency
        ? "/api/recommendations/instant"
        : "/api/recommendations";

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredServiceId: Number(selectedServiceId),
          ...LOCATION,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to check hospital availability."
        );
      }

      if (activeEmergency) {
        const matches = result.recommendations || [];
        setRecommendations(matches);
        setCanInstantRefer(Boolean(result.canInstantRefer));
        setInstantReason(result.reason || "");

        if (result.canInstantRefer && result.data) {
          setSelectedRecommendation(result.data);
          setNotice(
            "Instant referral ready. The selected hospital passed every current availability check."
          );
        } else {
          setNotice(
            result.reason || "Instant referral is not currently available."
          );
        }
      } else {
        const matches = result.data || [];
        setRecommendations(matches);
        if (matches.length > 0) {
          setSelectedRecommendation(matches[0]);
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
      const endpoint = isEmergency ? "/api/referrals/instant" : "/api/referrals";
      const body = {
        patientName: form.patientName.trim(),
        referringDoctorName: "Doctor portal",
        requiredServiceId: Number(selectedServiceId),
        destinationHospitalId: Number(selectedRecommendation.hospital.id),
        reason: isEmergency
          ? "Emergency instant referral"
          : "Standard clinical referral",
        notes,
        ...(isEmergency ? LOCATION : {}),
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to create referral.");
      }

      const referral = result.data?.referral || result.data;
      setCreatedReferralData(referral);

      if (report && referral?.id) {
        const reportBody = new FormData();
        reportBody.append("report", report);
        await fetch(`${API_BASE_URL}/api/reports/${referral.id}`, {
          method: "POST",
          body: reportBody,
        });
      }

      setNotice(
        isEmergency
          ? "Instant referral created successfully. The receiving hospital has been notified for immediate arrival."
          : "Referral created successfully and sent to receiving hospital queue."
      );
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

      setNotice(
        "Prototype call simulation complete: Hospital availability confirmed. Rechecking current data..."
      );
      await checkAvailability(null, isEmergency);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setConfirming(false);
    }
  }

  const selectedService = services.find(
    (service) => String(service.id) === String(selectedServiceId)
  );

  return (
    <div
      className={`sr-page min-h-screen transition-colors duration-300 ${
        isEmergency ? "bg-red-50/30" : "bg-slate-50"
      }`}
    >
      <PortalNav role="doctor" />

      <main className="sr-shell py-8 md:py-12">
        {/* Top Header */}
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <Link
              to="/doctor"
              className={`text-sm font-bold transition-colors ${
                isEmergency ? "text-red-700 hover:text-red-800" : "text-[#1769e0] hover:underline"
              }`}
            >
              ← Doctor Dashboard
            </Link>

            <p
              className={`mt-4 text-xs font-black uppercase tracking-[0.2em] ${
                isEmergency ? "text-red-600" : "text-blue-600"
              }`}
            >
              {isEmergency ? "🔴 Emergency Pathway · Alert Mode" : "Clinical Referral"}
            </p>

            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              {isEmergency ? "🔴 Instant Emergency Referral" : "Create Referral"}
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              {isEmergency
                ? "Use only for immediate emergency situations."
                : "Provide the essentials and let Medi-Referral handle the complex matching."}
            </p>
          </div>

          {/* Mode Indicator Tag */}
          <div className="flex items-center gap-2">
            {isEmergency ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-100 px-4 py-2 text-xs font-black text-red-800">
                <span className="h-2 w-2 rounded-full bg-red-600 animate-ping"></span>
                ALERT MODE: INSTANT REFERRAL
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black text-blue-700">
                STANDARD MODE
              </span>
            )}
          </div>
        </div>

        {/* Emergency / Instant Referral Toggle Box (visible across steps 1-4) */}
        {step < 5 && (
          <div
            className={`mt-6 rounded-2xl border p-4 sm:p-5 transition-all duration-300 ${
              isEmergency
                ? "border-red-200 bg-red-50/90 shadow-sm"
                : "border-slate-200 bg-white shadow-sm"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Referral Type
                  </span>
                  {isEmergency ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-extrabold text-red-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse"></span>
                      EMERGENCY / INSTANT REFERRAL
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-extrabold text-[#1769e0]">
                      STANDARD REFERRAL
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  {isEmergency
                    ? "Emergency flow: Backend will strictly evaluate live capacity, data freshness, and verification."
                    : "Standard flow: Normal patient queue and hospital acceptance workflow."}
                </p>
              </div>

              {/* The Interactive Switch with smooth transition */}
              <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
                <span
                  className={`text-xs font-bold transition-colors ${
                    !isEmergency ? "text-[#1769e0]" : "text-slate-400"
                  }`}
                >
                  Standard
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isEmergency}
                  onClick={() => handleToggleEmergency(!isEmergency)}
                  className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isEmergency
                      ? "bg-red-600 focus:ring-red-500"
                      : "bg-slate-300 hover:bg-slate-400 focus:ring-blue-500"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      isEmergency ? "translate-x-7" : "translate-x-0"
                    }`}
                  />
                </button>
                <span
                  className={`text-xs font-bold transition-colors ${
                    isEmergency ? "text-red-700" : "text-slate-400"
                  }`}
                >
                  Emergency / Instant
                </span>
              </div>
            </div>

            {/* Alert banner when Emergency mode is ON */}
            {isEmergency && (
              <div className="mt-4 rounded-xl border border-red-200 bg-white/95 p-3.5 text-xs font-semibold text-red-800 transition-all">
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">🔴</span>
                  <strong className="font-extrabold uppercase tracking-wide text-red-700">
                    EMERGENCY / INSTANT REFERRAL
                  </strong>
                </div>
                <p className="mt-1 text-slate-600">
                  This referral will use the instant emergency flow. The receiving hospital will be alerted for immediate arrival upon confirmation.
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider">
                  <span className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-red-700">
                    🔴 EMERGENCY MODE
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-red-700">
                    ⚡ INSTANT REFERRAL
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-red-700">
                    🚨 Immediate Hospital Notification
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-red-700">
                    🚑 Pre-arrival Preparation
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progress Stepper */}
        {step < 5 && <Progress step={step} isEmergency={isEmergency} />}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}
        {notice && (
          <div
            className={`mt-6 rounded-2xl border px-5 py-4 text-sm font-semibold ${
              isEmergency
                ? "border-red-200 bg-red-50/90 text-red-800"
                : "border-blue-200 bg-blue-50 text-blue-800"
            }`}
          >
            {notice}
          </div>
        )}

        {/* STEP 1: Patient Information */}
        {step === 1 && (
          <section
            className={`mx-auto mt-6 max-w-3xl rounded-3xl border p-7 shadow-sm transition-all md:p-10 ${
              isEmergency
                ? "border-red-200 bg-white"
                : "border-slate-200/80 bg-white"
            }`}
          >
            <StepHeading
              eyebrow="Step 01"
              title="Who needs care?"
              description="Start with the patient details needed to coordinate this referral safely."
              isEmergency={isEmergency}
            />
            <form onSubmit={continueFromPatient} className="mt-8 space-y-5">
              <Field
                label="Patient name"
                name="patientName"
                value={form.patientName}
                onChange={updateForm}
                placeholder="Full name"
                isEmergency={isEmergency}
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Age"
                  name="age"
                  value={form.age}
                  onChange={updateForm}
                  placeholder="Age"
                  type="number"
                  isEmergency={isEmergency}
                />
                <label className="text-sm font-semibold text-slate-700">
                  Gender
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={updateForm}
                    className={`mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3.5 font-normal outline-none transition ${
                      isEmergency
                        ? "border-red-200 focus:border-red-500 focus:bg-white"
                        : "border-slate-200 focus:border-blue-500 focus:bg-white"
                    }`}
                  >
                    <option value="">Select gender</option>
                    <option>Female</option>
                    <option>Male</option>
                    <option>Other</option>
                    <option>Prefer not to say</option>
                  </select>
                </label>
              </div>
              <button
                type="submit"
                className={`w-full rounded-2xl px-5 py-4 text-sm font-bold text-white shadow-sm transition ${
                  isEmergency
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-[#1769e0] hover:bg-[#1255b8]"
                }`}
              >
                Continue to document →
              </button>
            </form>
          </section>
        )}

        {/* STEP 2: Upload Medical Report */}
        {step === 2 && (
          <section
            className={`mx-auto mt-6 max-w-3xl rounded-3xl border p-7 shadow-sm transition-all md:p-10 ${
              isEmergency
                ? "border-red-200 bg-white"
                : "border-slate-200/80 bg-white"
            }`}
          >
            <StepHeading
              eyebrow="Step 02"
              title="Upload medical information"
              description="Attach clinical documents or lab reports for the receiving team."
              isEmergency={isEmergency}
            />
            <label
              htmlFor="doctor-report"
              className={`mt-8 flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-14 text-center transition ${
                isEmergency
                  ? "border-red-200 bg-red-50/40 hover:border-red-400"
                  : "border-blue-200 bg-blue-50/50 hover:border-blue-400"
              }`}
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                📄
              </span>
              <strong
                className={`mt-4 text-base font-bold ${
                  isEmergency ? "text-red-800" : "text-blue-800"
                }`}
              >
                {report ? report.name : "Upload medical report (optional)"}
              </strong>
              <span className="mt-1 text-xs text-slate-500">
                Drag and drop or browse · PDF, JPG, JPEG, PNG
              </span>
              <input
                id="doctor-report"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={selectReport}
                className="hidden"
              />
            </label>

            {report && (
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                <span>
                  ✓ {report.name} · {formatFileSize(report.size)}
                </span>
                <button
                  type="button"
                  onClick={() => setReport(null)}
                  className="text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            )}

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={continueFromDocument}
                className={`flex-1 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-sm transition ${
                  isEmergency
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-[#1769e0] hover:bg-[#1255b8]"
                }`}
              >
                Continue to service →
              </button>
            </div>
          </section>
        )}

        {/* STEP 3: Required Service Selection */}
        {step === 3 && (
          <section className="mt-6">
            <StepHeading
              eyebrow="Step 03"
              title="What care does this patient need?"
              description="Choose from the medical services currently configured in Medi-Referral."
              isEmergency={isEmergency}
            />
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  selected={String(selectedServiceId) === String(service.id)}
                  onSelect={() => setSelectedServiceId(String(service.id))}
                  isEmergency={isEmergency}
                />
              ))}
            </div>
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={(e) => checkAvailability(e, isEmergency)}
                disabled={!selectedServiceId || checking || loadingServices}
                className={`flex-1 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-sm transition disabled:opacity-50 ${
                  isEmergency
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-[#1769e0] hover:bg-[#1255b8]"
                }`}
              >
                {checking
                  ? "Evaluating Hospital Signals..."
                  : isEmergency
                  ? "Check Instant Emergency Availability →"
                  : "Find Suitable Hospitals →"}
              </button>
            </div>
          </section>
        )}

        {/* STEP 4: Recommendations & Eligibility Check */}
        {step === 4 && (
          <RecommendationStep
            isEmergency={isEmergency}
            recommendations={recommendations}
            selected={selectedRecommendation}
            setSelected={setSelectedRecommendation}
            selectedService={selectedService}
            canInstantRefer={canInstantRefer}
            instantReason={instantReason}
            checking={checking}
            onCreate={createReferral}
            creating={creating}
            confirming={confirming}
            onConfirm={simulateHospitalConfirmation}
            onBack={() => setStep(3)}
            onContinueStandard={() => handleToggleEmergency(false)}
          />
        )}

        {/* STEP 5: Success State */}
        {step === 5 && (
          <SuccessStep
            isEmergency={isEmergency}
            patientName={form.patientName}
            hospitalName={
              createdReferralData?.destinationHospital?.name ||
              selectedRecommendation?.hospital?.name ||
              "Destination Hospital"
            }
            serviceName={selectedService?.name || "Medical Service"}
            createdReferralId={createdReferralId}
            notice={notice}
          />
        )}
      </main>
    </div>
  );
}

/* ==========================================================================
   SUBCOMPONENTS
   ========================================================================== */

function Progress({ step, isEmergency }) {
  const steps = ["Patient", "Document", "Service", "Referral"];
  return (
    <div className="mt-6 grid max-w-3xl grid-cols-4 gap-2">
      {steps.map((label, index) => {
        const isCurrentOrPassed = step > index;
        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-colors ${
                isCurrentOrPassed
                  ? isEmergency
                    ? "bg-red-600 text-white"
                    : "bg-[#1769e0] text-white"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="hidden text-xs font-bold text-slate-500 sm:inline">
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StepHeading({ eyebrow, title, description, isEmergency }) {
  return (
    <div>
      <p
        className={`text-xs font-black uppercase tracking-widest ${
          isEmergency ? "text-red-600" : "text-blue-600"
        }`}
      >
        {eyebrow}
      </p>
      <h2 className="mt-1 text-2xl font-extrabold text-slate-900">{title}</h2>
      <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  isEmergency,
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        className={`mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3.5 font-normal outline-none transition ${
          isEmergency
            ? "border-red-200 focus:border-red-500 focus:bg-white"
            : "border-slate-200 focus:border-blue-500 focus:bg-white"
        }`}
      />
    </label>
  );
}

function ServiceCard({ service, selected, onSelect, isEmergency }) {
  const key = String(service.name || "").toLowerCase();
  const visual = key.includes("trauma")
    ? serviceVisuals.trauma
    : key.includes("cardio")
    ? serviceVisuals.cardiac
    : serviceVisuals.emergency;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`overflow-hidden rounded-3xl border-2 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
        selected
          ? isEmergency
            ? "border-red-500 bg-red-50/40 ring-2 ring-red-100"
            : "border-blue-500 bg-blue-50/40 ring-2 ring-blue-100"
          : isEmergency
          ? "border-red-100/70"
          : "border-slate-200/80"
      }`}
    >
      <div
        className={`relative flex h-32 items-center justify-center ${
          isEmergency ? "bg-red-50/80" : "bg-[#eaf4ff]"
        }`}
      >
        <span
          className={`text-5xl font-black ${
            isEmergency ? "text-red-600" : "text-[#1769e0]"
          }`}
        >
          {visual}
        </span>
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
            selected
              ? isEmergency
                ? "bg-red-600 text-white"
                : "bg-[#1769e0] text-white"
              : "bg-white/90 text-slate-700 shadow-sm"
          }`}
        >
          {selected ? "✓ Selected" : "Select"}
        </span>
      </div>
      <div className="p-5">
        <h3 className="text-base font-bold text-slate-900">{service.name}</h3>
        <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {service.description ||
            "Specialist care matched to current hospital availability."}
        </p>
      </div>
    </button>
  );
}

function RecommendationStep({
  isEmergency,
  recommendations,
  selected,
  setSelected,
  selectedService,
  canInstantRefer,
  instantReason,
  onCreate,
  creating,
  confirming,
  onConfirm,
  onBack,
  onContinueStandard,
}) {
  return (
    <section className="mt-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p
            className={`text-xs font-black uppercase tracking-widest ${
              isEmergency ? "text-red-600" : "text-blue-600"
            }`}
          >
            Step 04 · {selectedService?.name || "Care"}
          </p>
          <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
            {isEmergency
              ? canInstantRefer
                ? "Instant Emergency Referral Ready"
                : "Instant Referral Unavailable"
              : "Choose Receiving Hospital"}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {isEmergency
              ? "Backend has evaluated live availability, capacity, freshness, and verification."
              : "Review matching signals before sending the clinical referral."}
          </p>
        </div>
      </div>

      {/* Emergency Mode: Backend Authority Eligibility Banner */}
      {isEmergency && (
        <div className="mt-6">
          {canInstantRefer ? (
            /* ELIGIBLE */
            <div className="rounded-3xl border border-red-200 bg-red-50/80 p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔴</span>
                <h3 className="text-lg font-black uppercase tracking-wide text-red-800">
                  INSTANT REFERRAL AVAILABLE
                </h3>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                The receiving hospital passed all backend checks for immediate patient admission.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 rounded-2xl border border-red-100 bg-white p-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Hospital
                  </span>
                  <p className="text-base font-extrabold text-slate-900">
                    {selected?.hospital?.name || "Recommended Hospital"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selected?.hospital?.city || "Location confirmed"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Service
                  </span>
                  <p className="text-base font-extrabold text-slate-900">
                    {selectedService?.name || "Emergency Care"}
                  </p>
                  <p className="text-xs text-slate-500">Service confirmed active</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Confidence
                  </span>
                  <p className="text-sm font-extrabold text-emerald-700">
                    {selected?.instantEligibility?.instantReferralConfidence ||
                      selected?.freshness?.confidence ||
                      "Very High"}{" "}
                    ✓
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Availability & Capacity
                  </span>
                  <p className="text-sm font-extrabold text-emerald-700">
                    Available ✓{" "}
                    {selected?.instantEligibility?.availableBeds
                      ? `(${selected.instantEligibility.availableBeds} beds available)`
                      : ""}
                  </p>
                </div>
              </div>

              <ul className="mt-4 grid gap-2 text-xs font-bold sm:grid-cols-2">
                <li className="flex items-center gap-1.5 text-emerald-700">
                  <span>✓</span> Emergency service available
                </li>
                <li className="flex items-center gap-1.5 text-emerald-700">
                  <span>✓</span> Capacity currently available
                </li>
                <li className="flex items-center gap-1.5 text-emerald-700">
                  <span>✓</span> Hospital data verified
                </li>
                <li className="flex items-center gap-1.5 text-emerald-700">
                  <span>✓</span> Availability updated today
                </li>
              </ul>
            </div>
          ) : (
            /* NOT ELIGIBLE */
            <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠</span>
                <h3 className="text-lg font-black uppercase tracking-wide text-amber-900">
                  INSTANT REFERRAL NOT AVAILABLE
                </h3>
              </div>
              <div className="mt-3 rounded-2xl border border-amber-200 bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                  Backend Evaluation
                </p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {instantReason ||
                    "The system cannot safely confirm a suitable hospital for instant referral."}
                </p>
                <p className="mt-1.5 text-xs text-slate-500">
                  Instant referrals require verified bed capacity and data freshness updated today.
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onContinueStandard}
                  className="rounded-2xl bg-[#1769e0] px-5 py-3 text-xs font-extrabold text-white shadow-sm hover:bg-[#1255b8] transition"
                >
                  Continue with Standard Referral →
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={confirming || recommendations.length === 0}
                  className="rounded-2xl border border-amber-300 bg-white px-5 py-3 text-xs font-bold text-amber-800 hover:bg-amber-50 disabled:opacity-50"
                >
                  {confirming ? "Calling hospital..." : "Call Hospital to Confirm"}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-amber-700">
                Prototype call simulation. No actual phone call is placed.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Ranked Hospital Recommendations List */}
      {recommendations.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm border border-slate-200/80">
          No eligible hospitals were found matching the required criteria.
        </div>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {recommendations.map((recommendation, index) => (
            <RecommendationCard
              key={recommendation.hospital?.id || index}
              recommendation={recommendation}
              selected={selected?.hospital?.id === recommendation.hospital?.id}
              onSelect={() => setSelected(recommendation)}
              isEmergency={isEmergency}
            />
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
        >
          Back
        </button>

        {isEmergency ? (
          canInstantRefer ? (
            <button
              type="button"
              disabled={!selected || creating}
              onClick={onCreate}
              className="rounded-2xl bg-red-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-sm hover:bg-red-700 disabled:opacity-50 transition"
            >
              {creating ? "Preparing instant referral..." : "Confirm Instant Referral"}
            </button>
          ) : (
            <button
              type="button"
              onClick={onContinueStandard}
              className="rounded-2xl bg-[#1769e0] px-6 py-3.5 text-sm font-extrabold text-white shadow-sm hover:bg-[#1255b8] transition"
            >
              Continue with Standard Referral
            </button>
          )
        ) : (
          <button
            type="button"
            disabled={!selected || creating}
            onClick={onCreate}
            className="rounded-2xl bg-[#1769e0] px-6 py-3.5 text-sm font-extrabold text-white shadow-sm hover:bg-[#1255b8] disabled:opacity-50 transition"
          >
            {creating ? "Sending..." : "Create Standard Referral"}
          </button>
        )}
      </div>
    </section>
  );
}

function RecommendationCard({
  recommendation,
  selected,
  onSelect,
  isEmergency,
}) {
  const hospital = recommendation.hospital || {};
  const service = recommendation.service || {};
  const freshness = recommendation.freshness || {};
  const eligibility = recommendation.instantEligibility || {};

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-3xl border-2 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        selected
          ? isEmergency
            ? "border-red-500 ring-2 ring-red-100"
            : "border-blue-500 ring-2 ring-blue-100"
          : isEmergency
          ? "border-red-100/70"
          : "border-slate-200/80"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{hospital.name}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {hospital.city || "Location available"}
          </p>
        </div>
        {selected && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              isEmergency
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            Selected
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Metric
          label="Service"
          value={
            service.isAvailable === false ? "Unavailable" : "Available ✓"
          }
        />
        <Metric
          label="Capacity"
          value={service.capacity ?? eligibility.availableBeds ?? "Not listed"}
        />
        <Metric
          label="Distance"
          value={`${Number(recommendation.distanceKm || 0).toFixed(1)} km`}
        />
        <Metric
          label="Confidence"
          value={
            eligibility.instantReferralConfidence ||
            freshness.confidence ||
            "Unknown"
          }
        />
        <Metric
          label="Score"
          value={`${Number(recommendation.score?.totalScore || 0).toFixed(0)}/100`}
        />
        <Metric
          label="Data"
          value={
            eligibility.dataUpdatedToday
              ? "Updated today"
              : freshness.ageMinutes
              ? `${Math.round(freshness.ageMinutes)} min old`
              : "Needs review"
          }
        />
      </div>

      <div className="mt-4 space-y-1 text-xs text-slate-600">
        {(recommendation.reasons || []).slice(0, 3).map((reason) => (
          <p key={reason} className="line-clamp-1">
            ✓ {reason}
          </p>
        ))}
      </div>
    </button>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 text-xs font-bold text-slate-800 truncate">{value}</p>
    </div>
  );
}

function SuccessStep({
  isEmergency,
  patientName,
  hospitalName,
  serviceName,
  createdReferralId,
  notice,
}) {
  return (
    <section
      className={`mx-auto mt-8 max-w-2xl rounded-3xl border p-8 text-center shadow-sm md:p-10 ${
        isEmergency
          ? "border-red-200 bg-white"
          : "border-slate-200 bg-white"
      }`}
    >
      <div
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-2xl font-black ${
          isEmergency
            ? "bg-red-100 text-red-600"
            : "bg-emerald-100 text-emerald-700"
        }`}
      >
        ✓
      </div>

      <p
        className={`mt-4 text-xs font-black uppercase tracking-widest ${
          isEmergency ? "text-red-600" : "text-emerald-600"
        }`}
      >
        {isEmergency ? "EMERGENCY ACTION CONFIRMED" : "CLINICAL REFERRAL SUBMITTED"}
      </p>

      <h2 className="mt-1 text-3xl font-extrabold text-slate-900">
        {isEmergency ? "INSTANT REFERRAL CREATED" : "REFERRAL CREATED"}
      </h2>

      <div
        className={`mt-6 rounded-2xl p-5 text-left border space-y-2.5 ${
          isEmergency
            ? "border-red-100 bg-red-50/50"
            : "border-slate-100 bg-slate-50"
        }`}
      >
        <div className="flex justify-between border-b border-slate-200/60 pb-2 text-sm">
          <span className="text-slate-500">Patient:</span>
          <strong className="text-slate-900 font-bold">{patientName}</strong>
        </div>
        <div className="flex justify-between border-b border-slate-200/60 pb-2 text-sm">
          <span className="text-slate-500">Hospital:</span>
          <strong className="text-slate-900 font-bold">{hospitalName}</strong>
        </div>
        <div className="flex justify-between border-b border-slate-200/60 pb-2 text-sm">
          <span className="text-slate-500">Service:</span>
          <strong className="text-slate-900 font-bold">{serviceName}</strong>
        </div>
        {createdReferralId && (
          <div className="flex justify-between pt-1 text-sm">
            <span className="text-slate-500">Referral ID:</span>
            <span
              className={`font-mono font-bold ${
                isEmergency ? "text-red-700" : "text-blue-700"
              }`}
            >
              #{createdReferralId}
            </span>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slate-600">
        {isEmergency
          ? "Hospital has been notified for immediate arrival. Pre-arrival emergency alert has been sent."
          : notice || "Referral submitted to receiving hospital acceptance queue."}
      </p>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link
          to="/doctor/referrals"
          className={`rounded-full px-6 py-3 text-sm font-bold text-white shadow-sm transition ${
            isEmergency
              ? "bg-red-600 hover:bg-red-700"
              : "bg-[#1769e0] hover:bg-[#1255b8]"
          }`}
        >
          View Referrals
        </Link>
        {createdReferralId && (
          <Link
            to={`/live-tracking/${createdReferralId}`}
            className={`rounded-full border px-6 py-3 text-sm font-bold transition ${
              isEmergency
                ? "border-red-300 bg-white text-red-700 hover:bg-red-50"
                : "border-blue-300 bg-white text-[#1769e0] hover:bg-blue-50"
            }`}
          >
            Live Tracking
          </Link>
        )}
        <Link
          to="/doctor"
          className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
        >
          Doctor Dashboard
        </Link>
      </div>
    </section>
  );
}

function formatFileSize(bytes) {
  if (!bytes) return "0 KB";
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default DoctorReferral;
