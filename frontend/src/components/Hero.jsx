function Hero() {
  return (
    <section
      id="home"
      className="relative mx-auto mt-6 max-w-7xl overflow-hidden rounded-[2rem] bg-[#06327d] px-6 py-16 md:px-14 lg:px-20"
    >
      {/* Decorative circles */}
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-500/20" />
      <div className="absolute -bottom-40 left-20 h-96 w-96 rounded-full bg-blue-400/10" />

      <div className="relative grid items-center gap-12 lg:grid-cols-2">

        {/* Text */}
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-blue-100">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            Connected Emergency Care Network
          </div>

          <h2 className="max-w-xl text-4xl font-extrabold leading-tight text-white md:text-5xl lg:text-6xl">
            Smarter Referrals.
            <span className="block text-blue-300">
              Faster Emergency Care.
            </span>
          </h2>

          <p className="mt-6 max-w-xl text-base leading-7 text-blue-100 md:text-lg">
            Find the right hospital based on real-time services,
            bed availability, distance and data freshness — then
            coordinate the referral from hospital to arrival.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <button className="rounded-full bg-blue-500 px-7 py-3.5 font-semibold text-white shadow-xl shadow-blue-950/30 transition hover:bg-blue-400">
              Start Emergency Referral →
            </button>

            <button className="rounded-full border border-white/20 bg-white/10 px-7 py-3.5 font-semibold text-white backdrop-blur transition hover:bg-white/20">
              Find a Hospital
            </button>
          </div>

          <div className="mt-10 flex flex-wrap gap-6 text-sm text-blue-100">
            <div>
              <strong className="block text-xl text-white">24/7</strong>
              Emergency coordination
            </div>

            <div>
              <strong className="block text-xl text-white">LIVE</strong>
              Hospital availability
            </div>

            <div>
              <strong className="block text-xl text-white">GPS</strong>
              Ambulance tracking
            </div>
          </div>
        </div>

        {/* Doctor */}
        <div className="relative flex justify-center lg:justify-end">
          <div className="relative h-[420px] w-full max-w-md">

            <div className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-blue-400/20" />

            <img
              src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=700&q=85"
              alt="Medical professional"
              className="absolute bottom-0 left-1/2 h-[390px] w-[300px] -translate-x-1/2 rounded-t-[8rem] object-cover object-top shadow-2xl"
            />

            <div className="absolute bottom-5 left-0 rounded-2xl bg-white p-5 shadow-2xl md:left-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-xl">
                  🚑
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-400">
                    Emergency Network
                  </p>

                  <p className="font-bold text-slate-800">
                    Care coordination active
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}

export default Hero;