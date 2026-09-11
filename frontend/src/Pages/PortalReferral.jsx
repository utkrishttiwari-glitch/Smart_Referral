import PortalNav from "../components/PortalNav";
import Referral from "./Referral";

function PortalReferral({ role }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <PortalNav role={role} />
      <Referral />
    </div>
  );
}

export default PortalReferral;
