import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PortalNav from "../components/PortalNav";

const API_BASE_URL = "http://localhost:5000";

function DoctorDashboard() {
  const [referrals, setReferrals] = useState([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/referrals`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Unable to load referrals.");
        setReferrals(result.data || []);
      })
      .catch((error) => setLoadError(error.message));
  }, []);

  const active = referrals.filter((referral) => !["REJECTED", "COMPLETED", "ARRIVED"].includes(referral.status)).length;
  const pending = referrals.filter((referral) => ["CREATED", "SENT", "RECEIVED"].includes(referral.status)).length;
  const instant = referrals.filter((referral) => referral.urgency === "INSTANT").length;
  const completed = referrals.filter((referral) => ["COMPLETED", "ARRIVED"].includes(referral.status)).length;

  return <div className="min-h-screen bg-slate-50"><PortalNav role="doctor" /><main className="mx-auto max-w-7xl px-5 py-10 md:px-8"><div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">Clinical coordination</p><h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">Good evening, Doctor</h1><p className="mt-3 text-slate-500">Manage patient referrals and find suitable hospitals quickly.</p></div><div className="flex flex-wrap gap-3"><Link to="/doctor/instant-referral" className="rounded-full bg-amber-500 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-amber-600">⚡ Instant Referral</Link><Link to="/doctor/referral" className="rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700">+ New Referral</Link></div></div><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Active referrals" value={active} tone="blue" /><Stat label="Pending referrals" value={pending} tone="amber" /><Stat label="Instant referrals" value={instant} tone="orange" /><Stat label="Completed" value={completed} tone="green" /></div>{loadError && <p className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">{loadError}</p>}<section className="mt-8 rounded-3xl bg-white p-7 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Clinical queue</p><h2 className="mt-2 text-2xl font-bold text-slate-900">Recent referrals</h2></div><Link to="/doctor/referrals" className="text-sm font-bold text-blue-600">View all</Link></div><div className="mt-6 overflow-x-auto"><table className="w-full min-w-190 text-left"><thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-3 py-3">Patient</th><th className="px-3 py-3">Service</th><th className="px-3 py-3">Hospital</th><th className="px-3 py-3">Mode</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Time</th></tr></thead><tbody>{referrals.slice(0, 8).map((referral) => <tr key={referral.id} className="border-b border-slate-50 text-sm"><td className="px-3 py-4 font-bold text-slate-800">{referral.patientName}<span className="ml-2 text-xs font-normal text-slate-400">#{referral.id}</span></td><td className="px-3 py-4 text-slate-600">{referral.requiredService?.name || "Medical service"}</td><td className="px-3 py-4 text-slate-600">{referral.destinationHospital?.name || "Pending"}</td><td className="px-3 py-4">{referral.urgency === "INSTANT" ? <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">INSTANT</span> : <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">STANDARD</span>}</td><td className="px-3 py-4"><Status status={referral.status} /></td><td className="px-3 py-4 text-slate-500">{referral.createdAt ? new Date(referral.createdAt).toLocaleDateString() : "—"}</td></tr>)}</tbody></table>{!loadError && referrals.length === 0 && <p className="py-10 text-center text-sm text-slate-500">No referrals have been created yet.</p>}</div></section></main></div>;
}
function Stat({ label, value, tone }) { const tones = { blue: "bg-blue-50 text-blue-700", amber: "bg-amber-50 text-amber-700", orange: "bg-orange-50 text-orange-700", green: "bg-emerald-50 text-emerald-700" }; return <div className="rounded-3xl bg-white p-6 shadow-sm"><div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-lg font-bold ${tones[tone]}`}>{value}</div><p className="mt-5 text-sm font-semibold text-slate-500">{label}</p></div>; }
function Status({ status }) { const text = String(status || "PENDING").replaceAll("_", " "); const classes = status === "ACCEPTED" ? "bg-emerald-50 text-emerald-700" : status === "IN_TRANSIT" ? "bg-indigo-50 text-indigo-700" : status === "COMPLETED" ? "bg-slate-100 text-slate-700" : "bg-blue-50 text-blue-700"; return <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${classes}`}>{text}</span>; }
export default DoctorDashboard;
