import { useState } from "react";
import PortalNav from "../components/PortalNav";

const categories = ["All", "Lab Reports", "Imaging", "Prescriptions", "Consultation Notes", "Other"];

function PatientReports() {
  const [category, setCategory] = useState("All");
  const [selectedFile, setSelectedFile] = useState(null);

  return <div className="min-h-screen bg-slate-50"><PortalNav role="patient" /><main className="mx-auto max-w-7xl px-5 py-10 md:px-8"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">Personal health records</p><h1 className="mt-3 text-4xl font-extrabold text-slate-900">My medical reports</h1><p className="mt-4 max-w-2xl text-slate-500">Keep your reports ready for future consultations. Reports will be connected to persistent storage when that service is enabled.</p></div><label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"><span>+ Upload Medical Report</span><input type="file" className="hidden" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} /></label></div>{selectedFile && <p className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-semibold text-blue-800">{selectedFile.name} is ready to connect to report storage. No upload was sent.</p>}<div className="mt-8 flex gap-2 overflow-x-auto pb-2">{categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${category === item ? "bg-blue-600 text-white" : "bg-white text-slate-500 shadow-sm"}`}>{item}</button>)}</div><section className="mt-4 rounded-3xl bg-white p-10 text-center shadow-sm"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600">+</div><h2 className="mt-5 text-xl font-bold text-slate-900">No {category === "All" ? "medical reports" : category.toLowerCase()} connected yet</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Uploaded reports will appear here with their date, type, uploader, and file actions once persistent report storage is connected.</p></section></main></div>;
}

export default PatientReports;
