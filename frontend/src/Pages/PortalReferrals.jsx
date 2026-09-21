import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PortalNav from "../components/PortalNav";

const API_BASE_URL = "https://smart-referral-backend.onrender.com";

function PortalReferrals({ role }) {
  const [referrals, setReferrals] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/referrals`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Unable to load referrals");
        setReferrals(result.data || []);
      })
      .catch((requestError) => setError(requestError.message));
  }, []);

  return <div className="min-h-screen bg-slate-50"><PortalNav role={role} /><main className="mx-auto max-w-7xl px-5 py-10 md:px-8"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">{role === "doctor" ? "Clinical history" : "Your care history"}</p><h1 className="mt-3 text-4xl font-extrabold text-slate-900">Referrals</h1></div><Link to={`/${role}/referral`} className="rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white">New referral</Link></div>{error && <p className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}<div className="mt-8 space-y-3">{referrals.map((referral) => <div key={referral.id} className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Referral #{referral.id}</p><h2 className="mt-2 text-lg font-bold text-slate-900">{referral.destinationHospital?.name || "Hospital pending"}</h2><p className="mt-1 text-sm text-slate-500">{referral.requiredService?.name || "Medical service"}</p></div><div className="flex items-center gap-3"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase text-blue-700">{formatStatus(referral.status)}</span><Link to={`/${role}/tracking?id=${referral.id}`} className="text-sm font-bold text-blue-600">Track</Link></div></div>)}{!error && referrals.length === 0 && <div className="rounded-3xl bg-white p-10 text-center text-sm text-slate-500">No referrals found.</div>}</div></main></div>;
}
function formatStatus(status) { return String(status || "Pending").replaceAll("_", " "); }
export default PortalReferrals;
