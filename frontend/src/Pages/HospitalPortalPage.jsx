import { Link } from "react-router-dom";
import PortalNav from "../components/PortalNav";
import HospitalDashboard from "./HospitalDashboard";

const content = {
  referrals: ["Incoming referrals", "Review incoming patient referrals and accept or reject them from the existing hospital workflow."],
  transfers: ["Active transfers", "Monitor accepted referrals and open live tracking for an active ambulance journey."],
  capacity: ["Beds & services", "Use the existing hospital dashboard and backend availability APIs to keep capacity information current."],
  verification: ["Verification", "Review hospital data freshness and use the existing confirmation workflow when stale information needs verification."],
};

function HospitalPortalPage({ section }) {
  if (section === "referrals") return <HospitalDashboard />;
  const [title, description] = content[section] || content.referrals;

  return <div className="min-h-screen bg-slate-50"><PortalNav role="hospital" /><main className="mx-auto max-w-7xl px-5 py-10 md:px-8"><p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">Hospital operations</p><h1 className="mt-3 text-4xl font-extrabold text-slate-900">{title}</h1><p className="mt-4 max-w-2xl text-slate-500">{description}</p><div className="mt-8 rounded-3xl bg-white p-8 shadow-sm"><p className="text-sm leading-6 text-slate-600">Metro General Hospital is the active demo hospital. The existing hospital dashboard remains the source of truth for live referrals, Socket.IO notifications, and referral actions.</p><Link to="/hospital" className="mt-6 inline-flex rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white">Open hospital dashboard</Link></div></main></div>;
}

export default HospitalPortalPage;
