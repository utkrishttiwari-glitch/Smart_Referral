function Hospitals() {
  return (
    <div className="min-h-screen bg-[#eaf4ff] px-6 py-10">
      <div className="mx-auto max-w-7xl">

        <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
          Hospital Network
        </p>

        <h1 className="mt-3 text-4xl font-extrabold">
          Find Available Hospitals
        </h1>

        <p className="mt-3 text-slate-500">
          Real-time hospital services and emergency capacity.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">

          <HospitalCard
            name="City Care Hospital"
            location="Delhi"
            beds="0"
            status="Verification Needed"
            statusStyle="orange"
          />

          <HospitalCard
            name="Metro General Hospital"
            location="Delhi"
            beds="6"
            status="Available"
            statusStyle="green"
          />

          <HospitalCard
            name="Sunrise Medical Center"
            location="Noida"
            beds="8"
            status="Available"
            statusStyle="green"
          />

        </div>

      </div>
    </div>
  );
}


function HospitalCard({
  name,
  location,
  beds,
  status,
  statusStyle,
}) {
  const statusClasses =
    statusStyle === "green"
      ? "bg-green-100 text-green-700"
      : "bg-orange-100 text-orange-700";

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">

      <div className="flex items-start justify-between">

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl">
          🏥
        </div>

        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses}`}>
          {status}
        </span>

      </div>

      <h2 className="mt-6 text-xl font-bold">
        {name}
      </h2>

      <p className="mt-2 text-sm text-slate-500">
        📍 {location}
      </p>

      <div className="mt-6 rounded-2xl bg-slate-50 p-4">

        <p className="text-sm text-slate-500">
          Emergency beds
        </p>

        <p className="mt-1 text-2xl font-bold text-blue-600">
          {beds}
        </p>

      </div>

      <button className="mt-5 w-full rounded-full bg-blue-600 py-3 font-semibold text-white">
        View Hospital
      </button>

    </div>
  );
}

export default Hospitals;