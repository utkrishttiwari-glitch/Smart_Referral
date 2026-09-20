import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const workflow = [
  ["01", "FIND", "⌖", "A hospital with the care you need."],
  ["02", "REFER", "▤", "A clear clinical handover."],
  ["03", "TRACK", "🚑", "A live route to the destination."],
  ["04", "TREAT", "✚", "A prepared receiving team."],
];

function Home() {
  const [services, setServices] = useState([]);
  useEffect(() => { fetch(import.meta.env.VITE_API_URL + "/api/services").then((response) => response.json()).then((result) => setServices(result.data || [])).catch(() => setServices([])); }, []);

  return <div className="sr-page min-h-screen overflow-hidden"><Navbar /><main>
    <section className="sr-hero mx-auto max-w-7xl px-5 pb-16 pt-32 md:px-8 md:pt-40"><div className="grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr]">
      <div><p className="sr-eyebrow">Emergency care coordination</p><h1 className="sr-title mt-4 max-w-xl text-5xl font-black leading-[.98] md:text-7xl">Connecting care.<br /><span className="text-[#1769e0]">Saving lives.</span></h1><p className="mt-6 max-w-lg text-lg leading-8 text-[#60758a]">One connected platform for hospital discovery, intelligent referrals, emergency coordination and live patient tracking.</p><p className="mt-4 text-sm font-extrabold text-[#34516f]">Right Patient. Right Hospital. Right Time.</p><div className="mt-8 flex flex-wrap gap-3"><Link to="/select-interface" className="sr-btn-primary rounded-full px-6 py-4">Start MedRoute <span>↗</span></Link><Link to="/login" className="sr-btn-secondary rounded-full px-6 py-4">Login</Link></div><div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-extrabold text-[#6f8198]"><span className="text-[#14845c]">✓ Live hospital signals</span><span className="text-[#14845c]">✓ Explainable matching</span><span className="text-[#14845c]">✓ Connected handover</span></div></div>
      <NetworkHero />
    </div></section>

    <section id="services" className="border-y border-[#dce8f4] bg-white px-5 py-16 md:px-8"><div className="mx-auto max-w-7xl"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="sr-eyebrow">Care services</p><h2 className="sr-title mt-2 text-3xl font-black">Start with the care you need.</h2></div><Link to="/patient/hospitals" className="text-sm font-extrabold text-[#1769e0]">Find a hospital →</Link></div><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{services.length ? services.map((service, index) => <ServiceTile key={service.id} service={service} index={index} />) : <p className="text-sm text-[#6f8198]">Care services will appear when the network is available.</p>}</div></div></section>

    <section id="how-it-works" className="px-5 py-16 md:px-8"><div className="mx-auto max-w-7xl"><div className="max-w-xl"><p className="sr-eyebrow">One connected workflow</p><h2 className="sr-title mt-2 text-3xl font-black">Find → Refer → Track → Treat</h2><p className="mt-3 text-[#6f8198]">Every handoff gives the next care team the context they need.</p></div><div className="mt-9 grid gap-4 md:grid-cols-4">{workflow.map(([number, title, icon, text], index) => <div key={title} className="sr-workflow-card"><div className="flex items-start justify-between"><span className="text-xs font-black tracking-widest text-[#8aa0b7]">{number}</span><span className="sr-workflow-icon">{icon}</span></div><h3 className="mt-8 text-lg font-black text-[#0c2c59]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#6f8198]">{text}</p>{index < workflow.length - 1 && <span className="sr-workflow-arrow">→</span>}</div>)}</div></div></section>

    <section className="bg-[#eaf4ff] px-5 py-16 md:px-8"><div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.75fr_1.25fr] lg:items-center"><div><p className="sr-eyebrow">One network, many perspectives</p><h2 className="sr-title mt-2 text-3xl font-black">Mobile care meets the command center.</h2><p className="mt-4 max-w-md leading-7 text-[#60758a]">Patients, doctors, hospitals and ambulance teams see the same journey through the view built for their role.</p></div><div className="grid gap-4 sm:grid-cols-3"><MiniPanel icon="⌖" title="Patient app" lines={["Find care", "Track arrival"]} /><MiniPanel icon="▤" title="Clinical desk" lines={["Refer safely", "Review signals"]} /><MiniPanel icon="🚑" title="Live transport" lines={["Share location", "Consult doctor"]} /></div></div></section>
  </main><Footer /></div>;
}

function NetworkHero() { return <div className="sr-network-hero"><div className="sr-network-grid" /><div className="sr-network-label">CONNECTED CARE NETWORK <span className="sr-live">Live</span></div><div className="sr-network-orbit orbit-one" /><div className="sr-network-orbit orbit-two" /><NetworkNode className="node-patient" icon="●" label="Patient" /><NetworkNode className="node-doctor" icon="✚" label="Doctor" /><NetworkNode className="node-medroute" icon="+" label="MedRoute" primary /><NetworkNode className="node-hospital" icon="🏥" label="Hospital" /><NetworkNode className="node-ambulance" icon="🚑" label="Ambulance" /><div className="sr-network-caption"><span>FIND</span><span>REFER</span><span>TRACK</span><span>TREAT</span></div></div>; }
function NetworkNode({ className, icon, label, primary = false }) { return <div className={`sr-network-node ${primary ? "primary" : ""} ${className}`}><span>{icon}</span><strong>{label}</strong></div>; }
function ServiceTile({ service, index }) { const name = String(service.name || "").toLowerCase(); const icon = name.includes("trauma") ? "✦" : name.includes("card") ? "♡" : "✚"; return <article className="sr-card group p-5 transition hover:-translate-y-1 hover:border-[#8ebce8]"><div className="flex items-center justify-between"><span className="sr-service-icon">{icon}</span><span className="text-xs font-black text-[#9bb0c5]">0{index + 1}</span></div><h3 className="mt-5 text-lg font-black text-[#0c2c59]">{service.name}</h3><p className="mt-2 text-sm leading-6 text-[#6f8198]">{service.description || "Specialist care matched to current hospital availability."}</p><Link to="/patient/hospitals" className="mt-5 inline-flex text-xs font-black text-[#1769e0]">Check availability →</Link></article>; }
function MiniPanel({ icon, title, lines }) { return <div className="sr-card p-5"><span className="sr-mini-icon">{icon}</span><h3 className="mt-4 font-black text-[#0c2c59]">{title}</h3>{lines.map((line) => <p key={line} className="mt-2 text-xs font-bold text-[#6f8198]">{line}</p>)}</div>; }
export default Home;
