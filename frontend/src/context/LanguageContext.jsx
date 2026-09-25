import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const translations = {
  en: {
    language: "Language",
    english: "English",
    hindi: "हिन्दी",
    marathi: "मराठी",
    home: "Home",
    howItWorks: "How It Works",
    about: "About",
    login: "Login",
    startMediReferral: "Start Medi-Referral",
    chooseYourRole: "Choose Your Role",
    welcome: "Welcome to Medi-Referral",
    roleSubheading: "Select the interface that best matches how you provide or receive care.",
    backToMediReferral: "Back to Medi-Referral",
    connectedHealthcareNetwork: "Connected healthcare network",
    patient: "Patient",
    doctor: "Doctor",
    hospital: "Hospital",
    medicalStaff: "Medical Staff",
    medicineProvider: "Medicine Provider",
    continueAs: "Continue as",
    patientPortal: "Patient Portal",
    doctorPortal: "Doctor Portal",
    hospitalPortal: "Hospital Portal",
    medicalPortal: "Medical Portal",
    medicinePortal: "Medicine Provider Portal",
    dashboard: "Dashboard",
    findHospital: "Find Hospital",
    liveTeleconsultation: "Live Teleconsultation",
    myMedicalReports: "My Medical Reports",
    medicineAvailability: "Medicine Availability",
    newReferral: "New Referral",
    instantReferral: "Instant Referral",
    referrals: "Referrals",
    hospitals: "Hospitals",
    tracking: "Tracking",
    consultations: "Consultations",
    incomingReferrals: "Incoming Referrals",
    activeTransfers: "Active Transfers",
    bedsServices: "Beds & Services",
    verification: "Verification",
    profile: "Profile",
    doctorConsultation: "Doctor Consultation",
    liveNetwork: "Live network",
    findAHospital: "Find a hospital",
    newReferralShort: "New referral",
    searchMedicine: "Search medicine...",
    updateAvailability: "Update Availability",
    updateAvailabilityTitle: "Update availability",
    availability: "Availability",
    quantity: "Quantity",
    cancel: "Cancel",
    update: "Update",
    active: "Active",
    inactive: "Inactive",
    lastUpdated: "Last Updated",
    total: "Total",
    available: "Available",
    lowStock: "Low Stock",
    outOfStock: "Out of Stock",
    readyToDispense: "Ready to dispense",
    reviewSoon: "Review soon",
    actionRequired: "Action required",
    medicineLabel: "Medicines",
    connectCare: "Connecting Care. Saving Lives.",
    close: "Close",
    noMedicinesMatch: "No medicines match your search.",
  },
  hi: {
    language: "भाषा",
    english: "English",
    hindi: "हिन्दी",
    marathi: "मराठी",
    home: "होम",
    howItWorks: "यह कैसे काम करता है",
    about: "हमारे बारे में",
    login: "लॉग इन",
    startMediReferral: "Medi-Referral शुरू करें",
    chooseYourRole: "अपनी भूमिका चुनें",
    welcome: "Medi-Referral में आपका स्वागत है",
    roleSubheading: "जारी रखने के लिए अपना सही इंटरफ़ेस चुनें।",
    backToMediReferral: "Medi-Referral पर वापस जाएँ",
    connectedHealthcareNetwork: "जुड़ा हुआ स्वास्थ्य नेटवर्क",
    patient: "मरीज़",
    doctor: "डॉक्टर",
    hospital: "अस्पताल",
    medicalStaff: "चिकित्सा कर्मचारी",
    medicineProvider: "दवा प्रदाता",
    continueAs: "इस रूप में जारी रखें",
    patientPortal: "मरीज़ पोर्टल",
    doctorPortal: "डॉक्टर पोर्टल",
    hospitalPortal: "अस्पताल पोर्टल",
    medicalPortal: "चिकित्सा कर्मचारी पोर्टल",
    medicinePortal: "दवा प्रदाता पोर्टल",
    dashboard: "डैशबोर्ड",
    findHospital: "अस्पताल खोजें",
    liveTeleconsultation: "लाइव टेलीकंसल्टेशन",
    myMedicalReports: "मेरी मेडिकल रिपोर्ट्स",
    medicineAvailability: "दवा उपलब्धता",
    newReferral: "नया रेफरल",
    instantReferral: "तत्काल रेफरल",
    referrals: "रेफरल",
    hospitals: "अस्पताल",
    tracking: "ट्रैकिंग",
    consultations: "कंसल्टेशन",
    incomingReferrals: "आने वाले रेफरल",
    activeTransfers: "सक्रिय स्थानांतरण",
    bedsServices: "बेड और सेवाएँ",
    verification: "सत्यापन",
    profile: "प्रोफ़ाइल",
    doctorConsultation: "डॉक्टर कंसल्टेशन",
    liveNetwork: "लाइव नेटवर्क",
    findAHospital: "अस्पताल खोजें",
    newReferralShort: "नया रेफरल",
    searchMedicine: "दवा खोजें...",
    updateAvailability: "उपलब्धता अपडेट करें",
    updateAvailabilityTitle: "उपलब्धता अपडेट करें",
    availability: "उपलब्धता",
    quantity: "मात्रा",
    cancel: "रद्द करें",
    update: "अपडेट करें",
    active: "सक्रिय",
    inactive: "निष्क्रिय",
    lastUpdated: "अंतिम अपडेट",
    total: "कुल",
    available: "उपलब्ध",
    lowStock: "कम स्टॉक",
    outOfStock: "स्टॉक खत्म",
    readyToDispense: "वितरण के लिए तैयार",
    reviewSoon: "शीघ्र समीक्षा",
    actionRequired: "कार्रवाई आवश्यक",
    medicineLabel: "दवाएँ",
    connectCare: "Connecting Care. Saving Lives.",
    close: "बंद करें",
    noMedicinesMatch: "कोई दवा आपके खोज से नहीं मिलती।",
  },
  mr: {
    language: "भाषा",
    english: "English",
    hindi: "हिन्दी",
    marathi: "मराठी",
    home: "मुख्यपृष्ठ",
    howItWorks: "हे कसे कार्य करते",
    about: "आमच्याबद्दल",
    login: "लॉगिन",
    startMediReferral: "Medi-Referral सुरू करा",
    chooseYourRole: "तुमची भूमिका निवडा",
    welcome: "Medi-Referral मध्ये आपले स्वागत आहे",
    roleSubheading: "सर्वोत्तम अनुभवासाठी आपला इंटरफेस निवडा.",
    backToMediReferral: "Medi-Referral वर परत जा",
    connectedHealthcareNetwork: "जोडलेले आरोग्य नेटवर्क",
    patient: "रुग्ण",
    doctor: "डॉक्टर",
    hospital: "रुग्णालय",
    medicalStaff: "वैद्यकीय कर्मचारी",
    medicineProvider: "औषध प्रदाता",
    continueAs: "याप्रमाणे पुढे जा",
    patientPortal: "रुग्ण पोर्टल",
    doctorPortal: "डॉक्टर पोर्टल",
    hospitalPortal: "रुग्णालय पोर्टल",
    medicalPortal: "वैद्यकीय कर्मचारी पोर्टल",
    medicinePortal: "औषध प्रदाता पोर्टल",
    dashboard: "डॅशबोर्ड",
    findHospital: "रुग्णालय शोधा",
    liveTeleconsultation: "लाइव्ह टेलिकन्सल्टेशन",
    myMedicalReports: "माझे वैद्यकीय अहवाल",
    medicineAvailability: "औषध उपलब्धता",
    newReferral: "नवीन रेफरल",
    instantReferral: "तुरळक रेफरल",
    referrals: "रेफरल",
    hospitals: "रुग्णालये",
    tracking: "ट्रॅकिंग",
    consultations: "सल्लामसलत",
    incomingReferrals: "येणारे रेफरल",
    activeTransfers: "सक्रिय हस्तांतरण",
    bedsServices: "बेड आणि सेवा",
    verification: "सत्यापन",
    profile: "प्रोफाइल",
    doctorConsultation: "डॉक्टर सल्लामसलत",
    liveNetwork: "लाइव्ह नेटवर्क",
    findAHospital: "रुग्णालय शोधा",
    newReferralShort: "नवीन रेफरल",
    searchMedicine: "औषध शोधा...",
    updateAvailability: "उपलब्धता अपडेट करा",
    updateAvailabilityTitle: "उपलब्धता अपडेट करा",
    availability: "उपलब्धता",
    quantity: "प्रमाण",
    cancel: "रद्द करा",
    update: "अपडेट करा",
    active: "सक्रिय",
    inactive: "निष्क्रिय",
    lastUpdated: "अंतिम अपडेट",
    total: "एकूण",
    available: "उपलब्ध",
    lowStock: "कमी स्टॉक",
    outOfStock: "स्टॉक नाही",
    readyToDispense: "वितरणासाठी तयार",
    reviewSoon: "लवकर तपासा",
    actionRequired: "कारवाई आवश्यक",
    medicineLabel: "औषधे",
    connectCare: "Connecting Care. Saving Lives.",
    close: "बंद करा",
    noMedicinesMatch: "तुमच्या शोधाशी जुळणारी औषधे नाहीत.",
  },
};

const LANGUAGE_STORAGE_KEY = "language";
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    if (typeof window === "undefined") return "en";

    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY)
      || localStorage.getItem("medi-referral-language")
      || localStorage.getItem("medroute-language")
      || "en";

    return translations[saved] ? saved : "en";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    }
  }, [language]);

  const value = useMemo(() => {
    const t = (key, fallbackValue) => {
      const lookup = translations[language]?.[key];
      return lookup || translations.en[key] || fallbackValue || key;
    };

    return { language, setLanguage, t };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
}
