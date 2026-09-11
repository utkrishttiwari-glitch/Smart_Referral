import { Link } from "react-router-dom";
import PortalNav from "../components/PortalNav";

function PatientDashboard() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PortalNav role="patient" />
      <main className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">Patient care portal</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">How can SmartReferral help you today?</h1>
          <p className="mt-4 text-slate-500">Find the right care, speak with a doctor, and keep your medical information close at hand.</p>
        </div>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-3xl bg-white p-8 shadow-sm"><p className="text-sm font-bold uppercase tracking-widest text-blue-600">Hospital recommendation</p><h2 className="mt-3 text-3xl font-bold text-slate-900">Find the right hospital</h2><p className="mt-3 max-w-xl leading-7 text-slate-500">Tell us what care you need and SmartReferral will recommend suitable hospitals based on service availability, capacity, distance, and current data.</p><Link to="/patient/hospitals" className="mt-7 inline-flex rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700">Find a Hospital</Link></div>
          <div className="rounded-3xl bg-blue-700 p-8 text-white shadow-sm"><p className="text-sm font-bold uppercase tracking-widest text-blue-100">Live teleconsultation</p><h2 className="mt-3 text-2xl font-bold">Connect with a doctor remotely.</h2><Link to="/patient/teleconsultation" className="mt-7 inline-flex rounded-full bg-white px-5 py-3 text-sm font-bold text-blue-700">Start Consultation</Link></div>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold uppercase tracking-widest text-slate-400">My medical reports</p><h2 className="mt-2 text-2xl font-bold text-slate-900">Your records, ready when you need them.</h2></div><Link to="/patient/reports" className="text-sm font-bold text-blue-600">View All Reports</Link></div><p className="mt-4 text-sm text-slate-500">Connect your medical reports to keep consultations and hospital visits informed.</p></section>
      </main>
    </div>
  );
}

export default PatientDashboard;
