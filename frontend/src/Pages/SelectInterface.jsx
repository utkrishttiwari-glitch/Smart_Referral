import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { User, Stethoscope, Building2, Users, Pill } from "lucide-react";

const translations = {
  en: { welcome: "Welcome to MedRoute", heading: "Choose Your Interface", subheading: "Choose how you want to connect with healthcare.", back: "Back to MedRoute", network: "Connected healthcare network", enter: "Enter", roles: { patient: "Patient", doctor: "Doctor", hospital: "Hospital", staff: "Medical Staff", medicine: "Medicine Provider" } },
  hi: { welcome: "MedRoute में आपका स्वागत है", heading: "अपना इंटरफ़ेस चुनें", subheading: "चुनें कि आप स्वास्थ्य सेवा से कैसे जुड़ना चाहते हैं।", back: "MedRoute पर वापस जाएं", network: "जुड़ा हुआ स्वास्थ्य नेटवर्क", enter: "प्रवेश करें", roles: { patient: "मरीज़", doctor: "डॉक्टर", hospital: "अस्पताल", staff: "चिकित्सा स्टाफ", medicine: "दवा प्रदाता" } },
  mr: { welcome: "MedRoute मध्ये आपले स्वागत आहे", heading: "तुमचा इंटरफेस निवडा", subheading: "तुम्हाला आरोग्यसेवेशी कसे जोडायचे आहे ते निवडा.", back: "MedRoute वर परत जा", network: "जोडलेले आरोग्य नेटवर्क", enter: "प्रवेश करा", roles: { patient: "रुग्ण", doctor: "डॉक्टर", hospital: "रुग्णालय", staff: "वैद्यकीय कर्मचारी", medicine: "औषध पुरवठादार" } },
};

const interfaces = [
  { key: "patient", image: "/assets/roles/patient.svg", alt: "Patient using a healthcare application", description: "Find hospitals, consult doctors and manage your medical reports.", features: ["Find Hospital", "Teleconsultation", "Medical Reports", "Track Referral"], path: "/patient", accent: "blue" },
  { key: "doctor", image: "/assets/roles/doctor.svg", alt: "Doctor coordinating patient care", description: "Refer patients and coordinate emergency care.", features: ["Standard Referral", "Instant Referral", "Hospital Matching", "Patient Tracking"], path: "/doctor", accent: "royal" },
  { key: "hospital", image: "/assets/roles/hospital.svg", alt: "Hospital command center", description: "Manage referrals, services, beds and pre-arrival coordination.", features: ["Incoming Referrals", "Bed Availability", "Service Availability", "Verification"], path: "/hospital-dashboard", accent: "green" },
  { key: "staff", image: "/assets/roles/medical-staff.svg", alt: "Paramedic coordinating ambulance transport", description: "Coordinate patient transport, tracking and doctor consultation.", features: ["Assigned Patient", "Live Tracking", "Doctor Consultation", "Ambulance Coordination"], path: "/medical-staff/consultation", accent: "red" },
  { key: "medicine", image: "/assets/roles/medicine-provider.svg", alt: "Medicine provider with stocked pharmacy", description: "Update medicine availability and help patients find required medicines.", features: ["Medicine Availability", "Stock Updates", "Provider Profile", "Last Updated"], path: "/medicine-provider", accent: "mint" },
];

function SelectInterface() {
  const [language, setLanguage] = useState(() => localStorage.getItem("medroute-language") || "en");
  const copy = translations[language];
  useEffect(() => { localStorage.setItem("medroute-language", language); }, [language]);
  return <main className="sr-role-page"><div className="sr-role-network" aria-hidden="true"><span>⌖</span><span>✚</span><span>🏥</span><span>🚑</span><span>♡</span></div><div className="sr-role-shell"><header className="sr-role-header"><Link to="/" className="sr-role-brand"><span className="sr-role-logo">+</span><span><strong>MedRoute</strong><small>Connecting Care. Saving Lives.</small></span></Link><div className="flex items-center gap-3"><label className="sr-language"><span aria-hidden="true">◎</span><span className="sr-only">Language</span><select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label="Language"><option value="en">English</option><option value="hi">हिन्दी</option><option value="mr">मराठी</option></select></label><Link to="/" className="sr-back">← <span className="hidden sm:inline">{copy.back}</span></Link></div></header><section className="sr-role-intro"><p className="sr-eyebrow">{copy.welcome}</p><h1>{copy.heading}</h1><p>{copy.subheading}</p></section><div className="sr-network-pill"><span className="sr-network-pulse" />{copy.network}</div><section className="sr-role-grid" aria-label="MedRoute roles">{interfaces.map((item) => <RoleCard key={item.key} item={item} copy={copy} />)}</section><footer className="sr-role-footer"><span>Patient</span><i /> <span>Doctor</span><i /> <strong>MedRoute</strong><i /> <span>Hospital</span><i /> <span>Better care</span></footer></div></main>;
}

function RoleCard({ item, copy }) { return <Link to={item.path} className={`sr-role-card accent-${item.accent}`}><div className="sr-role-image"><img src={item.image} alt={item.alt} /><span className="sr-role-icon">{item.key === "patient" ? "●" : item.key === "doctor" ? "✚" : item.key === "hospital" ? "⌂" : item.key === "staff" ? "🚑" : "✦"}</span></div><div className="sr-role-body"><div className="flex items-center justify-between gap-3"><h2>{copy.roles[item.key]}</h2>{item.key === "doctor" && <span className="sr-emergency-dot">Emergency</span>}</div><p>{item.description}</p><ul>{item.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul><span className="sr-role-cta">{copy.enter} {copy.roles[item.key]} <b>→</b></span></div></Link>; }

export default SelectInterface;

