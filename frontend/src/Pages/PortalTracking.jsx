import PortalNav from "../components/PortalNav";
import Tracking from "./LiveTracking";

function PortalTracking({ role }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <PortalNav role={role} />
      <Tracking />
    </div>
  );
}

export default PortalTracking;
