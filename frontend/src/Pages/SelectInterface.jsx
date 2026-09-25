import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Globe2, HeartPulse } from "lucide-react";
import { Link } from "react-router-dom";

const translations = {
  en: {
    welcome: "Welcome to Medi-Referral",
    heading: "CHOOSE YOUR ROLE",
    subheading: "Select the interface that best matches how you provide or receive care.",
    back: "Back to Medi-Referral",
    network: "Connected healthcare network",
    roles: {
      patient: "Patient",
      doctor: "Doctor",
      hospital: "Hospital",
      staff: "Medical Staff",
      medicine: "Medicine Provider",
    },
  },
  hi: {
    welcome: "Medi-Referral में आपका स्वागत है",
    heading: "अपनी भूमिका चुनें",
    subheading: "जारी रखने के लिए अपना इंटरफ़ेस चुनें।",
    back: "Medi-Referral पर वापस जाएं",
    network: "जुड़ा हुआ स्वास्थ्य नेटवर्क",
    roles: {
      patient: "मरीज़",
      doctor: "डॉक्टर",
      hospital: "अस्पताल",
      staff: "चिकित्सा स्टाफ",
      medicine: "दवा प्रदाता",
    },
  },
  mr: {
    welcome: "Medi-Referral मध्ये आपले स्वागत आहे",
    heading: "तुमची भूमिका निवडा",
    subheading: "सुरू ठेवण्यासाठी तुमचा इंटरफेस निवडा.",
    back: "Medi-Referral वर परत जा",
    network: "जोडलेले आरोग्य नेटवर्क",
    roles: {
      patient: "रुग्ण",
      doctor: "डॉक्टर",
      hospital: "रुग्णालय",
      staff: "वैद्यकीय कर्मचारी",
      medicine: "औषध पुरवठादार",
    },
  },
};

const interfaces = [
  {
    key: "patient",
    image: "/images/roles/patient-role.png",
    alt: "Patient",
    description: "Find trusted hospitals and keep your referral journey on track.",
    path: "/patient",
  },
  {
    key: "doctor",
    image: "/images/roles/doctor-role.png",
    alt: "Doctor",
    description: "Refer patients and coordinate the right care with confidence.",
    path: "/doctor",
  },
  {
    key: "hospital",
    image: "/images/roles/hospital-role.png",
    alt: "Hospital",
    description: "Manage referrals, capacity, services, and patient arrivals.",
    path: "/hospital",
  },
  {
    key: "staff",
    image: "/images/roles/medical-staff-role.png",
    alt: "Medical Staff",
    description: "Coordinate assigned transfers and keep care teams connected.",
    path: "/medical-staff/consultation",
  },
  {
    key: "medicine",
    image: "/images/roles/medicine-provider-role.png",
    alt: "Medicine Provider",
    description: "Keep essential medicines visible, available, and up to date.",
    path: "/medicine-provider",
  },
];

function SelectInterface() {
  const [language, setLanguage] = useState(
    () =>
      localStorage.getItem("medi-referral-language") ||
      localStorage.getItem("medroute-language") ||
      "en"
  );
  const [selectedRole, setSelectedRole] = useState(null);
  const copy = translations[language] || translations.en;

  useEffect(() => {
    localStorage.setItem("medi-referral-language", language);
  }, [language]);

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-[#f7fbff] text-[#10233f]">
      {/* Full-Page Background Artwork */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: "url('/images/interface/medi-referral-interface-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        aria-hidden="true"
      />

      {/* Subtle Light Overlay between Image and Role Cards */}
      <div
        className="fixed inset-0 z-0 pointer-events-none bg-white/80 backdrop-blur-[0.5px]"
        aria-hidden="true"
      />

      {/* Main Interactive Foreground Container */}
      <div className="relative z-10 mx-auto flex min-h-screen w-[min(100%-2rem,72rem)] flex-col justify-between py-4 sm:py-6">
        {/* Navigation Bar */}
        <header className="flex items-center justify-between gap-4">
          <Link
            to="/"
            className="group inline-flex items-center gap-3"
            aria-label="Medi-Referral home"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-[#1769e0] text-xl font-black text-white shadow-[0_8px_18px_rgba(23,105,224,0.2)] transition-transform group-hover:-rotate-3">
              <HeartPulse size={21} strokeWidth={2.5} />
            </span>
            <span>
              <strong className="block text-[1.08rem] font-black tracking-[-0.03em] text-[#0c2c59]">
                Medi-Referral
              </strong>
              <small className="hidden text-[0.58rem] font-extrabold uppercase tracking-[0.14em] text-[#7d91a6] sm:block">
                Connecting Care. Saving Lives.
              </small>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 rounded-full border border-[#dce8f4] bg-white/95 px-3 py-2 text-xs font-extrabold text-[#536c86] shadow-sm backdrop-blur-sm">
              <Globe2 size={14} aria-hidden="true" />
              <span className="sr-only">Language</span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                aria-label="Language"
                className="cursor-pointer border-0 bg-transparent text-xs font-extrabold text-[#34516f] outline-none"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="mr">मराठी</option>
              </select>
            </label>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#6f8198] transition-colors hover:text-[#1769e0]"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              <span className="hidden sm:inline">{copy.back}</span>
            </Link>
          </div>
        </header>

        {/* Heading Section */}
        <section className="mx-auto mt-4 max-w-2xl text-center sm:mt-6">
          <p className="mb-2 text-[0.7rem] font-black uppercase tracking-[0.18em] text-[#1769e0]">
            {copy.welcome}
          </p>
          <h1 className="text-3xl font-black uppercase tracking-[-0.04em] text-[#0c2c59] sm:text-4xl">
            {copy.heading}
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-xs sm:text-sm leading-relaxed text-[#6f8198]">
            {copy.subheading}
          </p>
          <div className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full border border-[#cfe3f5] bg-white/95 px-3.5 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.13em] text-[#1769e0] shadow-sm backdrop-blur-sm">
            <span className="size-1.5 rounded-full bg-[#1eb879] shadow-[0_0_0_4px_rgba(30,184,121,0.12)]" />
            {copy.network}
          </div>
        </section>

        {/* Role Cards Grid & Centered Layout */}
        <section
          className="mx-auto mt-6 w-full max-w-5xl space-y-6"
          aria-label="Medi-Referral roles"
        >
          {/* First Row: 3 Cards (Patient, Doctor, Hospital) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {interfaces.slice(0, 3).map((item) => (
              <RoleCard
                key={item.key}
                item={item}
                copy={copy}
                selected={selectedRole === item.key}
                onSelect={() => setSelectedRole(item.key)}
              />
            ))}
          </div>

          {/* Second Row: 2 Cards (Medical Staff, Medicine Provider) Centered as a Group */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
            {interfaces.slice(3).map((item) => (
              <div
                key={item.key}
                className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc((100%-2*1.5rem)/3)] lg:shrink-0"
              >
                <RoleCard
                  item={item}
                  copy={copy}
                  selected={selectedRole === item.key}
                  onSelect={() => setSelectedRole(item.key)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 pb-3 text-[0.68rem] font-extrabold text-[#8aa0b7]">
          <span>Patient</span>
          <i className="w-6 border-t border-dashed border-[#9fc8e9]" />
          <span>Doctor</span>
          <i className="w-6 border-t border-dashed border-[#9fc8e9]" />
          <strong className="text-[#1769e0]">Medi-Referral</strong>
          <i className="w-6 border-t border-dashed border-[#9fc8e9]" />
          <span>Hospital</span>
          <i className="w-6 border-t border-dashed border-[#9fc8e9]" />
          <span>Better care</span>
        </footer>
      </div>
    </main>
  );
}

function RoleCard({ item, copy, selected, onSelect }) {
  return (
    <Link
      to={item.path}
      onClick={onSelect}
      aria-label={`Continue as ${copy.roles[item.key]}`}
      className={`group relative flex h-[16.5rem] w-full flex-col overflow-hidden rounded-2xl border bg-white/95 p-3.5 shadow-md backdrop-blur-sm transition duration-200 ease-out hover:-translate-y-1 hover:border-[#1769e0] hover:shadow-lg focus-visible:-translate-y-1 focus-visible:border-[#1769e0] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1769e0]/15 ${
        selected
          ? "border-[#1769e0] bg-blue-50/95 ring-2 ring-[#1769e0]/30"
          : "border-slate-200"
      }`}
    >
      <div className="flex h-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#edf6fd] p-3">
        <img
          src={item.image}
          alt={item.alt}
          className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col px-1 pt-3">
        <h2 className="text-base font-black leading-5 tracking-[-0.03em] text-[#0c2c59]">
          {copy.roles[item.key]}
        </h2>
        <p className="mt-1.5 text-xs leading-4 text-[#6f8198] line-clamp-2">
          {item.description}
        </p>
        <span className="mt-auto flex items-center justify-between gap-2 pt-2 text-xs font-black text-[#1769e0]">
          Continue as {copy.roles[item.key]}
          <ArrowRight
            size={15}
            className="transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}

export default SelectInterface;
