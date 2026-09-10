import { Link, useNavigate } from "react-router-dom";

const roles = [
  { id: "patient", title: "Patient", description: "Find care, talk with a doctor, and access your medical reports." },
  { id: "doctor", title: "Doctor", description: "Coordinate referrals with clinical context." },
  { id: "hospital", title: "Hospital", description: "Manage referrals, capacity, and arrivals." },
];

function Login() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-[#eaf4ff] px-5 py-10 md:px-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/" className="font-bold text-blue-700">SmartReferral</Link>
        <div className="mx-auto mt-16 max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">Demo access</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">Choose your portal</h1>
          <p className="mt-4 text-slate-500">Select a role to explore the SmartReferral experience.</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {roles.map((role) => (
            <button key={role.id} type="button" onClick={() => navigate(`/${role.id}`)} className="rounded-3xl bg-white p-7 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">{role.id === "hospital" ? "H" : role.id === "doctor" ? "D" : "P"}</span>
              <h2 className="mt-6 text-xl font-bold text-slate-900">{role.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{role.description}</p>
              <span className="mt-6 inline-block text-sm font-bold text-blue-600">Enter portal →</span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

export default Login;
