import { Link } from "react-router-dom";

const interfaces = [
  { icon: "○", title: "Patient", description: "Find hospitals, teleconsult with verified doctors and manage medical reports.", path: "/patient", action: "Enter Patient Portal" },
  { icon: "✚", title: "Doctor", description: "Refer patients, use Instant Emergency Referral and coordinate care.", path: "/doctor", action: "Enter Doctor Portal" },
  { icon: "□", title: "Hospital", description: "Manage referrals, beds, services and pre-arrival coordination.", path: "/hospital-dashboard", action: "Enter Hospital Portal" },
  { icon: "⇢", title: "Medical Staff", description: "Manage assigned patients, live tracking and doctor consultation during transport.", path: "/medical-staff/consultation", action: "Enter Staff Portal" },
  { icon: "▣", title: "Medicine Provider", description: "Update medicine availability and help patients locate available medicines.", path: "/medicine-provider", action: "Enter Provider Portal" },
];

function SelectInterface() {
  return <main className="min-h-screen bg-[#f5f9fd] px-5 py-8 md:px-8"><div className="mx-auto max-w-6xl"><Link to="/" className="inline-flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">+</span><span><strong className="block text-lg tracking-tight text-[#092b5c]">SmartReferral</strong><small className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400">Emergency Care Network</small></span></Link><div className="mx-auto mt-20 max-w-2xl text-center"><p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">Enter the platform</p><h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[#092b5c] md:text-5xl">How would you like to use SmartReferral?</h1><p className="mt-5 leading-7 text-slate-500">Choose the interface that matches your role. You can explore the prototype without creating an account.</p></div><div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{interfaces.map((item) => <Link key={item.title} to={item.path} className="group flex min-h-64 flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-700">{item.icon}</span><h2 className="mt-6 text-xl font-bold text-[#092b5c]">{item.title}</h2><p className="mt-2 flex-1 text-sm leading-6 text-slate-500">{item.description}</p><span className="mt-6 text-sm font-bold text-blue-600 group-hover:text-blue-700">{item.action} →</span></Link>)}</div></div></main>;
}

export default SelectInterface;
