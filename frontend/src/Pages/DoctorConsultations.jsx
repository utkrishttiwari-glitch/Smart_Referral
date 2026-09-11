import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import PortalNav from "../components/PortalNav";

const API = "http://localhost:5000/api/coordination";

function DoctorConsultations() {
  const [consultations, setConsultations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");

  async function loadConsultations() {
    const response = await fetch(`${API}/consultations`);
    const result = await response.json();
    if (result.success) setConsultations(result.data || []);
  }

  useEffect(() => {
    loadConsultations();
    const socket = io("http://localhost:5000");
    socket.on("consultation-status-updated", loadConsultations);
    socket.on("consultation-message", loadConsultations);
    return () => socket.disconnect();
  }, []);

  async function updateStatus(status) {
    if (!selected) return;
    await fetch(`${API}/consultations/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setNotice(`Consultation marked ${status.toLowerCase()}.`);
    await loadConsultations();
  }

  async function sendInstruction() {
    if (!selected || !message.trim()) return;
    await fetch(`${API}/consultations/${selected.id}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ senderRole: "DOCTOR", senderName: selected.doctorName || "Verified doctor", messageType: "DOCTOR_INSTRUCTION", content: message.trim() }) });
    setMessage("");
    setNotice("Instruction sent to the patient or medical staff context.");
  }

  return <div className="min-h-screen bg-slate-50"><PortalNav role="doctor" /><main className="mx-auto max-w-7xl px-5 py-10 md:px-8"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">Verified clinician workspace</p><h1 className="mt-3 text-4xl font-extrabold text-slate-900">Consultation requests</h1><p className="mt-3 max-w-2xl text-slate-500">Review requests and send structured clinical instructions. SmartReferral does not generate prescriptions or medical advice.</p></div><span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">Verified doctor channel</span></div>{notice && <p className="mt-6 rounded-2xl bg-blue-50 p-4 text-sm font-semibold text-blue-800">{notice}</p>}<div className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]"><section className="space-y-3">{consultations.length === 0 && <div className="rounded-3xl bg-white p-8 text-sm text-slate-500 shadow-sm">No consultation requests yet.</div>}{consultations.map((consultation) => <button type="button" key={consultation.id} onClick={() => setSelected(consultation)} className={`w-full rounded-2xl border bg-white p-5 text-left shadow-sm ${selected?.id === consultation.id ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"}`}><div className="flex items-center justify-between gap-3"><h2 className="font-bold text-slate-900">{consultation.patientName}</h2><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{consultation.status}</span></div><p className="mt-2 text-sm text-slate-500">{consultation.doctorName} · {consultation.specialization}</p>{consultation.medicalStaffName && <p className="mt-1 text-xs text-slate-400">Medical staff: {consultation.medicalStaffName} {consultation.ambulanceNumber ? `· ${consultation.ambulanceNumber}` : ""}</p>}</button>)}</section><section className="rounded-3xl bg-white p-7 shadow-sm">{selected ? <><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Consultation #{selected.id}</p><h2 className="mt-2 text-2xl font-bold text-slate-900">{selected.patientName}</h2><p className="mt-2 text-sm text-slate-500">{selected.context || "Patient consultation"}</p><div className="mt-6 flex flex-wrap gap-2"><button type="button" onClick={() => updateStatus("ACCEPTED")} className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white">Accept</button><button type="button" onClick={() => updateStatus("IN_PROGRESS")} className="rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white">Start Consultation</button><button type="button" onClick={() => updateStatus("COMPLETED")} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600">Complete</button></div><div className="mt-8 border-t border-slate-100 pt-6"><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Structured doctor instruction</p><textarea value={message} onChange={(event) => setMessage(event.target.value)} rows="5" placeholder="Example: Monitor vitals continuously. Keep patient stable. Prepare for immediate handover on arrival." className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-blue-500" /><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => setMessage("Monitor vitals continuously. Keep patient stable. Prepare for immediate handover on arrival.")} className="rounded-full border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700">Use handover template</button><button type="button" onClick={sendInstruction} className="rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white">Send Instruction</button></div></div></> : <div className="flex min-h-80 items-center justify-center text-center text-sm text-slate-500">Select a consultation request to review its patient and transport context.</div>}</section></div></main></div>;
}

export default DoctorConsultations;
