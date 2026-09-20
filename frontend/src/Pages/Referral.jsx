import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL + "";

function Referral() {
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] =
    useState(false);
  const [creatingReferral, setCreatingReferral] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [createdReferral, setCreatedReferral] = useState(null);

  const [form, setForm] = useState({
    patientName: "",
    requiredServiceId: "",
    latitude: "28.6139",
    longitude: "77.2090",
    reason: "",
    notes: "",
    report: null,
  });

  // --------------------------------------------------
  // LOAD SERVICES
  // --------------------------------------------------

  useEffect(() => {
    async function loadServices() {
      try {
        setLoadingServices(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/api/services`
        );

        if (!response.ok) {
          throw new Error("Failed to load services");
        }

        const result = await response.json();

        console.log("Services response:", result);

        setServices(result.data || []);
      } catch (err) {
        console.error("Failed to load services:", err);

        setError(
          err.message || "Unable to load medical services."
        );
      } finally {
        setLoadingServices(false);
      }
    }

    loadServices();
  }, []);

  // --------------------------------------------------
  // HANDLE INPUT
  // --------------------------------------------------

  function handleChange(event) {
    const { name, value, files } = event.target;

    if (name === "report") {
      setForm((previous) => ({
        ...previous,
        report: files?.[0] || null,
      }));

      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // --------------------------------------------------
  // FIND BEST HOSPITALS
  // --------------------------------------------------

  async function handleFindHospitals(event) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setRecommendations([]);
    setCreatedReferral(null);

    if (!form.patientName.trim()) {
      setError("Please enter the patient's name.");
      return;
    }

    if (!form.requiredServiceId) {
      setError("Please select the required medical service.");
      return;
    }

    if (!form.latitude || !form.longitude) {
      setError("Patient location is required.");
      return;
    }

    try {
      setLoadingRecommendations(true);

      const requestBody = {
        requiredServiceId: Number(form.requiredServiceId),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      };

      console.log(
        "Recommendation request:",
        requestBody
      );

      const response = await fetch(
        `${API_BASE_URL}/api/recommendations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      console.log(
        "Recommendation HTTP status:",
        response.status
      );

      const result = await response.json();

      console.log(
        "Recommendation response:",
        result
      );

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to generate recommendations"
        );
      }

      setRecommendations(result.data || []);

      if (
        !result.data ||
        result.data.length === 0
      ) {
        setError(
          "No eligible hospitals were found for the selected service."
        );
      }
    } catch (err) {
      console.error(
        "Recommendation failed:",
        err
      );

      setError(
        err.message ||
          "Unable to find suitable hospitals."
      );
    } finally {
      setLoadingRecommendations(false);
    }
  }

  // --------------------------------------------------
  // CREATE REFERRAL
  // --------------------------------------------------

  async function handleHospitalSelect(
    recommendation
  ) {
    console.log(
      "1. Selected recommendation:",
      recommendation
    );

    setError("");
    setSuccess("");
    setCreatingReferral(true);

    try {
      console.log(
        "2. Reading hospital information..."
      );

      const hospital =
        recommendation?.hospital;

      const service =
        recommendation?.service;

      console.log(
        "3. Hospital:",
        hospital
      );

      console.log(
        "4. Service:",
        service
      );

      if (!hospital?.id) {
        throw new Error(
          "Selected hospital information is missing."
        );
      }

      const requiredServiceId = Number(
        service?.serviceId ||
          form.requiredServiceId
      );

      console.log(
        "5. Required service ID:",
        requiredServiceId
      );

      console.log(
        "6. Hospital ID:",
        hospital.id
      );

      if (!requiredServiceId) {
        throw new Error(
          "Required service ID is missing."
        );
      }

      const requestBody = {
        patientName:
          form.patientName.trim(),

        referringDoctorName: null,

        requiredServiceId:
          requiredServiceId,

        destinationHospitalId:
          Number(hospital.id),

        urgency: null,

        reason:
          form.reason.trim() || null,

        notes:
          form.notes.trim() || null,
      };

      console.log(
        "7. Creating referral with:",
        requestBody
      );

      const response = await fetch(
        `${API_BASE_URL}/api/referrals`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      console.log(
        "8. Referral HTTP status:",
        response.status
      );

      const result = await response.json();

      console.log(
        "9. Referral creation response:",
        result
      );

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Failed to create referral"
        );
      }

      console.log(
        "10. Referral created successfully:",
        result.data
      );

      setCreatedReferral(
        result.data
      );

      setSuccess(
        "Referral created successfully."
      );

      setTimeout(() => {
        document
          .getElementById(
            "referral-success"
          )
          ?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
      }, 100);
    } catch (err) {
      console.error(
        "11. Referral creation failed:",
        err
      );

      setError(
        err.message ||
          "Unable to create referral."
      );
    } finally {
      console.log(
        "12. Finished referral creation process."
      );

      setCreatingReferral(false);
    }
  }

  // --------------------------------------------------
  // TRACK REFERRAL
  // --------------------------------------------------

  function handleTrackReferral() {
    if (!createdReferral?.id) {
      return;
    }

    navigate(
      `/tracking?id=${createdReferral.id}`
    );
  }

  // --------------------------------------------------
  // SCORE COLOR
  // --------------------------------------------------

  function getScoreClass(score) {
    if (score >= 80) {
      return "bg-green-100 text-green-700";
    }

    if (score >= 60) {
      return "bg-blue-100 text-blue-700";
    }

    if (score >= 40) {
      return "bg-yellow-100 text-yellow-700";
    }

    return "bg-red-100 text-red-700";
  }

  // --------------------------------------------------
  // RESET
  // --------------------------------------------------

  function handleCreateAnother() {
    setCreatedReferral(null);
    setSuccess("");
    setError("");
    setRecommendations([]);
  }

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50">

      {/* HEADER */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">

          <Link
            to="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
              ✚
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight text-blue-900">
                MedRoute
              </h1>

              <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
                Emergency Care Network
              </p>
            </div>
          </Link>

          <Link
            to="/"
            className="text-sm font-semibold text-slate-500 transition hover:text-blue-600"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* MAIN */}

      <main className="mx-auto max-w-7xl px-5 py-10 md:px-8">

        {/* PAGE INTRO */}

        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-blue-600">
            MedRoute
          </p>

          <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Find the right hospital for your patient
          </h2>

          <p className="mt-4 text-base leading-7 text-slate-500">
            Enter the patient's details and required
            service. MedRoute compares eligible
            hospitals using service availability,
            capacity, distance, data freshness, and
            reliability.
          </p>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && !createdReferral && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
            {success}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">

          {/* =========================================
              LEFT SIDE
          ========================================= */}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">

            <div className="mb-7">
              <h3 className="text-xl font-bold text-slate-900">
                Patient & Referral Details
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Provide the basic information needed to
                generate a referral.
              </p>
            </div>

            <form
              onSubmit={handleFindHospitals}
              className="space-y-6"
            >

              {/* PATIENT */}

              <div>
                <label
                  htmlFor="patientName"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Patient Name
                </label>

                <input
                  id="patientName"
                  name="patientName"
                  type="text"
                  value={form.patientName}
                  onChange={handleChange}
                  placeholder="Enter patient name"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* SERVICE */}

              <div>
                <label
                  htmlFor="requiredServiceId"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Required Medical Service
                </label>

                <select
                  id="requiredServiceId"
                  name="requiredServiceId"
                  value={form.requiredServiceId}
                  onChange={handleChange}
                  disabled={loadingServices}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    {loadingServices
                      ? "Loading services..."
                      : "Select required service"}
                  </option>

                  {services.map(
                    (service) => (
                      <option
                        key={service.id}
                        value={service.id}
                      >
                        {service.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* LOCATION */}

              <div>
                <div className="mb-2 flex items-center justify-between">

                  <label className="block text-sm font-semibold text-slate-700">
                    Patient Location
                  </label>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                    Demo Location
                  </span>

                </div>

                <div className="grid gap-3 sm:grid-cols-2">

                  <input
                    name="latitude"
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={handleChange}
                    placeholder="Latitude"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />

                  <input
                    name="longitude"
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={handleChange}
                    placeholder="Longitude"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />

                </div>

                <p className="mt-2 text-xs text-slate-400">
                  These coordinates are currently used
                  as the patient's starting point for
                  hospital distance calculation.
                </p>
              </div>

              {/* REASON */}

              <div>
                <label
                  htmlFor="reason"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Referral Reason
                </label>

                <input
                  id="reason"
                  name="reason"
                  type="text"
                  value={form.reason}
                  onChange={handleChange}
                  placeholder="Example: Emergency cardiac evaluation"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* NOTES */}

              <div>
                <label
                  htmlFor="notes"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Additional Notes
                </label>

                <textarea
                  id="notes"
                  name="notes"
                  rows="4"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Add relevant notes for the receiving hospital..."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* REPORT */}

              <div>
                <label
                  htmlFor="report"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Medical Report
                </label>

                <label
                  htmlFor="report"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 px-5 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50"
                >

                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl shadow-sm">
                    📄
                  </div>

                  <span className="text-sm font-semibold text-blue-700">
                    {form.report
                      ? form.report.name
                      : "Upload medical report"}
                  </span>

                  <span className="mt-1 text-xs text-slate-400">
                    PDF, JPG, PNG
                  </span>

                  <input
                    id="report"
                    name="report"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleChange}
                    className="hidden"
                  />

                </label>

                <p className="mt-2 text-xs text-slate-400">
                  Report storage will be connected in
                  the next step.
                </p>
              </div>

              {/* FIND BUTTON */}

              <button
                type="submit"
                disabled={
                  loadingRecommendations ||
                  loadingServices ||
                  !form.patientName.trim() ||
                  !form.requiredServiceId
                }
                className="w-full rounded-2xl bg-blue-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingRecommendations
                  ? "Finding Best Hospitals..."
                  : "Find Best Hospitals →"}
              </button>

            </form>
          </section>

          {/* =========================================
              RIGHT SIDE
          ========================================= */}

          <section>

            {/* EMPTY */}

            {recommendations.length === 0 &&
              !loadingRecommendations &&
              !createdReferral && (
                <div className="flex min-h-[500px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">

                  <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-3xl">
                    🏥
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">
                    Hospital recommendations
                  </h3>

                  <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                    Complete the referral details and
                    click "Find Best Hospitals". The
                    system will evaluate hospitals using
                    live service and capacity data.
                  </p>

                </div>
              )}

            {/* LOADING */}

            {loadingRecommendations && (
              <div className="flex min-h-[500px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">

                <div className="mb-5 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

                <h3 className="text-xl font-bold text-slate-900">
                  Finding suitable hospitals...
                </h3>

                <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                  Comparing service availability,
                  capacity, distance, freshness, and
                  reliability.
                </p>

              </div>
            )}

            {/* RECOMMENDATIONS */}

            {!loadingRecommendations &&
              recommendations.length > 0 &&
              !createdReferral && (
                <div className="space-y-5">

                  {/* MATCHING HEADER */}

                  <div className="rounded-3xl bg-blue-900 p-6 text-white shadow-lg">

                    <div className="flex items-start justify-between gap-4">

                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
                          Smart Matching
                        </p>

                        <h3 className="mt-2 text-2xl font-bold">
                          Recommended Hospitals
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-blue-100">
                          Ranked using real-time hospital
                          service, capacity, distance,
                          freshness, and reliability.
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white/10 px-4 py-3 text-center">

                        <p className="text-2xl font-bold">
                          {recommendations.length}
                        </p>

                        <p className="text-[10px] uppercase tracking-wider text-blue-200">
                          Matches
                        </p>

                      </div>

                    </div>
                  </div>

                  {/* HOSPITAL CARDS */}

                  {recommendations.map(
                    (
                      recommendation,
                      index
                    ) => {

                      const hospital =
                        recommendation.hospital;

                      const service =
                        recommendation.service;

                      const score =
                        recommendation.score ||
                        {};

                      const freshness =
                        recommendation.freshness ||
                        {};

                      return (
                        <div
                          key={hospital.id}
                          className={`rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
                            index === 0
                              ? "border-blue-300 ring-2 ring-blue-100"
                              : "border-slate-200"
                          }`}
                        >

                          {/* HOSPITAL HEADER */}

                          <div className="flex items-start justify-between gap-4">

                            <div className="flex min-w-0 items-start gap-4">

                              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                                🏥
                              </div>

                              <div className="min-w-0">

                                <div className="flex flex-wrap items-center gap-2">

                                  <h4 className="text-lg font-bold text-slate-900">
                                    {hospital.name}
                                  </h4>

                                  {index === 0 && (
                                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                                      Best Match
                                    </span>
                                  )}

                                </div>

                                <p className="mt-1 text-sm text-slate-500">
                                  {hospital.city}

                                  {hospital.state
                                    ? `, ${hospital.state}`
                                    : ""}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  {hospital.address ||
                                    "Hospital location available"}
                                </p>

                              </div>
                            </div>

                            {/* SCORE */}

                            <div
                              className={`shrink-0 rounded-2xl px-3 py-2 text-center ${getScoreClass(
                                Number(
                                  score.totalScore ||
                                    0
                                )
                              )}`}
                            >

                              <p className="text-xl font-bold">
                                {Number(
                                  score.totalScore ||
                                    0
                                ).toFixed(0)}
                              </p>

                              <p className="text-[9px] font-bold uppercase tracking-wider">
                                Score
                              </p>

                            </div>

                          </div>

                          {/* QUICK INFORMATION */}

                          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">

                            <div className="rounded-2xl bg-slate-50 p-3">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                Distance
                              </p>

                              <p className="mt-1 text-sm font-bold text-slate-800">
                                {
                                  recommendation.distanceKm
                                }{" "}
                                km
                              </p>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-3">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                Capacity
                              </p>

                              <p className="mt-1 text-sm font-bold text-slate-800">
                                {service?.capacity ??
                                  "N/A"}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-3">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                Data Source
                              </p>

                              <p className="mt-1 text-sm font-bold text-slate-800">
                                {recommendation.dataSource ||
                                  "Unknown"}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-3">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                Confidence
                              </p>

                              <p className="mt-1 text-sm font-bold text-slate-800">
                                {freshness.confidence ||
                                  "Unknown"}
                              </p>
                            </div>

                          </div>

                          {/* SCORE BREAKDOWN */}

                          {score && (
                            <div className="mt-5">

                              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                                Score Breakdown
                              </p>

                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">

                                <div className="rounded-xl bg-blue-50 px-3 py-2">
                                  <p className="text-[9px] font-semibold text-blue-500">
                                    Service
                                  </p>

                                  <p className="text-sm font-bold text-blue-800">
                                    {Number(
                                      score.serviceScore ||
                                        0
                                    ).toFixed(0)}
                                  </p>
                                </div>

                                <div className="rounded-xl bg-green-50 px-3 py-2">
                                  <p className="text-[9px] font-semibold text-green-500">
                                    Capacity
                                  </p>

                                  <p className="text-sm font-bold text-green-800">
                                    {Number(
                                      score.capacityScore ||
                                        0
                                    ).toFixed(0)}
                                  </p>
                                </div>

                                <div className="rounded-xl bg-purple-50 px-3 py-2">
                                  <p className="text-[9px] font-semibold text-purple-500">
                                    Distance
                                  </p>

                                  <p className="text-sm font-bold text-purple-800">
                                    {Number(
                                      score.distanceScore ||
                                        0
                                    ).toFixed(0)}
                                  </p>
                                </div>

                                <div className="rounded-xl bg-orange-50 px-3 py-2">
                                  <p className="text-[9px] font-semibold text-orange-500">
                                    Freshness
                                  </p>

                                  <p className="text-sm font-bold text-orange-800">
                                    {Number(
                                      score.freshnessScore ||
                                        0
                                    ).toFixed(0)}
                                  </p>
                                </div>

                                <div className="rounded-xl bg-slate-100 px-3 py-2">
                                  <p className="text-[9px] font-semibold text-slate-500">
                                    Reliability
                                  </p>

                                  <p className="text-sm font-bold text-slate-800">
                                    {Number(
                                      score.reliabilityScore ||
                                        0
                                    ).toFixed(0)}
                                  </p>
                                </div>

                              </div>
                            </div>
                          )}

                          {/* REASONS */}

                          {Array.isArray(
                            recommendation.reasons
                          ) &&
                            recommendation.reasons
                              .length > 0 && (
                              <div className="mt-5 rounded-2xl bg-slate-50 p-4">

                                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                                  Why this hospital?
                                </p>

                                <div className="space-y-2">

                                  {recommendation.reasons.map(
                                    (
                                      reason,
                                      reasonIndex
                                    ) => (
                                      <div
                                        key={
                                          reasonIndex
                                        }
                                        className="flex items-start gap-2 text-sm text-slate-600"
                                      >
                                        <span className="mt-0.5 text-green-500">
                                          ✓
                                        </span>

                                        <span>
                                          {reason}
                                        </span>
                                      </div>
                                    )
                                  )}

                                </div>
                              </div>
                            )}

                          {/* DATA CONFIDENCE */}

                          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white sm:flex-row sm:items-center sm:justify-between">

                            <div>

                              <p className="text-xs font-semibold text-slate-500">
                                Data confidence
                              </p>

                              <p className="mt-1 text-sm font-bold text-slate-800">

                                {freshness.confidence ||
                                  "Unknown"}

                                {freshness.ageMinutes !==
                                  undefined &&
                                  ` • ${Number(
                                    freshness.ageMinutes
                                  ).toFixed(
                                    0
                                  )} min old`}

                              </p>

                            </div>

                            {recommendation.dataVerified ? (
                              <span className="w-fit rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700">
                                ✓ Verified
                              </span>
                            ) : (
                              <span className="w-fit rounded-full bg-yellow-100 px-3 py-1.5 text-xs font-bold text-yellow-700">
                                Verification Needed
                              </span>
                            )}

                          </div>

                          {/* SELECT */}

                          <button
                            type="button"
                            disabled={
                              creatingReferral
                            }
                            onClick={() =>
                              handleHospitalSelect(
                                recommendation
                              )
                            }
                            className="mt-6 w-full rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {creatingReferral
                              ? "Creating Referral..."
                              : "Select Hospital & Create Referral →"}
                          </button>

                        </div>
                      );
                    }
                  )}

                </div>
              )}

            {/* =========================================
                REFERRAL SUCCESS
            ========================================= */}

            {createdReferral && (
              <div
                id="referral-success"
                className="rounded-3xl border border-green-200 bg-white p-7 shadow-lg"
              >

                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
                  ✓
                </div>

                <p className="mt-5 text-xs font-bold uppercase tracking-widest text-green-600">
                  Referral Created
                </p>

                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  Referral successfully created
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  The referral has been created for
                  the selected receiving hospital. You
                  can now track its progress.
                </p>

                {/* DETAILS */}

                <div className="mt-7 space-y-3">

                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="text-sm text-slate-500">
                      Referral ID
                    </span>

                    <span className="text-sm font-bold text-slate-900">
                      #{createdReferral.id}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="text-sm text-slate-500">
                      Patient
                    </span>

                    <span className="text-sm font-bold text-slate-900">
                      {
                        createdReferral.patientName
                      }
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">

                    <span className="text-sm text-slate-500">
                      Status
                    </span>

                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                      {
                        createdReferral.status
                      }
                    </span>

                  </div>

                  <div className="rounded-2xl bg-blue-50 px-4 py-4">

                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">
                      Destination Hospital
                    </p>

                    <p className="mt-1 text-base font-bold text-blue-900">
                      {
                        recommendations.find(
                          (item) =>
                            item.hospital?.id ===
                            createdReferral.destinationHospitalId
                        )?.hospital?.name ||
                        "Selected hospital"
                      }
                    </p>

                  </div>

                </div>

                {/* TRACK */}

                <button
                  type="button"
                  onClick={
                    handleTrackReferral
                  }
                  className="mt-7 w-full rounded-2xl bg-blue-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
                >
                  Track Referral →
                </button>

                {/* CREATE ANOTHER */}

                <button
                  type="button"
                  onClick={
                    handleCreateAnother
                  }
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  Create Another Referral
                </button>

              </div>
            )}

          </section>
        </div>
      </main>
    </div>
  );
}

export default Referral;

