import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PortalNav from "../components/PortalNav";

function Hospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { fetch(import.meta.env.VITE_API_URL + "/api/hospitals").then(async (response) => { const result = await response.json(); if (!response.ok || !result.success) throw new Error(result.message || "Unable to load hospitals."); setHospitals(result.data || []); }).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false)); }, []);
  return <div className="sr-page"><PortalNav role="doctor" /><main className="sr-shell py-8 md:py-12"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="sr-eyebrow">Hospital network</p><h1 className="sr-title mt-3 text-4xl font-extrabold md:text-5xl">Connected hospitals</h1><p className="mt-3 max-w-xl text-[#6f8198]">Browse active facilities in the MedRoute network. Service-level availability is checked when you search for care.</p></div><span className="sr-live">Live network</span></div>{error && <div className="mt-6 rounded-2xl border border-[#f2c7ca] bg-[#fff1f2] p-4 text-sm font-bold text-[#b63d47]">{error}</div>}{loading ? <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{[1,2,3].map((item) => <div key={item} className="h-72 animate-pulse rounded-[24px] bg-white" />)}</div> : <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{hospitals.map((hospital) => <HospitalCard key={hospital.id} hospital={hospital} />)}{!hospitals.length && <div className="sr-card p-8 text-sm text-[#6f8198]">No active hospitals are available right now.</div>}</div>}</main></div>;
}
function HospitalCard({ hospital }) { return <article className="sr-card group overflow-hidden transition hover:-translate-y-1 hover:border-[#9fc8f1]"><div className="sr-illustration flex h-36 items-end p-5"><div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">🏥</div><span className="relative z-10 ml-auto rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#14845c]">Active facility</span></div><div className="p-6"><h2 className="text-xl font-extrabold text-[#0c2c59]">{hospital.name}</h2><p className="mt-2 text-sm text-[#6f8198]">⌖ {hospital.city}{hospital.state ? `, ${hospital.state}` : ""}</p><div className="mt-5 grid grid-cols-2 gap-3"><Info label="Phone" value={hospital.phone || "Not listed"} /><Info label="Coverage" value="Services checked live" /></div><Link to="/patient/hospitals" className="mt-6 inline-flex text-sm font-extrabold text-[#1769e0]">Search services here <span className="ml-2">→</span></Link></div></article>; }
function Info({ label, value }) { return <div className="rounded-2xl bg-[#f5f9fd] p-3"><p className="text-[10px] font-black uppercase tracking-wider text-[#8aa0b7]">{label}</p><p className="mt-1 truncate text-xs font-bold text-[#34516f]">{value}</p></div>; }
export default Hospitals;


