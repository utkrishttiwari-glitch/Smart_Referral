import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PortalNav from "../components/PortalNav";
import API_URL from "../config/api";

function DoctorDashboard() {
  const [referrals, setReferrals] = useState([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/referrals`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to load referrals.");
        }
        setReferrals(result.data || []);
      })
      .catch((error) => setLoadError(error.message));
  }, []);

  const active = referrals.filter(
    (referral) => !["REJECTED", "COMPLETED", "ARRIVED"].includes(referral.status)
  ).length;
  const pending = referrals.filter((referral) =>
    ["CREATED", "SENT", "RECEIVED"].includes(referral.status)
  ).length;
  const instant = referrals.filter(
    (referral) => referral.urgency === "INSTANT"
  ).length;
  const completed = referrals.filter((referral) =>
    ["COMPLETED", "ARRIVED"].includes(referral.status)
  ).length;

  return (
    <div className="sr-page min-h-screen bg-slate-50">
      <PortalNav role="doctor" />

      <main className="sr-shell py-8 md:py-12">
        {/* Main Header / Hero Area */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#1769e0]">
                  Doctor Dashboard
                </span>
                <span className="sr-live">Network connected</span>
              </div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                Welcome, Doctor
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[#6f8198] md:text-base">
                Create and manage patient referrals efficiently. Coordinate referrals with a clear view of the patient queue, live hospital signals, and emergency pathways.
              </p>
            </div>

            {/* Prominent Primary Create Referral Button */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/doctor/referral"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1769e0] px-6 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#1255b8] hover:shadow-md"
              >
                <span className="text-lg leading-none font-bold">＋</span> Create Referral
              </Link>
            </div>
          </div>

          {/* Quick Action Feature Cards (Standard & Emergency Referral) */}
          <div className="mt-7 grid gap-4 pt-6 border-t border-slate-100 sm:grid-cols-2 lg:grid-cols-3">
            {/* Standard Referral Card */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 transition hover:border-blue-300 hover:bg-blue-50/70">
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-[#1769e0]">
                  ＋
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700">
                  Standard Flow
                </span>
              </div>
              <h2 className="mt-3 text-sm font-bold text-slate-900">
                Standard Referral
              </h2>
              <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                Match patient needs with verified receiving hospitals and bed capacity.
              </p>
              <Link
                to="/doctor/referral"
                className="mt-3 inline-flex items-center text-xs font-extrabold text-[#1769e0] hover:underline"
              >
                Create Referral →
              </Link>
            </div>

            {/* Emergency / Instant Referral Card */}
            <div className="rounded-2xl border border-red-100 bg-red-50/40 p-4 transition hover:border-red-300 hover:bg-red-50/70">
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-xs font-bold text-red-600">
                  🔴
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-red-700">
                  Instant Emergency
                </span>
              </div>
              <h2 className="mt-3 text-sm font-bold text-slate-900">
                Create Emergency Referral
              </h2>
              <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                Start an urgent patient referral with immediate hospital coordination.
              </p>
              <Link
                to="/doctor/instant-referral"
                className="mt-3 inline-flex items-center text-xs font-extrabold text-red-600 hover:underline"
              >
                Create Referral →
              </Link>
            </div>

            {/* Consultations Card */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition hover:border-slate-300 hover:bg-slate-50 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 text-xs font-bold text-slate-700">
                  ◌
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                  Clinical Comms
                </span>
              </div>
              <h2 className="mt-3 text-sm font-bold text-slate-900">
                Teleconsultation Queue
              </h2>
              <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                Provide instructions to medical staff and ambulance teams during transit.
              </p>
              <Link
                to="/doctor/consultations"
                className="mt-3 inline-flex items-center text-xs font-extrabold text-slate-700 hover:underline"
              >
                View Consultations →
              </Link>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Active referrals" value={active} icon="↗" tone="blue" />
          <Kpi label="Pending review" value={pending} icon="◷" tone="amber" />
          <Kpi label="Instant referrals" value={instant} icon="!" tone="red" />
          <Kpi label="Completed transfers" value={completed} icon="✓" tone="green" />
        </section>

        {loadError && (
          <p className="mt-6 rounded-2xl border border-[#f2c7ca] bg-[#fff1f2] p-4 text-sm font-bold text-[#b63d47]">
            {loadError}
          </p>
        )}

        {/* Recent Referrals Table */}
        <section className="sr-card mt-6 overflow-hidden p-6 md:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="sr-eyebrow">Live clinical queue</p>
              <h2 className="sr-title mt-2 text-2xl font-extrabold">Recent referrals</h2>
            </div>
            <Link to="/doctor/referrals" className="text-sm font-extrabold text-[#1769e0]">
              View all referrals →
            </Link>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="border-b border-[#e7eff7] text-[10px] font-black uppercase tracking-[.14em] text-[#8aa0b7]">
                <tr>
                  <th className="px-3 py-3">Patient</th>
                  <th className="px-3 py-3">Required service</th>
                  <th className="px-3 py-3">Destination</th>
                  <th className="px-3 py-3">Mode</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {referrals.slice(0, 8).map((referral) => (
                  <tr key={referral.id} className="border-b border-[#f0f5fa] text-sm">
                    <td className="px-3 py-4 font-extrabold text-[#284664]">
                      {referral.patientName}
                      <span className="ml-2 text-xs font-normal text-[#9aabba]">
                        #{referral.id}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-[#5f748b]">
                      {referral.requiredService?.name || "Medical service"}
                    </td>
                    <td className="px-3 py-4 text-[#5f748b]">
                      {referral.destinationHospital?.name || "Pending"}
                    </td>
                    <td className="px-3 py-4">
                      {referral.urgency === "INSTANT" ? (
                        <span className="rounded-full bg-[#ffe8e8] px-3 py-1 text-[10px] font-black text-[#c83d4b]">
                          EMERGENCY
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#edf3f8] px-3 py-1 text-[10px] font-black text-[#60758a]">
                          STANDARD
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <Status status={referral.status} />
                    </td>
                    <td className="px-3 py-4 text-[#72869b]">
                      {referral.createdAt
                        ? new Date(referral.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!loadError && referrals.length === 0 && (
              <p className="py-12 text-center text-sm text-[#72869b]">
                No referrals have been created yet.
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function Kpi({ label, value, icon, tone }) {
  const colors = {
    blue: "bg-[#eaf4ff] text-[#1769e0]",
    amber: "bg-[#fff5df] text-[#a96808]",
    red: "bg-[#ffe8e8] text-[#c83d4b]",
    green: "bg-[#e7f8f1] text-[#14845c]",
  };
  return (
    <div className="sr-kpi">
      <div className="flex items-center justify-between">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-black ${colors[tone]}`}
        >
          {icon}
        </span>
        <span className="sr-kpi-value">{value}</span>
      </div>
      <p className="mt-4 text-xs font-extrabold text-[#74889d]">{label}</p>
    </div>
  );
}

function Status({ status }) {
  const text = String(status || "PENDING").replaceAll("_", " ");
  const classes =
    status === "ACCEPTED"
      ? "bg-[#e7f8f1] text-[#14845c]"
      : status === "IN_TRANSIT"
      ? "bg-[#eaf4ff] text-[#1769e0]"
      : status === "COMPLETED"
      ? "bg-[#edf3f8] text-[#60758a]"
      : "bg-[#fff5df] text-[#a96808]";
  return (
    <span
      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${classes}`}
    >
      {text}
    </span>
  );
}

export default DoctorDashboard;
