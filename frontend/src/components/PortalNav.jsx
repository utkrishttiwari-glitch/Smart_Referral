import { Link, useLocation } from "react-router-dom";

const navigation = {
  patient: [
    ["Dashboard", "/patient"],
    ["Find Hospital", "/patient/hospitals"],
    ["Live Teleconsultation", "/patient/teleconsultation"],
    ["My Medical Reports", "/patient/reports"],
    ["Medicine Availability", "/patient/medicines"],
  ],
  doctor: [
    ["Dashboard", "/doctor"],
    ["New Referral", "/doctor/referral"],
    ["Instant Referral", "/doctor/instant-referral"],
    ["Referrals", "/doctor/referrals"],
    ["Hospitals", "/hospitals"],
    ["Tracking", "/doctor/tracking"],
    ["Consultations", "/doctor/consultations"],
  ],
  hospital: [
    ["Dashboard", "/hospital"],
    ["Incoming Referrals", "/hospital/referrals"],
    ["Active Transfers", "/hospital/transfers"],
    ["Beds & Services", "/hospital/capacity"],
    ["Verification", "/hospital/verification"],
  ],
  medicine: [["Dashboard", "/medicine-provider"], ["Medicine Availability", "/medicine-provider"]],
  medical: [["Profile", "/medical-staff/profile"], ["Doctor Consultation", "/medical-staff/consultation"]],
};

function PortalNav({ role }) {
  const location = useLocation();
  const links = navigation[role] || navigation.patient;
  const label = role === "patient" ? "Patient Portal" : `${role[0].toUpperCase()}${role.slice(1)} Portal`;
  const roleInitial = role === "hospital" ? "MG" : role === "doctor" ? "DR" : role === "medical" ? "RK" : role === "medicine" ? "MP" : "PS";
  const icons = { Dashboard: "⌂", "Find Hospital": "⌖", "Live Teleconsultation": "◉", "My Medical Reports": "▤", "Medicine Availability": "✦", "New Referral": "＋", "Instant Referral": "!", Referrals: "↗", Hospitals: "🏥", Tracking: "⌁", Consultations: "◌", "Incoming Referrals": "▤", "Active Transfers": "🚑", "Beds & Services": "▦", Verification: "✓", Profile: "◎", "Doctor Consultation": "◉" };

  return (
    <header className="sr-portal-header sticky top-0 z-40 border-b border-[#dce8f4] bg-white/95 backdrop-blur">
      <div className="sr-portal-top mx-auto flex max-w-[1440px] items-center justify-between gap-5 px-4 py-3 md:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <span className="sr-portal-logo">+</span>
          <span className="min-w-0"><strong className="block truncate text-base font-extrabold tracking-tight text-[#0c2c59]">MedRoute</strong><small className="block truncate text-[10px] font-bold uppercase tracking-[.15em] text-slate-400">{label} · Connecting Care. Saving Lives.</small></span>
        </Link>
        <div className="flex items-center gap-2"><span className="sr-live hidden sm:inline-flex">Live network</span><span className="sr-portal-language hidden md:inline-flex">◎ English⌄</span>{role === "patient" && <Link to="/patient/hospitals" className="sr-btn-primary">Find a hospital <span aria-hidden="true">↗</span></Link>}{role === "doctor" && <Link to="/doctor/referral" className="sr-btn-primary">New referral <span aria-hidden="true">+</span></Link>}<span className="sr-portal-avatar">{roleInitial}</span></div>
      </div>
      <nav className="sr-portal-nav mx-auto flex max-w-[1440px] gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:px-8">{links.map(([text, path]) => <Link key={path} to={path} className={`sr-portal-link whitespace-nowrap rounded-xl px-3 py-2 text-xs font-extrabold ${location.pathname === path ? "active" : ""}`}><span aria-hidden="true">{icons[text] || "•"}</span>{text}</Link>)}</nav>
    </header>
  );
}

export default PortalNav;

