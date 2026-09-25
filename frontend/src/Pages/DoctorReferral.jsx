import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import PortalNav from "../components/PortalNav";
import {
  Stethoscope,
  Activity,
  Search,
  ChevronDown,
  Check,
  AlertCircle,
  FileText,
  ArrowRight,
  Phone,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://smart-referral-backend.onrender.com";

// Default coordinate logic preserved from the existing application
const DEFAULT_LOCATION = { latitude: 28.6139, longitude: 77.209 };

function DoctorReferral({ instantMode = false }) {
  const navigate = useNavigate();

  // Referral Type: Standard (false) vs Emergency/Instant (true). Default state is OFF
  const [isEmergency, setIsEmergency] = useState(Boolean(instantMode));

  // Form states
  const [form, setForm] = useState({
    patientName: "",
    age: "",
    gender: "",
    reason: "",
    notes: "",
  });
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [report, setReport] = useState(null);

  // Healthcare Services loaded from GET /api/services
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);

  // Recommendations state
  const [recommendations, setRecommendations] = useState([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [canInstantRefer, setCanInstantRefer] = useState(false);
  const [instantReason, setInstantReason] = useState("");

  // Process / status states
  const [checking, setChecking] = useState(false);
  const [creating, setCreating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [createdReferralId, setCreatedReferralId] = useState(null);
  const [createdReferralData, setCreatedReferralData] = useState(null);

  // -------------------------------------------------------------------------
  // 1. LOAD SERVICES FROM REAL BACKEND (GET /api/services)
  // -------------------------------------------------------------------------
  useEffect(() => {
    setLoadingServices(true);
    setServicesError("");

    fetch(`${API_BASE_URL}/api/services`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Unable to load healthcare services."
          );
        }
        setServices(result.data || []);
      })
      .catch((requestError) => {
        setServicesError(
          requestError.message || "Unable to load healthcare services."
        );
      })
      .finally(() => {
        setLoadingServices(false);
      });
  }, []);

  // Filtered services for search
  const filteredServices = useMemo(() => {
    if (!serviceSearchQuery.trim()) return services;
    return services.filter((s) =>
      s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())
    );
  }, [services, serviceSearchQuery]);

  const selectedService = services.find(
    (s) => String(s.id) === String(selectedServiceId)
  );

  // -------------------------------------------------------------------------
  // 2. FORM & TOGGLE HANDLERS
  // -------------------------------------------------------------------------
  function updateForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleToggleEmergency(newValue) {
    setIsEmergency(newValue);
    setError("");
    setNotice("");

    // If a service is already selected and recommendations were requested, re-check
    if (selectedServiceId && recommendations.length > 0) {
      checkAvailability(null, newValue);
    }
  }

  function selectReport(event) {
    const file = event.target.files?.[0];
    if (file) setReport(file);
  }

  // -------------------------------------------------------------------------
  // 3. RECOMMENDATION REQUEST (POST /api/recommendations or /instant)
  // -------------------------------------------------------------------------
  async function checkAvailability(event, emergencyModeOverride) {
    event?.preventDefault();

    if (!form.patientName.trim()) {
      setError("Please enter the patient's name.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!selectedServiceId) {
      setError("Please select a healthcare service.");
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
      const endpoint = activeEmergency
        ? "/api/recommendations/instant"
        : "/api/recommendations";

      const payload = {
        requiredServiceId: Number(selectedServiceId),
        latitude: Number(location.latitude),
        longitude: Number(location.longitude),
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
            "Instant referral ready. The receiving hospital passed every real-time availability check."
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

      // Smooth scroll down to recommendations
      setTimeout(() => {
        document
          .getElementById("recommendations-section")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setChecking(false);
    }
  }

  // -------------------------------------------------------------------------
  // 4. CREATE REFERRAL (POST /api/referrals or /instant)
  // -------------------------------------------------------------------------
  async function createReferral() {
    if (!selectedRecommendation?.hospital?.id) {
      setError("Please select a receiving hospital.");
      return;
    }

    if (!selectedServiceId) {
      setError("Please select a healthcare service.");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const formattedNotes = [
        form.age ? `Age: ${form.age}` : "",
        form.gender ? `Gender: ${form.gender}` : "",
        form.notes ? `Clinical notes: ${form.notes}` : "",
      ]
        .filter(Boolean)
        .join("; ");

      const endpoint = isEmergency ? "/api/referrals/instant" : "/api/referrals";

      const body = {
        patientName: form.patientName.trim(),
        referringDoctorName: "Doctor portal",
        requiredServiceId: Number(selectedServiceId),
        destinationHospitalId: Number(selectedRecommendation.hospital.id),
        reason:
          form.reason?.trim() ||
          (isEmergency
            ? "Emergency instant referral"
            : "Standard clinical referral"),
        notes: formattedNotes,
        ...(isEmergency
          ? {
              latitude: Number(location.latitude),
              longitude: Number(location.longitude),
            }
          : {}),
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

      // Upload report document if attached
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
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCreating(false);
    }
  }

  // -------------------------------------------------------------------------
  // 5. CALL HOSPITAL CONFIRMATION SIMULATION (Prototype feature)
  // -------------------------------------------------------------------------
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
        "Prototype call simulation complete: Hospital availability confirmed. Rechecking current signals..."
      );
      await checkAvailability(null, isEmergency);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setConfirming(false);
    }
  }

  // =========================================================================
  // RENDER SUCCESS STATE
  // =========================================================================
  if (submitted) {
    return (
      <div
        className={`sr-page min-h-screen ${
          isEmergency ? "bg-red-50/40" : "bg-slate-50"
        }`}
      >
        <PortalNav role="doctor" />
        <main className="sr-shell py-10 md:py-16">
          <section
            className={`mx-auto max-w-2xl rounded-3xl border p-8 text-center shadow-sm md:p-10 ${
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
              {isEmergency
                ? "EMERGENCY ACTION CONFIRMED"
                : "CLINICAL REFERRAL SUBMITTED"}
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
                <strong className="text-slate-900 font-bold">
                  {form.patientName}
                </strong>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2 text-sm">
                <span className="text-slate-500">Hospital:</span>
                <strong className="text-slate-900 font-bold">
                  {createdReferralData?.destinationHospital?.name ||
                    selectedRecommendation?.hospital?.name ||
                    "Destination Hospital"}
                </strong>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2 text-sm">
                <span className="text-slate-500">Required Service:</span>
                <strong className="text-slate-900 font-bold">
                  {selectedService?.name || "Medical Service"}
                </strong>
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
                ? "The receiving hospital has been notified for immediate arrival. Pre-arrival emergency alert has been dispatched."
                : notice ||
                  "Referral submitted to receiving hospital acceptance queue."}
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
        </main>
      </div>
    );
  }

  // =========================================================================
  // MAIN REFERRAL FORM & RECOMMENDATIONS FLOW
  // =========================================================================
  return (
    <div
      className={`sr-page min-h-screen transition-colors duration-300 ${
        isEmergency ? "bg-red-50/30" : "bg-slate-50"
      }`}
    >
      <PortalNav role="doctor" />

      <main className="sr-shell py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Link
              to="/doctor"
              className={`text-sm font-bold transition-colors ${
                isEmergency
                  ? "text-red-700 hover:text-red-800"
                  : "text-[#1769e0] hover:underline"
              }`}
            >
              ← Doctor Dashboard
            </Link>

            <p
              className={`mt-3 text-xs font-black uppercase tracking-[0.2em] ${
                isEmergency ? "text-red-600" : "text-blue-600"
              }`}
            >
              {isEmergency
                ? "🔴 Emergency Pathway · Alert Mode"
                : "Clinical Referral Coordination"}
            </p>

            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              {isEmergency
                ? "🔴 Instant Emergency Referral"
                : "Create Patient Referral"}
            </h1>

            <p className="mt-1.5 text-sm text-slate-600">
              {isEmergency
                ? "Use only for immediate emergency situations requiring fast-track hospital coordination."
                : "Match required care to real-time hospital signals and specialist capacity."}
            </p>
          </div>

          {/* Mode Pill Indicator */}
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

        {/* Global Notifications & Errors */}
        {error && (
          <div className="mt-6 flex items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
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

        {/* Referral Type Toggle Banner */}
        <div
          className={`mt-6 rounded-3xl border p-5 sm:p-6 transition-all duration-300 ${
            isEmergency
              ? "border-red-200 bg-red-50/90 shadow-sm"
              : "border-slate-200/90 bg-white shadow-sm"
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
                  ? "Instant emergency flow: Backend strictly checks real-time capacity and bed availability."
                  : "Standard flow: Regular patient queue and receiving hospital acceptance process."}
              </p>
            </div>

            {/* Smooth Animated Toggle */}
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

          {/* Emergency Alert Indicators */}
          {isEmergency && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-white/95 p-4 text-xs font-semibold text-red-800">
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">🔴</span>
                <strong className="font-extrabold uppercase tracking-wide text-red-700">
                  EMERGENCY / INSTANT REFERRAL ACTIVE
                </strong>
              </div>
              <p className="mt-1 text-slate-600">
                This referral will use the instant emergency flow. Select the required healthcare service below to check real-time hospital eligibility.
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

        {/* ----------------------------------------------------------------- */}
        {/* REFERRAL FORM: Patient Info -> Required Service -> Reason -> Recommendations */}
        {/* ----------------------------------------------------------------- */}
        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          {/* Main Form Column */}
          <div className="lg:col-span-12">
            <section
              className={`rounded-3xl border p-6 md:p-8 shadow-sm transition-all ${
                isEmergency
                  ? "border-red-200 bg-white"
                  : "border-slate-200/90 bg-white"
              }`}
            >
              <div className="border-b border-slate-100 pb-5">
                <h2 className="text-xl font-extrabold text-slate-900">
                  Patient & Clinical Referral Details
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Enter patient demographics and select the required healthcare service to initiate matching.
                </p>
              </div>

              <form onSubmit={checkAvailability} className="mt-6 space-y-6">
                {/* 1. Patient Information */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                    1. Patient Information
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700">
                        Patient Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="patientName"
                        value={form.patientName}
                        onChange={updateForm}
                        placeholder="Enter patient full name"
                        className={`mt-1.5 w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm outline-none transition ${
                          isEmergency
                            ? "border-red-200 focus:border-red-500 focus:bg-white"
                            : "border-slate-200 focus:border-[#1769e0] focus:bg-white"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700">
                        Age
                      </label>
                      <input
                        type="number"
                        name="age"
                        value={form.age}
                        onChange={updateForm}
                        placeholder="Age"
                        className={`mt-1.5 w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm outline-none transition ${
                          isEmergency
                            ? "border-red-200 focus:border-red-500 focus:bg-white"
                            : "border-slate-200 focus:border-[#1769e0] focus:bg-white"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700">
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={form.gender}
                        onChange={updateForm}
                        className={`mt-1.5 w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm outline-none transition ${
                          isEmergency
                            ? "border-red-200 focus:border-red-500 focus:bg-white"
                            : "border-slate-200 focus:border-[#1769e0] focus:bg-white"
                        }`}
                      >
                        <option value="">Select gender</option>
                        <option>Female</option>
                        <option>Male</option>
                        <option>Other</option>
                        <option>Prefer not to say</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700">
                        Patient GPS Coordinates (Live Dispatch)
                      </label>
                      <div className="mt-1.5 flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={`Lat: ${location.latitude}, Lng: ${location.longitude}`}
                          className="w-full rounded-xl border border-slate-200 bg-slate-100/70 px-4 py-3 text-xs font-mono text-slate-600"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition(
                                (pos) => {
                                  setLocation({
                                    latitude: Number(pos.coords.latitude.toFixed(4)),
                                    longitude: Number(pos.coords.longitude.toFixed(4)),
                                  });
                                  setNotice("Patient GPS location updated from browser.");
                                },
                                () => {
                                  setNotice("Using default Delhi referral coordinates.");
                                }
                              );
                            }
                          }}
                          className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          Detect GPS
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. REQUIRED HEALTHCARE SERVICE (Real data from /api/services) */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      2. Required Healthcare Service <span className="text-red-500">*</span>
                    </h3>
                    {selectedService && (
                      <span className="text-[11px] font-bold text-[#1769e0] bg-blue-50 px-2 py-0.5 rounded-full">
                        Selected: {selectedService.name} (Service ID #{selectedService.id})
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 mb-2">
                    Select the medical specialty or care capability needed by the patient. Hospitals will be evaluated based on this service.
                  </p>

                  {/* Searchable Service Dropdown Selector */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsServiceDropdownOpen((prev) => !prev)}
                      className={`w-full flex items-center justify-between rounded-xl border bg-white px-4 py-3.5 text-left text-sm font-semibold transition shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1769e0]/20 ${
                        isEmergency
                          ? selectedServiceId
                            ? "border-red-400 ring-1 ring-red-200"
                            : "border-red-200 hover:border-red-300"
                          : selectedServiceId
                          ? "border-blue-400 ring-1 ring-blue-200"
                          : "border-slate-300 hover:border-slate-400"
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            isEmergency ? "bg-red-100 text-red-600" : "bg-blue-100 text-[#1769e0]"
                          }`}
                        >
                          <Stethoscope size={18} />
                        </div>

                        {loadingServices ? (
                          <span className="text-slate-400">Loading services...</span>
                        ) : selectedService ? (
                          <div>
                            <span className="block text-slate-900 font-extrabold text-sm">
                              {selectedService.name}
                            </span>
                            <span className="block text-[11px] text-slate-400 font-normal truncate max-w-md">
                              {selectedService.description || "Active medical service"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal">
                            Select required healthcare service...
                          </span>
                        )}
                      </div>

                      <ChevronDown
                        size={18}
                        className={`text-slate-400 transition-transform ${
                          isServiceDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Dropdown Menu Container */}
                    {isServiceDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-2 z-40 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                        {/* Search Input inside Dropdown */}
                        <div className="p-3 border-b border-slate-100 bg-slate-50/80">
                          <div className="relative">
                            <Search
                              size={16}
                              className="absolute left-3.5 top-3 text-slate-400"
                            />
                            <input
                              type="text"
                              placeholder="Search service (e.g. Cardiology, Emergency, ICU, Trauma)..."
                              value={serviceSearchQuery}
                              onChange={(e) => setServiceSearchQuery(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-[#1769e0] focus:ring-1 focus:ring-[#1769e0]"
                              autoFocus
                            />
                          </div>
                        </div>

                        {/* List of Services */}
                        <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                          {loadingServices ? (
                            <div className="py-6 text-center text-xs text-slate-400">
                              Loading services...
                            </div>
                          ) : servicesError ? (
                            <div className="py-6 text-center text-xs text-red-600 font-medium">
                              Unable to load healthcare services.
                            </div>
                          ) : filteredServices.length === 0 ? (
                            <div className="py-6 text-center text-xs text-slate-400">
                              No healthcare services available.
                            </div>
                          ) : (
                            filteredServices.map((service) => {
                              const isSelected =
                                String(service.id) === String(selectedServiceId);
                              return (
                                <button
                                  key={service.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedServiceId(Number(service.id));
                                    setIsServiceDropdownOpen(false);
                                    setError("");
                                  }}
                                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition ${
                                    isSelected
                                      ? "bg-blue-50 text-[#1769e0]"
                                      : "text-slate-800 hover:bg-slate-50"
                                  }`}
                                >
                                  <div className="flex items-start gap-2.5">
                                    <Activity
                                      size={16}
                                      className={`mt-0.5 shrink-0 ${
                                        isSelected ? "text-[#1769e0]" : "text-slate-400"
                                      }`}
                                    />
                                    <div>
                                      <p className="text-xs font-bold text-slate-900">
                                        {service.name}
                                      </p>
                                      <p className="text-[11px] text-slate-500 line-clamp-1">
                                        {service.description || "Care matched to hospital capacity"}
                                      </p>
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <Check size={16} className="text-[#1769e0] shrink-0" />
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Referral Reason & Notes */}
                <div className="pt-2 border-t border-slate-100">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                    3. Referral Reason & Clinical Notes
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700">
                        Referral Reason
                      </label>
                      <input
                        type="text"
                        name="reason"
                        value={form.reason}
                        onChange={updateForm}
                        placeholder={
                          isEmergency
                            ? "e.g. Acute emergency, trauma evaluation"
                            : "e.g. Specialist surgical consultation"
                        }
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#1769e0] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700">
                        Clinical Notes / Vitals
                      </label>
                      <input
                        type="text"
                        name="notes"
                        value={form.notes}
                        onChange={updateForm}
                        placeholder="e.g. BP 130/85, SpO2 96%, Allergies: None"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#1769e0] focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Document / Report Upload */}
                <div className="pt-2 border-t border-slate-100">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                    4. Medical Report (Optional)
                  </h3>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <label
                      htmlFor="doctor-report"
                      className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                    >
                      <FileText size={16} className="text-slate-500" />
                      <span>{report ? "Change Attached Report" : "Attach Medical Report (PDF / Image)"}</span>
                      <input
                        id="doctor-report"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={selectReport}
                        className="hidden"
                      />
                    </label>

                    {report && (
                      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                        <span>✓ {report.name}</span>
                        <button
                          type="button"
                          onClick={() => setReport(null)}
                          className="text-red-600 hover:underline ml-1"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Action: Check Availability & Load Recommendations */}
                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={checking || loadingServices}
                    className={`w-full rounded-2xl py-4 px-6 text-sm font-extrabold text-white shadow-sm transition disabled:opacity-50 ${
                      isEmergency
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-[#1769e0] hover:bg-[#1255b8]"
                    }`}
                  >
                    {checking
                      ? "Evaluating Hospital Recommendations..."
                      : isEmergency
                      ? "Check Instant Emergency Availability →"
                      : "Find Hospital Recommendations →"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* RECOMMENDATIONS & HOSPITAL SELECTION SECTION */}
        {/* ----------------------------------------------------------------- */}
        {recommendations.length > 0 && (
          <section
            id="recommendations-section"
            className="mt-10 scroll-mt-6"
          >
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <p
                  className={`text-xs font-black uppercase tracking-widest ${
                    isEmergency ? "text-red-600" : "text-blue-600"
                  }`}
                >
                  Step 02 · Recommended Facilities
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                  {isEmergency
                    ? canInstantRefer
                      ? "Instant Emergency Referral Ready"
                      : "Instant Referral Unavailable"
                    : `Hospitals Matching: ${selectedService?.name || "Service"}`}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {isEmergency
                    ? "Backend has evaluated live service availability, bed capacity, data freshness, and verification."
                    : "Select a hospital below to complete standard clinical referral."}
                </p>
              </div>
            </div>

            {/* Emergency Eligibility Banner */}
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
                      The receiving hospital passed all backend checks for immediate emergency admission.
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 rounded-2xl border border-red-100 bg-white p-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Hospital
                        </span>
                        <p className="text-base font-extrabold text-slate-900">
                          {selectedRecommendation?.hospital?.name || "Recommended Hospital"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {selectedRecommendation?.hospital?.city || "Location confirmed"}
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
                          {selectedRecommendation?.instantEligibility?.instantReferralConfidence ||
                            selectedRecommendation?.freshness?.confidence ||
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
                          {selectedRecommendation?.instantEligibility?.availableBeds
                            ? `(${selectedRecommendation.instantEligibility.availableBeds} beds available)`
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

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={creating}
                        onClick={createReferral}
                        className="rounded-2xl bg-red-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-sm hover:bg-red-700 disabled:opacity-50 transition"
                      >
                        {creating
                          ? "Preparing instant referral..."
                          : "Confirm Instant Referral"}
                      </button>
                    </div>
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
                        onClick={() => handleToggleEmergency(false)}
                        className="rounded-2xl bg-[#1769e0] px-5 py-3 text-xs font-extrabold text-white shadow-sm hover:bg-[#1255b8] transition"
                      >
                        Continue with Standard Referral →
                      </button>
                      <button
                        type="button"
                        onClick={simulateHospitalConfirmation}
                        disabled={confirming || recommendations.length === 0}
                        className="rounded-2xl border border-amber-300 bg-white px-5 py-3 text-xs font-bold text-amber-800 hover:bg-amber-50 disabled:opacity-50"
                      >
                        {confirming ? "Calling hospital..." : "Call Hospital to Confirm"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Ranked Hospitals List */}
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {recommendations.map((recommendation, index) => (
                <RecommendationCard
                  key={recommendation.hospital?.id || index}
                  recommendation={recommendation}
                  selected={
                    selectedRecommendation?.hospital?.id ===
                    recommendation.hospital?.id
                  }
                  onSelect={() => setSelectedRecommendation(recommendation)}
                  isEmergency={isEmergency}
                />
              ))}
            </div>

            {/* Standard Referral Final Action */}
            {!isEmergency && (
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Ready to Refer: {selectedRecommendation?.hospital?.name || "Select a Hospital"}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Patient will be referred for: {selectedService?.name}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!selectedRecommendation || creating}
                  onClick={createReferral}
                  className="rounded-2xl bg-[#1769e0] px-6 py-3.5 text-sm font-extrabold text-white shadow-sm hover:bg-[#1255b8] disabled:opacity-50 transition"
                >
                  {creating ? "Submitting Referral..." : "Create Standard Referral"}
                </button>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

/* ==========================================================================
   RECOMMENDATION CARD COMPONENT
   ========================================================================== */
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
          label="Data Freshness"
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

export default DoctorReferral;
