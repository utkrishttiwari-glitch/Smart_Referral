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

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">+</span>
          <span>
            <strong className="block text-lg tracking-tight text-blue-900">SmartReferral</strong>
            <small className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</small>
          </span>
        </Link>

        <nav className="flex max-w-full flex-wrap items-center gap-2 md:gap-5">
          {links.map(([text, path]) => (
            <Link
              key={path}
              to={path}
              className={`rounded-full px-3 py-2 text-sm font-semibold transition ${location.pathname === path ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:text-blue-600"}`}
            >
              {text}
            </Link>
          ))}
          {role === "patient" && (
            <Link to="/patient/hospitals" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700">
              Find a Hospital
            </Link>
          )}
          {role === "doctor" && (
            <Link to="/doctor/referral" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700">
              New Referral
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default PortalNav;
