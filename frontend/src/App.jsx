import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Home from "./Pages/Home";
import Referral from "./Pages/Referral";
import Hospitals from "./Pages/Hospitals";
import Tracking from "./Pages/Tracking";
import HospitalDashboard from "./Pages/HospitalDashboard";
import Login from "./Pages/Login";
import PatientDashboard from "./Pages/PatientDashboard";
import PatientHospitals from "./Pages/PatientHospitals";
import PatientTeleconsultation from "./Pages/PatientTeleconsultation";
import PatientReports from "./Pages/PatientReports";
import DoctorDashboard from "./Pages/DoctorDashboard";
import DoctorReferral from "./Pages/DoctorReferral";
import DoctorInstantReferral from "./Pages/DoctorInstantReferral";
import PortalReferral from "./Pages/PortalReferral";
import PortalReferrals from "./Pages/PortalReferrals";
import PortalTracking from "./Pages/PortalTracking";
import HospitalPortalPage from "./Pages/HospitalPortalPage";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/referral"
          element={<Referral />}
        />

        <Route
          path="/hospitals"
          element={<Hospitals />}
        />

        <Route
          path="/tracking"
          element={<Tracking />}
        />

        <Route
          path="/hospital-dashboard"
          element={
            <HospitalDashboard />
          }
        />

        <Route path="/login" element={<Login />} />

        <Route path="/patient" element={<PatientDashboard />} />
        <Route path="/patient/hospitals" element={<PatientHospitals />} />
        <Route
          path="/patient/teleconsultation"
          element={<PatientTeleconsultation />}
        />
        <Route path="/patient/reports" element={<PatientReports />} />
        <Route
          path="/patient/referral"
          element={<PortalReferral role="patient" />}
        />
        <Route
          path="/patient/referrals"
          element={<PortalReferrals role="patient" />}
        />
        <Route
          path="/patient/tracking"
          element={<PortalTracking role="patient" />}
        />

        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route
          path="/doctor/referral"
          element={<DoctorReferral />}
        />
        <Route
          path="/doctor/instant-referral"
          element={<DoctorInstantReferral />}
        />
        <Route
          path="/doctor/referrals"
          element={<PortalReferrals role="doctor" />}
        />
        <Route
          path="/doctor/tracking"
          element={<PortalTracking role="doctor" />}
        />

        <Route path="/hospital" element={<HospitalDashboard />} />
        <Route
          path="/hospital/referrals"
          element={<HospitalPortalPage section="referrals" />}
        />
        <Route
          path="/hospital/transfers"
          element={<HospitalPortalPage section="transfers" />}
        />
        <Route
          path="/hospital/capacity"
          element={<HospitalPortalPage section="capacity" />}
        />
        <Route
          path="/hospital/verification"
          element={<HospitalPortalPage section="verification" />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;