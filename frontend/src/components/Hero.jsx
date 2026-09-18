import heartImg from "../assets/anatomical-heart.png";

function Hero() {
  return (
    <section id="home" className="relative mx-auto mt-6 max-w-7xl overflow-hidden rounded-[2rem] bg-white px-6 py-16 md:px-14 lg:px-20">
      {/* Background decorative circles */}
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-500/10" />
      <div className="absolute -bottom-40 left-20 h-96 w-96 rounded-full bg-blue-400/5" />

      <div className="relative grid items-center gap-12 lg:grid-cols-2">
        {/* Left side */}
        <div className="space-y-6">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-xs font-medium text-blue-800">
            SMART EMERGENCY REFERRAL
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
            Connecting Care.
            <br />
            Saving Lives.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-gray-600">
            MedRoute connects patients, doctors, hospitals and medical teams to coordinate faster, safer emergency referrals.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <a href="/select-interface" className="rounded-full bg-blue-600 px-7 py-3.5 font-semibold text-white shadow hover:bg-blue-500 transition">
              Start MedRoute
            </a>
            <a href="#how-it-works" className="rounded-full border border-blue-600 px-7 py-3.5 font-semibold text-blue-600 hover:bg-blue-50 transition">
              Explore How It Works
            </a>
          </div>
        </div>

        {/* Right side – Heart visual */}
        <div className="relative flex justify-center lg:justify-end">
          <img
            src={heartImg}
            alt="Anatomical human heart"
            className="max-w-xs md:max-w-md object-contain animate-heartbeat"
          />
          {/* Subtle data cards */}
          <div className="absolute top-4 left-4 rounded-lg bg-white border border-gray-200 shadow-sm p-3 text-xs">
            <div className="font-medium text-gray-800">Live Referral</div>
            <div className="text-gray-600">City Care Hospital</div>
            <div className="text-green-600">Verified availability</div>
          </div>
          <div className="absolute bottom-4 right-4 rounded-lg bg-white border border-gray-200 shadow-sm p-3 text-xs">
            <div className="font-medium text-gray-800">Emergency Care</div>
            <div className="text-gray-600">Available</div>
            <div className="text-green-600">Updated today</div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white border border-gray-200 shadow-sm p-3 text-xs">
            <div className="font-medium text-gray-800">Ambulance</div>
            <div className="text-gray-600">En Route</div>
            <div className="text-green-600">ETA 08 min</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
