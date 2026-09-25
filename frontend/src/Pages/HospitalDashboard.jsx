import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_API_URL + "";

/*
 * Demo hospital: Metro General Hospital = ID 2
 */
const HOSPITAL_ID = 2;

function HospitalDashboard() {
  const [hospital, setHospital] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [notification, setNotification] = useState(null);
  const [dataStatus, setDataStatus] = useState([]);
  const [services, setServices] = useState([]);
  const [beds, setBeds] = useState([]);
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [editingService, setEditingService] = useState(null);
  const [serviceSaving, setServiceSaving] = useState(false);

  // Feature modal / workflow states
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [serviceSearch, setServiceSearch] = useState("");
  const [capacityAdjustments, setCapacityAdjustments] = useState({});
  const [updatingServiceId, setUpdatingServiceId] = useState(null);

  /*
   * =======================================================
   * LOAD DATA
   * =======================================================
   */
  const loadReferrals = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${BACKEND_URL}/api/referrals/hospital/${HOSPITAL_ID}`
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load referrals.");
      }

      setHospital(result.hospital);
      setReferrals(result.data || []);

      const statusResponse = await fetch(
        `${BACKEND_URL}/api/hospitals/${HOSPITAL_ID}/data-status`
      );
      const statusResult = await statusResponse.json();
      if (statusResponse.ok && statusResult.success) {
        setDataStatus(statusResult.data || []);
      }

      const servicesResponse = await fetch(
        `${BACKEND_URL}/api/hospitals/${HOSPITAL_ID}/services`
      );
      const servicesResult = await servicesResponse.json();
      if (!servicesResponse.ok || !servicesResult.success) {
        throw new Error(servicesResult.message || "Failed to load services.");
      }
      setServices(servicesResult.data || []);

      const bedsResponse = await fetch(
        `${BACKEND_URL}/api/hospitals/${HOSPITAL_ID}/beds`
      );
      const bedsResult = await bedsResponse.json();
      if (bedsResponse.ok && bedsResult.success) {
        setBeds(bedsResult.data || []);
      }

      setError("");
    } catch (err) {
      console.error("Hospital dashboard error:", err);
      setError(err.message || "Failed to load hospital operations data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReferrals();
  }, [loadReferrals]);

  /*
   * =======================================================
   * SOCKET.IO REALTIME EVENTS
   * =======================================================
   */
  useEffect(() => {
    const socket = io(BACKEND_URL);

    socket.on("connect", () => {
      console.log("Hospital dashboard connected:", socket.id);
    });

    socket.on("referral-status-updated", (data) => {
      console.log("Referral status updated:", data);
      loadReferrals();
      setNotification({
        type: "info",
        message: `Referral #${data.referralId} is now ${formatStatus(data.status)}.`,
      });
    });

    socket.on("pre-arrival-alert", (alert) => {
      console.log("Pre-arrival alert:", alert);
      loadReferrals();
      setNotification({
        type: "success",
        message: alert.message || "New pre-arrival alert received.",
      });
    });

    socket.on("hospital-service-updated", (updatedService) => {
      if (Number(updatedService.hospitalId) !== HOSPITAL_ID) return;
      setServices((current) =>
        current.map((service) =>
          Number(service.serviceId) === Number(updatedService.serviceId)
            ? { ...service, ...updatedService, serviceName: service.serviceName }
            : service
        )
      );
      setNotification({
        type: "info",
        message: `${updatedService.serviceName || "Service"} availability updated.`,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [loadReferrals]);

  /*
   * =======================================================
   * ACCEPT / REJECT REFERRALS
   * =======================================================
   */
  async function updateStatus(referralId, status) {
    try {
      setActionLoading(`${referralId}-${status}`);

      const response = await fetch(
        `${BACKEND_URL}/api/referrals/${referralId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            message:
              status === "ACCEPTED"
                ? "Hospital has accepted the referral and is preparing for the patient's arrival."
                : "Hospital has rejected the referral.",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update referral.");
      }

      setReferrals((current) =>
        current.map((referral) =>
          referral.id === referralId ? { ...referral, status } : referral
        )
      );

      if (status === "ACCEPTED") {
        setNotification({
          type: "success",
          message: `Referral #${referralId} accepted. Pre-arrival alert sent.`,
        });
      } else {
        setNotification({
          type: "warning",
          message: `Referral #${referralId} rejected.`,
        });
      }

      await loadReferrals();
    } catch (err) {
      console.error("Status update error:", err);
      setNotification({
        type: "error",
        message: err.message || "Failed to update referral.",
      });
    } finally {
      setActionLoading(null);
    }
  }

  /*
   * =======================================================
   * UPDATE SERVICE AVAILABILITY & CAPACITY
   * =======================================================
   */
  async function saveService(serviceId, values) {
    setServiceSaving(true);
    setUpdatingServiceId(serviceId);
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/hospitals/${HOSPITAL_ID}/services/${serviceId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to update service availability.");
      }
      setServices((current) =>
        current.map((service) =>
          Number(service.serviceId) === Number(serviceId)
            ? {
                ...service,
                ...result.data,
                dataUpdatedAt: result.data.updatedAt,
                source: "MANUAL",
                isVerified: false,
                confidence: "LOW",
                isUpdatedToday: true,
                ageMinutes: 0,
              }
            : service
        )
      );
      setEditingService(null);
      setNotification({
        type: "success",
        message: "Service availability and capacity updated successfully.",
      });
    } catch (err) {
      setNotification({
        type: "error",
        message: err.message || "Unable to update service availability.",
      });
    } finally {
      setServiceSaving(false);
      setUpdatingServiceId(null);
    }
  }

  /*
   * =======================================================
   * UPDATE BED CAPACITY
   * =======================================================
   */
  async function saveBed(bedType, values) {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/hospitals/${HOSPITAL_ID}/beds/${bedType}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update bed capacity.");
      }
      setBeds((current) =>
        current.map((b) => (b.bedType === bedType ? { ...b, ...values } : b))
      );
      setNotification({
        type: "success",
        message: `${bedType} bed capacity updated.`,
      });
    } catch (err) {
      setNotification({
        type: "error",
        message: err.message || "Failed to update bed capacity.",
      });
    }
  }

  // Stepper helper for Manual Updates
  function getAdjustedCapacity(serviceId, currentCapacity) {
    if (capacityAdjustments[serviceId] !== undefined) {
      return capacityAdjustments[serviceId];
    }
    return Number(currentCapacity ?? 0);
  }

  function handleCapacityStep(serviceId, currentCapacity, delta) {
    const cur = getAdjustedCapacity(serviceId, currentCapacity);
    const updated = Math.max(0, cur + delta);
    setCapacityAdjustments((prev) => ({
      ...prev,
      [serviceId]: updated,
    }));
  }

  function handleQuickUpdate(service) {
    const cap = getAdjustedCapacity(service.serviceId, service.capacity);
    saveService(service.serviceId, {
      isAvailable: service.isAvailable,
      capacity: cap,
      notes: service.notes || "",
    });
  }

  /*
   * =======================================================
   * DERIVED DATA & CALCULATIONS (REAL BACKEND DATA ONLY)
   * =======================================================
   */
  const incomingReferrals = useMemo(
    () =>
      referrals.filter(
        (r) =>
          r.status === "CREATED" ||
          r.status === "SENT" ||
          r.status === "RECEIVED"
      ),
    [referrals]
  );

  const incomingCount = incomingReferrals.length;

  const acceptedCount = useMemo(
    () => referrals.filter((r) => r.status === "ACCEPTED").length,
    [referrals]
  );

  const transitCount = useMemo(
    () =>
      referrals.filter(
        (r) =>
          r.status === "AMBULANCE_ASSIGNED" || r.status === "IN_TRANSIT"
      ).length,
    [referrals]
  );

  const completedCount = useMemo(
    () =>
      referrals.filter(
        (r) => r.status === "COMPLETED" || r.status === "ARRIVED"
      ).length,
    [referrals]
  );

  // Genuine Instant / Emergency referrals that are active
  const instantReferrals = useMemo(
    () =>
      referrals.filter(
        (r) =>
          (r.urgency === "INSTANT" ||
            r.urgency === "EMERGENCY" ||
            String(r.urgency).toUpperCase() === "INSTANT") &&
          r.status !== "COMPLETED" &&
          r.status !== "REJECTED" &&
          r.status !== "ARRIVED"
      ),
    [referrals]
  );

  const activeTransfers = useMemo(
    () =>
      referrals.filter(
        (r) =>
          r.status === "AMBULANCE_ASSIGNED" ||
          r.status === "IN_TRANSIT" ||
          (r.status === "ACCEPTED" && r.urgency === "INSTANT")
      ),
    [referrals]
  );

  const needsUpdateCount = useMemo(
    () =>
      services.filter(
        (service) => service.confidence === "LOW" || !service.isUpdatedToday
      ).length,
    [services]
  );

  const latestData = useMemo(() => {
    if (!dataStatus || dataStatus.length === 0) return null;
    return [...dataStatus].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0];
  }, [dataStatus]);

  const availableServicesCount = useMemo(
    () => services.filter((s) => s.isAvailable).length,
    [services]
  );

  const totalAvailableBeds = useMemo(
    () => beds.reduce((sum, b) => sum + Number(b.availableBeds || 0), 0),
    [beds]
  );

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch =
        !serviceSearch ||
        service.serviceName
          ?.toLowerCase()
          .includes(serviceSearch.toLowerCase()) ||
        service.description
          ?.toLowerCase()
          .includes(serviceSearch.toLowerCase());

      if (!matchesSearch) return false;

      if (serviceFilter === "AVAILABLE") return service.isAvailable;
      if (serviceFilter === "UNAVAILABLE") return !service.isAvailable;
      if (serviceFilter === "NEEDS_UPDATE")
        return service.confidence === "LOW" || !service.isUpdatedToday;
      return true;
    });
  }, [services, serviceSearch, serviceFilter]);

  /*
   * =======================================================
   * LOADING SCREEN
   * =======================================================
   */
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 pt-28">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
            <h2 className="mt-5 text-xl font-bold text-slate-900">
              Loading hospital operations center...
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Retrieving live referrals, service capacity, and bed status.
            </p>
          </div>
        </div>
      </main>
    );
  }

  /*
   * =======================================================
   * ERROR SCREEN
   * =======================================================
   */
  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 pt-28">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-2xl font-black text-red-600">
              !
            </div>
            <h2 className="mt-5 text-2xl font-bold text-slate-900">
              Dashboard unavailable
            </h2>
            <p className="mt-2 text-slate-500">{error}</p>
            <button
              type="button"
              onClick={loadReferrals}
              className="mt-6 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 shadow-md shadow-blue-100"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  const hospitalLocation = [hospital?.city, hospital?.state]
    .filter(Boolean)
    .join(", ") || hospital?.address || "Indore, Madhya Pradesh";

  return (
    <main className="min-h-screen bg-slate-50 pb-20 pt-8 text-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ==================================================
            1. HOSPITAL HEADER & IDENTITY
        ================================================== */}
        <div className="mb-6 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              to="/"
              className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-blue-600 hover:text-blue-800"
            >
              ← Back to Portal Select
            </Link>

            <div className="mt-3 flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-2xl text-white shadow-md shadow-blue-200">
                🏥
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    {hospital?.name || "Metro General Hospital"}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Hospital Active
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {hospitalLocation}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 border border-emerald-100">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-xs font-bold tracking-wider text-emerald-700 uppercase">
                Live Sync
              </span>
            </div>

            <button
              type="button"
              onClick={loadReferrals}
              className="rounded-full bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* NOTIFICATION BANNER */}
        {notification && (
          <div
            className={`mb-6 flex items-center justify-between rounded-2xl border px-5 py-4 shadow-sm transition ${
              notification.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : notification.type === "warning"
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : notification.type === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-blue-200 bg-blue-50 text-blue-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">
                {notification.type === "success"
                  ? "✓"
                  : notification.type === "warning"
                  ? "⚠"
                  : notification.type === "error"
                  ? "✕"
                  : "ℹ"}
              </span>
              <p className="text-sm font-semibold">{notification.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-lg font-bold opacity-60 hover:opacity-100"
            >
              ×
            </button>
          </div>
        )}

        {/* ==================================================
            2. PRIORITY 1: REQUEST ACCEPTANCE (MOST PROMINENT)
        ================================================== */}
        {incomingCount > 0 ? (
          <section className="mb-6 rounded-3xl border-2 border-blue-500/80 bg-gradient-to-r from-blue-50 via-white to-blue-50/50 p-6 shadow-md transition hover:shadow-lg">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-2xl text-white shadow-md shadow-blue-200">
                  🔔
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-blue-800">
                      Priority Action
                    </span>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                      PENDING REFERRAL REQUESTS
                    </h2>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-600">
                    You have <span className="font-bold text-blue-700">{incomingCount}</span> referral request{incomingCount === 1 ? "" : "s"} waiting for hospital review and acceptance.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveWorkflow("REFERRALS")}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 hover:shadow-xl active:scale-95"
              >
                Review Requests ({incomingCount}) →
              </button>
            </div>
          </section>
        ) : (
          <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 text-lg font-bold">
                  ✓
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    No Pending Referral Requests
                  </h3>
                  <p className="text-xs text-slate-500">
                    All incoming referrals have been reviewed and accepted or addressed.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveWorkflow("REFERRALS")}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
              >
                View all referral history ({referrals.length}) →
              </button>
            </div>
          </section>
        )}

        {/* ==================================================
            3. PRIORITY 2: EMERGENCY / INSTANT REFERRAL ALERTS
        ================================================== */}
        {instantReferrals.length > 0 && (
          <section className="mb-6 rounded-3xl border-2 border-red-500 bg-gradient-to-r from-red-50 via-white to-red-50/40 p-6 shadow-md">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-2xl text-white shadow-md shadow-red-200 animate-pulse">
                  🚨
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-red-800">
                      Emergency Alert
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-red-900">
                      INSTANT REFERRAL
                    </h2>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-700">
                    Emergency referral requires immediate hospital attention and resource preparation.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span>
                      <strong className="text-slate-900">Patient:</strong> {instantReferrals[0].patientName}
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-slate-900">Service:</strong> {instantReferrals[0].requiredService?.name || "Emergency Medical Care"}
                    </span>
                    {instantReferrals[0].referringDoctorName && (
                      <>
                        <span>•</span>
                        <span>
                          <strong className="text-slate-900">Doctor:</strong> {instantReferrals[0].referringDoctorName}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveWorkflow("REFERRALS")}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-200 transition hover:bg-red-700 active:scale-95"
              >
                View & Prepare Emergency ({instantReferrals.length}) →
              </button>
            </div>
          </section>
        )}

        {/* ==================================================
            4. PRIORITY 3: CRITICAL DATA UPDATES (IF STALE)
        ================================================== */}
        {needsUpdateCount > 0 && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-5 py-4 text-amber-900 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠</span>
              <p className="text-xs sm:text-sm font-semibold">
                <strong>Attention Required:</strong> {needsUpdateCount} service availability record{needsUpdateCount === 1 ? "" : "s"} require verification or update to keep referral routing accurate.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveWorkflow("MANUAL_UPDATES")}
              className="shrink-0 text-xs font-bold text-amber-800 underline hover:text-amber-950"
            >
              Update services now →
            </button>
          </div>
        )}

        {/* ==================================================
            5. DASHBOARD STATISTICS (COMPACT 4-STAT GRID)
        ================================================== */}
        <section className="mb-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label="Pending Referrals"
              value={incomingCount}
              icon="📥"
              accentColor={incomingCount > 0 ? "text-amber-600" : "text-slate-700"}
              subtext={incomingCount > 0 ? "Action required" : "Up to date"}
            />
            <StatCard
              label="Accepted Referrals"
              value={acceptedCount}
              icon="✓"
              accentColor="text-emerald-600"
              subtext="Pre-arrival prepared"
            />
            <StatCard
              label="In Transit"
              value={transitCount}
              icon="🚑"
              accentColor={transitCount > 0 ? "text-blue-600" : "text-slate-700"}
              subtext={transitCount > 0 ? "En route to hospital" : "No active transfers"}
            />
            <StatCard
              label="Completed"
              value={completedCount}
              icon="📋"
              accentColor="text-teal-600"
              subtext="Care completed"
            />
          </div>
        </section>

        {/* ==================================================
            6. FEATURE CARDS GRID (EQUAL DIMENSIONS, CLEAN)
        ================================================== */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Hospital Operations
              </p>
              <h2 className="text-xl font-extrabold text-slate-900">
                Feature Workflows
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Click a feature card to open its workflow
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {/* CARD 1: REFERRAL REQUESTS */}
            <FeatureCard
              icon="📥"
              title="Referral Requests"
              description="Review incoming patient referrals, examine clinical details, and manage hospital response."
              statusText={
                incomingCount > 0
                  ? `${incomingCount} pending action`
                  : "All reviewed"
              }
              badge={
                incomingCount > 0
                  ? { text: `🔔 ${incomingCount} Pending`, type: "amber" }
                  : { text: "✓ Caught Up", type: "neutral" }
              }
              actionText="Review Requests →"
              onClick={() => setActiveWorkflow("REFERRALS")}
            />

            {/* CARD 2: MANUAL UPDATES */}
            <FeatureCard
              icon="🔄"
              title="Manual Updates"
              bellIndicator={needsUpdateCount > 0}
              description="Update hospital services, bed availability and real-time operational capacity."
              statusText={
                needsUpdateCount > 0
                  ? `${needsUpdateCount} updates need attention`
                  : latestData?.confidence !== "VERY_HIGH" && latestData
                  ? "Some data needs verification"
                  : "Hospital data is up to date"
              }
              badge={
                needsUpdateCount > 0
                  ? { text: `⚠ ${needsUpdateCount} Needs Update`, type: "amber" }
                  : { text: "✓ Updated", type: "emerald" }
              }
              actionText="Open Updates →"
              onClick={() => setActiveWorkflow("MANUAL_UPDATES")}
            />

            {/* CARD 3: LIVE AMBULANCE TRACKING */}
            <FeatureCard
              icon="🚑"
              title="Live Ambulance Tracking"
              description="Monitor incoming ambulance transfers, live GPS location, and pre-arrival alerts."
              statusText={
                transitCount > 0
                  ? `${transitCount} transfer${transitCount === 1 ? "" : "s"} in transit`
                  : "No transfers currently en route"
              }
              badge={
                transitCount > 0
                  ? { text: `● ${transitCount} Live`, type: "blue" }
                  : { text: "Idle", type: "neutral" }
              }
              actionText="Track Transfers →"
              onClick={() => setActiveWorkflow("TRACKING")}
            />

            {/* CARD 4: HOSPITAL SERVICES */}
            <FeatureCard
              icon="🩺"
              title="Hospital Services"
              description="Manage registered clinical departments, specialty offerings, and emergency care status."
              statusText={`${availableServicesCount} of ${services.length} services available`}
              badge={{
                text: `${services.length} Registered`,
                type: "neutral",
              }}
              actionText="Manage Services →"
              onClick={() => setActiveWorkflow("SERVICES")}
            />

            {/* CARD 5: DATA VERIFICATION */}
            <FeatureCard
              icon="🛡️"
              title="Data Verification"
              description="Audit freshness records, confidence ratings, and official operational confirmations."
              statusText={
                latestData
                  ? `${String(latestData.confidence || "LOW").replaceAll("_", " ")} Confidence`
                  : "Verification recorded"
              }
              badge={
                latestData?.confidence === "VERY_HIGH"
                  ? { text: "Verified High", type: "emerald" }
                  : { text: "Freshness Audit", type: "amber" }
              }
              actionText="Inspect Verification →"
              onClick={() => setActiveWorkflow("VERIFICATION")}
            />

            {/* CARD 6: BED CAPACITY */}
            <FeatureCard
              icon="🛏️"
              title="Bed Capacity"
              description="Monitor ICU, general, and emergency bed occupancy in real time across all wards."
              statusText={`${totalAvailableBeds} available beds configured`}
              badge={{
                text: `${beds.length} Bed Types`,
                type: "neutral",
              }}
              actionText="View Capacity →"
              onClick={() => setActiveWorkflow("CAPACITY")}
            />
          </div>
        </section>
      </div>

      {/* ==================================================
          WORKFLOW 1: REFERRAL REQUESTS MODAL
      ================================================== */}
      {activeWorkflow === "REFERRALS" && (
        <WorkflowModal
          title="Referral Requests Workflow"
          subtitle={`Coordinate incoming referrals for ${hospital?.name || "Metro General Hospital"}`}
          onClose={() => setActiveWorkflow(null)}
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                {incomingCount} Pending Review
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {referrals.length} Total Referrals
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Accepting prepares pre-arrival notification for medical staff.
            </p>
          </div>

          {referrals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                📭
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">
                No referrals found
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                New referrals routed to this hospital will immediately appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Show pending referrals first */}
              {referrals
                .slice()
                .sort((a, b) => {
                  const isAPending =
                    a.status === "CREATED" ||
                    a.status === "SENT" ||
                    a.status === "RECEIVED";
                  const isBPending =
                    b.status === "CREATED" ||
                    b.status === "SENT" ||
                    b.status === "RECEIVED";
                  if (isAPending && !isBPending) return -1;
                  if (!isAPending && isBPending) return 1;
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                })
                .map((referral) => (
                  <ReferralCard
                    key={referral.id}
                    referral={referral}
                    hospitalName={hospital?.name}
                    actionLoading={actionLoading}
                    onAccept={() => updateStatus(referral.id, "ACCEPTED")}
                    onReject={() => updateStatus(referral.id, "REJECTED")}
                  />
                ))}
            </div>
          )}
        </WorkflowModal>
      )}

      {/* ==================================================
          WORKFLOW 2: MANUAL UPDATES MODAL (WITH SEARCH & STEPPERS)
      ================================================== */}
      {activeWorkflow === "MANUAL_UPDATES" && (
        <WorkflowModal
          title="Manual Updates Workflow"
          subtitle="Update hospital services, bed availability and real-time operational capacity."
          onClose={() => {
            setActiveWorkflow(null);
            setServiceSearch("");
          }}
        >
          {/* SEARCH & FILTERS */}
          <div className="space-y-3">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                🔍
              </span>
              <input
                type="text"
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                placeholder="Search services by name or description..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              {serviceSearch && (
                <button
                  type="button"
                  onClick={() => setServiceSearch("")}
                  className="absolute inset-y-0 right-0 pr-3.5 text-sm font-bold text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "ALL", label: `All (${services.length})` },
                  { id: "NEEDS_UPDATE", label: `Needs Update (${needsUpdateCount})` },
                  { id: "AVAILABLE", label: "Available" },
                  { id: "UNAVAILABLE", label: "Unavailable" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setServiceFilter(tab.id)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                      serviceFilter === tab.id
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <span className="text-xs text-slate-400 font-medium">
                {filteredServices.length} match{filteredServices.length === 1 ? "" : "es"}
              </span>
            </div>
          </div>

          {/* LIMITED HEIGHT SCROLLABLE LIST AS PER SPEC */}
          <div className="mt-4 max-h-[420px] overflow-y-auto space-y-3 pr-1 divide-y divide-slate-100">
            {filteredServices.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                No matching services found for &quot;{serviceSearch}&quot;.
              </div>
            ) : (
              filteredServices.map((service) => {
                const isStale =
                  service.confidence === "LOW" || !service.isUpdatedToday;
                const capacity = getAdjustedCapacity(
                  service.serviceId,
                  service.capacity
                );
                const isSavingThis =
                  serviceSaving && updatingServiceId === service.serviceId;

                return (
                  <div
                    key={service.serviceId}
                    className="pt-3 first:pt-0 pb-1 rounded-xl p-3 hover:bg-slate-50 transition border border-slate-100"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">
                            {service.serviceName}
                          </h4>
                          {service.isAvailable ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                              ✓ Available
                            </span>
                          ) : (
                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700 border border-red-200">
                              ● Unavailable
                            </span>
                          )}
                          {isStale && (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
                              ⚠ Needs Update
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                          {service.description || "Hospital registered department"} • {formatServiceAge(service)}
                        </p>
                      </div>

                      {/* STEPPER & UPDATE CONTROLS */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
                          <span className="text-xs font-semibold text-slate-400 pl-1.5 pr-1">
                            Cap:
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCapacityStep(
                                service.serviceId,
                                service.capacity,
                                -1
                              )
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700 hover:bg-slate-200 active:scale-95"
                            title="Decrease capacity"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-slate-900">
                            {capacity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCapacityStep(
                                service.serviceId,
                                service.capacity,
                                1
                              )
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700 hover:bg-slate-200 active:scale-95"
                            title="Increase capacity"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={isSavingThis}
                          onClick={() => handleQuickUpdate(service)}
                          className="rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 active:scale-95 transition"
                        >
                          {isSavingThis ? "Saving..." : "Update"}
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingService(service)}
                          className="text-xs font-medium text-slate-500 hover:text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* BED CAPACITY QUICK SECTION */}
          {beds.length > 0 && (
            <div className="mt-6 border-t border-slate-100 pt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Bed Availability Quick Status
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {beds.map((bed) => (
                  <div
                    key={bed.id || bed.bedType}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <p className="text-xs font-bold capitalize text-slate-700">
                      {bed.bedType} Beds
                    </p>
                    <p className="mt-1 text-lg font-black text-blue-600">
                      {bed.availableBeds}{" "}
                      <span className="text-xs font-normal text-slate-400">
                        / {bed.totalBeds}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </WorkflowModal>
      )}

      {/* ==================================================
          WORKFLOW 3: LIVE AMBULANCE TRACKING MODAL
      ================================================== */}
      {activeWorkflow === "TRACKING" && (
        <WorkflowModal
          title="Live Ambulance Tracking"
          subtitle="Real-time monitoring of ambulances and patient referrals in transit."
          onClose={() => setActiveWorkflow(null)}
        >
          {activeTransfers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                🚑
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">
                No active ambulances in transit
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                When an ambulance is dispatched for an accepted referral, its live GPS and pre-arrival telemetry will appear here.
              </p>
              <Link
                to="/hospital/transfers"
                className="mt-5 inline-flex items-center gap-1 rounded-full bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
              >
                Open Transfers Portal →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTransfers.map((referral) => (
                <div
                  key={referral.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                          Transfer #{referral.id}
                        </span>
                        <StatusBadge status={referral.status} />
                        {referral.urgency && (
                          <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-600 uppercase">
                            {referral.urgency}
                          </span>
                        )}
                      </div>
                      <h4 className="mt-2 text-base font-bold text-slate-900">
                        Patient: {referral.patientName}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Required Service: {referral.requiredService?.name || "Medical Care"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to="/hospital/transfers"
                        className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
                      >
                        Live Map Telemetry →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </WorkflowModal>
      )}

      {/* ==================================================
          WORKFLOW 4: HOSPITAL SERVICES MODAL
      ================================================== */}
      {activeWorkflow === "SERVICES" && (
        <WorkflowModal
          title="Hospital Clinical Services"
          subtitle={`Registered clinical departments for ${hospital?.name || "Metro General Hospital"}`}
          onClose={() => setActiveWorkflow(null)}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                {availableServicesCount} Available
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {services.length} Total Registered
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveWorkflow("MANUAL_UPDATES")}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Update service capacities →
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 max-h-[460px] overflow-y-auto pr-1">
            {services.map((service) => (
              <div
                key={service.serviceId}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {service.serviceName}
                  </h4>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      service.isAvailable
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {service.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                  {service.description || "Registered hospital department."}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-500">
                  <span>Capacity: <strong className="text-slate-800">{service.capacity ?? "N/A"}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveWorkflow(null);
                      setEditingService(service);
                    }}
                    className="font-bold text-blue-600 hover:underline"
                  >
                    Edit →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </WorkflowModal>
      )}

      {/* ==================================================
          WORKFLOW 5: DATA VERIFICATION MODAL
      ================================================== */}
      {activeWorkflow === "VERIFICATION" && (
        <WorkflowModal
          title="Data Verification & Freshness"
          subtitle="Availability accountability and operational confidence ratings."
          onClose={() => setActiveWorkflow(null)}
        >
          {latestData ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Confidence Rating
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                      latestData.confidence === "VERY_HIGH"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {String(latestData.confidence || "LOW").replaceAll("_", " ")}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <InfoItem label="Data Source" value={latestData.source || "Manual Entry"} />
                  <InfoItem
                    label="Last Updated"
                    value={new Date(latestData.updatedAt).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  />
                  <InfoItem
                    label="Freshness Status"
                    value={latestData.isUpdatedToday ? "Updated today" : "May be outdated"}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Need to refresh operational confidence?
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Submitting manual service updates automatically creates a verified record.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveWorkflow("MANUAL_UPDATES")}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
                >
                  Update Records →
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No verification records currently available for this hospital.
            </p>
          )}
        </WorkflowModal>
      )}

      {/* ==================================================
          WORKFLOW 6: BED CAPACITY MODAL
      ================================================== */}
      {activeWorkflow === "CAPACITY" && (
        <WorkflowModal
          title="Hospital Bed Capacity"
          subtitle={`Operational bed inventory for ${hospital?.name || "Metro General Hospital"}`}
          onClose={() => setActiveWorkflow(null)}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {beds.map((bed) => (
              <ResourceCard key={bed.id || bed.bedType} bed={bed} onSaveBed={saveBed} />
            ))}
            {beds.length === 0 && (
              <div className="col-span-2 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                No bed resources are currently configured for this hospital.
              </div>
            )}
          </div>
        </WorkflowModal>
      )}

      {/* ==================================================
          EXISTING SERVICE UPDATE EDIT MODAL
      ================================================== */}
      {editingService && (
        <ServiceUpdateModal
          service={editingService}
          saving={serviceSaving}
          onClose={() => !serviceSaving && setEditingService(null)}
          onSave={saveService}
        />
      )}
    </main>
  );
}

/*
=========================================================
FEATURE CARD (CLEAN, EQUAL DIMENSIONS, HOVER STATES)
=========================================================
*/
function FeatureCard({
  icon,
  title,
  description,
  statusText,
  badge,
  actionText,
  bellIndicator,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative flex min-h-[210px] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-400 hover:shadow-md cursor-pointer active:scale-[0.99]"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl transition group-hover:scale-105">
            {icon}
          </div>

          <div className="flex items-center gap-1.5">
            {bellIndicator && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-50 text-amber-600 text-xs shadow-sm border border-amber-200 animate-bounce">
                🔔
              </span>
            )}
            {badge && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  badge.type === "amber"
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : badge.type === "emerald"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : badge.type === "blue"
                    ? "bg-blue-50 text-blue-800 border border-blue-200"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {badge.text}
              </span>
            )}
          </div>
        </div>

        <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-blue-600 transition">
          {title}
        </h3>

        <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
        <span className="font-semibold text-slate-600 truncate max-w-[170px]">
          {statusText}
        </span>
        <span className="font-bold text-blue-600 group-hover:translate-x-0.5 transition inline-flex items-center gap-1">
          {actionText}
        </span>
      </div>
    </div>
  );
}

/*
=========================================================
STAT CARD
=========================================================
*/
function StatCard({ label, value, icon, accentColor = "text-slate-900", subtext }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xl">{icon}</span>
        <span className={`text-2xl font-black ${accentColor}`}>{value}</span>
      </div>
      <p className="mt-2 text-xs font-bold text-slate-800 truncate">{label}</p>
      {subtext && <p className="text-[11px] text-slate-400 truncate">{subtext}</p>}
    </div>
  );
}

/*
=========================================================
GENERIC WORKFLOW MODAL WRAPPER
=========================================================
*/
function WorkflowModal({ title, subtitle, onClose, children }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl md:p-8 my-8 border border-slate-100 max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 shrink-0">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">{title}</h3>
            {subtitle && (
              <p className="mt-1 text-xs text-slate-500 font-medium">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-base font-bold text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 overflow-y-auto flex-1 pr-1">{children}</div>
      </div>
    </div>
  );
}

/*
=========================================================
RESOURCE / BED CARD
=========================================================
*/
function ResourceCard({ bed }) {
  const available = Number(bed.availableBeds || 0);
  const total = Number(bed.totalBeds || 0);
  const hasCapacity = available > 0;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
          🛏️
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
            hasCapacity
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-800"
          }`}
        >
          {hasCapacity ? "Available" : "At Capacity"}
        </span>
      </div>
      <h4 className="mt-3 text-sm font-bold capitalize text-slate-900">
        {bed.bedType} Beds
      </h4>
      <p className="mt-1 text-2xl font-black text-blue-600">
        {available} <span className="text-xs font-semibold text-slate-400">/ {total}</span>
      </p>
      <p className="mt-2 text-[11px] text-slate-400">
        Updated {bed.updatedAt ? new Date(bed.updatedAt).toLocaleDateString() : "recently"}
      </p>
    </article>
  );
}

/*
=========================================================
SERVICE UPDATE MODAL
=========================================================
*/
function ServiceUpdateModal({ service, saving, onClose, onSave }) {
  const [isAvailable, setIsAvailable] = useState(Boolean(service.isAvailable));
  const [capacity, setCapacity] = useState(service.capacity ?? 0);
  const [notes, setNotes] = useState(service.notes || "");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
              Service Availability
            </p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">
              Update Service Details
            </h3>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              {service.serviceName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-500 hover:bg-slate-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <fieldset className="mt-6">
          <legend className="text-xs font-bold uppercase text-slate-600">
            Availability Status
          </legend>
          <div className="mt-2.5 flex gap-4">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="radio"
                checked={isAvailable}
                onChange={() => setIsAvailable(true)}
                className="text-blue-600"
              />
              Available
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="radio"
                checked={!isAvailable}
                onChange={() => setIsAvailable(false)}
                className="text-blue-600"
              />
              Unavailable
            </label>
          </div>
        </fieldset>

        <label className="mt-5 block text-xs font-bold uppercase text-slate-600">
          Capacity
          <input
            type="number"
            min="0"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white"
          />
        </label>

        <label className="mt-4 block text-xs font-bold uppercase text-slate-600">
          Operational Notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="2"
            placeholder="Add any specific staffing or shift notes..."
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-normal outline-none focus:border-blue-500 focus:bg-white"
          />
        </label>

        <p className="mt-4 text-[11px] text-slate-400">
          Source: MANUAL. Saving creates an operational freshness timestamp for routing algorithms.
        </p>

        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || capacity === "" || Number(capacity) < 0}
            onClick={() =>
              onSave(service.serviceId, {
                isAvailable,
                capacity: Number(capacity),
                notes,
              })
            }
            className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 shadow-md shadow-blue-100"
          >
            {saving ? "Saving..." : "Save Update"}
          </button>
        </div>
      </div>
    </div>
  );
}

/*
=========================================================
REFERRAL CARD (INSIDE REFERRAL WORKFLOW)
=========================================================
*/
function ReferralCard({
  referral,
  hospitalName,
  actionLoading,
  onAccept,
  onReject,
}) {
  const isPending =
    referral.status === "CREATED" ||
    referral.status === "SENT" ||
    referral.status === "RECEIVED";

  const isAccepted = referral.status === "ACCEPTED";
  const isRejected = referral.status === "REJECTED";

  const isBusy =
    actionLoading === `${referral.id}-ACCEPTED` ||
    actionLoading === `${referral.id}-REJECTED`;

  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm transition ${
        isPending
          ? "border-blue-200 bg-white"
          : isAccepted
          ? "border-emerald-100 bg-emerald-50/20"
          : isRejected
          ? "border-red-100 bg-red-50/20"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
              REFERRAL #{referral.id}
            </span>
            <StatusBadge status={referral.status} />
            {referral.urgency && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                  referral.urgency === "INSTANT" || referral.urgency === "EMERGENCY"
                    ? "bg-red-50 text-red-600"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {referral.urgency}
              </span>
            )}
          </div>

          <h3 className="mt-3 text-lg font-bold text-slate-900">
            {referral.patientName}
          </h3>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoItem
              label="Service"
              value={referral.requiredService?.name || "Medical Service"}
            />
            <InfoItem
              label="Referring Doctor"
              value={referral.referringDoctorName || "Not provided"}
            />
            <InfoItem
              label="Requested Hospital"
              value={hospitalName || "This Hospital"}
            />
            <InfoItem
              label="Referral Type"
              value={
                referral.urgency === "INSTANT"
                  ? "Instant Referral"
                  : "Standard Referral"
              }
            />
            <InfoItem
              label="Reason / Diagnosis"
              value={referral.reason || "Not provided"}
            />
            <InfoItem
              label="Created Time"
              value={
                referral.createdAt
                  ? new Date(referral.createdAt).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "—"
              }
            />
          </div>

          {referral.notes && (
            <div className="mt-3 rounded-xl bg-slate-50 p-3 border border-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Notes
              </p>
              <p className="mt-0.5 text-xs text-slate-700">{referral.notes}</p>
            </div>
          )}
        </div>

        {/* PROMINENT ACCEPT & REJECT ACTIONS */}
        <div className="flex shrink-0 flex-col gap-2.5 lg:w-44 pt-2 lg:pt-0">
          {isPending && (
            <>
              <button
                type="button"
                disabled={isBusy}
                onClick={onAccept}
                className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-md shadow-emerald-100 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading === `${referral.id}-ACCEPTED`
                  ? "Accepting..."
                  : "✓ Accept Request"}
              </button>

              <button
                type="button"
                disabled={isBusy}
                onClick={onReject}
                className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading === `${referral.id}-REJECTED`
                  ? "Rejecting..."
                  : "Reject"}
              </button>
            </>
          )}

          {isAccepted && (
            <div className="rounded-xl bg-emerald-50 p-3 text-center border border-emerald-200">
              <span className="text-lg">✓</span>
              <p className="mt-0.5 text-xs font-bold text-emerald-800">
                Referral Accepted
              </p>
              <p className="text-[11px] text-emerald-600">
                Pre-arrival alert sent
              </p>
            </div>
          )}

          {isRejected && (
            <div className="rounded-xl bg-red-50 p-3 text-center border border-red-200">
              <span className="text-lg">✕</span>
              <p className="mt-0.5 text-xs font-bold text-red-800">
                Referral Rejected
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/*
=========================================================
INFO ITEM
=========================================================
*/
function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-400">{label}</p>
      <p className="mt-0.5 text-xs font-bold text-slate-800 line-clamp-2">
        {value}
      </p>
    </div>
  );
}

/*
=========================================================
STATUS BADGE
=========================================================
*/
function StatusBadge({ status }) {
  const styles = {
    CREATED: "bg-amber-50 text-amber-700 border-amber-200",
    SENT: "bg-blue-50 text-blue-700 border-blue-200",
    RECEIVED: "bg-blue-50 text-blue-700 border-blue-200",
    ACCEPTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    REJECTED: "bg-red-50 text-red-700 border-red-200",
    AMBULANCE_ASSIGNED: "bg-purple-50 text-purple-700 border-purple-200",
    IN_TRANSIT: "bg-indigo-50 text-indigo-700 border-indigo-200",
    ARRIVED: "bg-teal-50 text-teal-700 border-teal-200",
    COMPLETED: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase ${
        styles[status] || "bg-slate-100 text-slate-600 border-slate-200"
      }`}
    >
      {formatStatus(status)}
    </span>
  );
}

/*
=========================================================
HELPER FUNCTIONS
=========================================================
*/
function formatStatus(status) {
  return String(status || "").replaceAll("_", " ");
}

function formatServiceAge(service) {
  if (!service.updatedAt) return "Not updated";
  const age = Number(service.ageMinutes);
  if (Number.isFinite(age) && age < 1) return "Updated just now";
  if (Number.isFinite(age) && age < 60) return `Updated ${Math.round(age)}m ago`;
  if (service.isUpdatedToday) return "Updated today";
  if (Number.isFinite(age) && age < 48 * 60) return "Updated yesterday";
  return `Updated ${Math.max(2, Math.round(age / (24 * 60)))}d ago`;
}

export default HospitalDashboard;
