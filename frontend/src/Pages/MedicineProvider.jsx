import { useEffect, useState } from "react";
import PortalNav from "../components/PortalNav";

const API = import.meta.env.VITE_API_URL + "/api/coordination";
const statusOptions = ["AVAILABLE", "LOW_STOCK", "OUT_OF_STOCK"];

function MedicineProvider() {
  const [providers, setProviders] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ medicineName: "", status: "AVAILABLE", quantity: "" });

  async function loadProviders() {
    try {
      const response = await fetch(`${API}/medicine-providers`);
      
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to load medicine providers.");
      setProviders(result.data || []);
    } catch (requestError) { setError(requestError.message); }
  }

  useEffect(() => { loadProviders(); }, []);

  async function updateAvailability(event) {
    event.preventDefault();
    const provider = providers[0];
    if (!provider || !form.medicineName) return;
    const response = await fetch(`${API}/medicine-providers/${provider.id}/availability`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, quantity: form.quantity === "" ? null : Number(form.quantity) }) });
    const result = await response.json();
    if (!response.ok || !result.success) { setError(result.message || "Unable to update availability."); return; }
    setForm({ medicineName: "", status: "AVAILABLE", quantity: "" });
    loadProviders();
  }

  return <div className="min-h-screen bg-slate-50"><PortalNav role="medicine" /><main className="mx-auto max-w-6xl px-5 py-10 md:px-8"><p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">Local medicine availability</p><h1 className="mt-3 text-4xl font-extrabold text-slate-900">Medicine Provider</h1><p className="mt-4 max-w-2xl text-slate-500">Show availability for medicines already prescribed by a doctor or hospital. MedRoute does not prescribe or recommend medicines.</p>{error && <p className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">{error}</p>}<div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.8fr]">{providers.map((provider) => <section key={provider.id} className="rounded-3xl bg-white p-7 shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-slate-400">{provider.role.replaceAll("_", " ")}</p><h2 className="mt-2 text-2xl font-bold text-slate-900">{provider.name}</h2><p className="mt-1 text-sm text-slate-500">{provider.location}</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Active</span></div><div className="mt-7 space-y-3">{provider.medicines.map((medicine) => <div key={medicine.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"><div><p className="font-bold text-slate-800">{medicine.medicineName}</p><p className="text-xs text-slate-400">Updated {new Date(medicine.updatedAt).toLocaleString()}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${medicine.status === "AVAILABLE" ? "bg-emerald-100 text-emerald-700" : medicine.status === "LOW_STOCK" ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-600"}`}>{medicine.status.replaceAll("_", " ")}</span></div>)}</div></section>)}<form onSubmit={updateAvailability} className="rounded-3xl bg-white p-7 shadow-sm"><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Provider update</p><h2 className="mt-2 text-2xl font-bold text-slate-900">Update availability</h2><div className="mt-6 space-y-4"><input required value={form.medicineName} onChange={(event) => setForm({ ...form, medicineName: event.target.value })} placeholder="Medicine name" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500" /><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">{statusOptions.map((status) => <option key={status}>{status}</option>)}</select><input type="number" min="0" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} placeholder="Quantity (optional)" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500" /><button className="w-full rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700">Update Availability</button></div></form></div></main></div>;
}

export default MedicineProvider;

