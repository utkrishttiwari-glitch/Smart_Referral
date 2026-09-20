import { useEffect, useState } from "react";
import PortalNav from "../components/PortalNav";

function PatientMedicines() {
  const [providers, setProviders] = useState([]);
  const [query, setQuery] = useState("");
  useEffect(() => { fetch(import.meta.env.VITE_API_URL + "/api/coordination/medicine-providers").then((response) => response.json()).then((result) => setProviders(result.data || [])); }, []);
  const medicines = providers.flatMap((provider) => provider.medicines.filter((medicine) => medicine.medicineName.toLowerCase().includes(query.toLowerCase())).map((medicine) => ({ ...medicine, provider })));
  return <div className="min-h-screen bg-slate-50"><PortalNav role="patient" /><main className="mx-auto max-w-6xl px-5 py-10 md:px-8"><p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">Prescription support</p><h1 className="mt-3 text-4xl font-extrabold text-slate-900">Find medicine availability</h1><p className="mt-4 max-w-2xl text-slate-500">Search availability for a medicine already prescribed by your doctor. MedRoute does not recommend medicines or dosages.</p><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search medicine name" className="mt-8 w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 outline-none focus:border-blue-500" /><section className="mt-6 grid gap-4 md:grid-cols-2">{medicines.map((medicine) => <article key={`${medicine.provider.id}-${medicine.id}`} className="rounded-3xl bg-white p-6 shadow-sm"><div className="flex items-center justify-between gap-4"><h2 className="text-lg font-bold text-slate-900">{medicine.medicineName}</h2><span className={`rounded-full px-3 py-1 text-xs font-bold ${medicine.status === "AVAILABLE" ? "bg-emerald-50 text-emerald-700" : medicine.status === "LOW_STOCK" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{medicine.status.replaceAll("_", " ")}</span></div><p className="mt-3 font-semibold text-slate-700">{medicine.provider.name}</p><p className="mt-1 text-sm text-slate-500">{medicine.provider.location}</p><p className="mt-4 text-xs text-slate-400">Updated {new Date(medicine.updatedAt).toLocaleString()}</p></article>)}{!medicines.length && <p className="rounded-3xl bg-white p-8 text-sm text-slate-500 shadow-sm">No provider availability matches this search.</p>}</section></main></div>;
}
export default PatientMedicines;

