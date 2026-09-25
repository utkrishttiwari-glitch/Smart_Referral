import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

function Home() {
  return (
    <div className="relative h-screen min-h-screen w-full overflow-hidden bg-slate-950 text-white">
      <video
        src="/videos/medi-referral-hero.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      <div className="absolute inset-0 bg-slate-950/45" aria-hidden="true" />

      <div className="relative z-10 h-full">
        <Navbar />

        <main className="flex h-[calc(100%-92px)] items-center justify-center px-5 pb-10 pt-6 sm:px-8 sm:pb-14">
          <section className="flex w-full flex-col items-center text-center">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-100 sm:text-sm">
                Connecting Care. Saving Lives.
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
                Medi-Referral
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-100 sm:text-base">
                Coordinated healthcare referrals for patients, doctors, hospitals and care teams.
              </p>
            </div>

            <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row">
              <Link
                to="/select-interface"
                className="w-full rounded-full bg-blue-700 px-7 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-blue-950/20 transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-transparent sm:w-auto"
              >
                Start Medi-Referral
              </Link>

              <Link
                to="/login"
                className="w-full rounded-full border border-white/70 bg-white/90 px-7 py-3.5 text-center text-sm font-bold text-slate-800 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent sm:w-auto"
              >
                Login
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Home;
/*
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

function Home() {
  return (
    <div className="flex h-screen min-h-screen flex-col overflow-hidden bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex min-h-0 flex-1 items-center justify-center px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <section className="flex w-full max-w-5xl flex-col items-center justify-center gap-5 sm:gap-6 lg:gap-7">
          <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.09)] sm:rounded-3xl">
            <video
              src="/videos/medi-referral-hero.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="block h-[42vh] min-h-55 w-full object-cover sm:h-[48vh] sm:min-h-70 lg:h-[52vh] lg:min-h-90"
            />
          </div>

          <div className="flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/select-interface"
              className="w-full rounded-full bg-blue-700 px-7 py-3.5 text-center text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              Start Medi-Referral
            </Link>

            <Link
              to="/login"
              className="w-full rounded-full border border-slate-300 bg-white px-7 py-3.5 text-center text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              Login
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Home() {
  return (
    <div className="sr-page min-h-screen overflow-hidden">
      <Navbar />

      <main className="sr-public-main flex min-h-[calc(100vh-96px)] items-center px-4 py-8 md:px-8">
        <section className="mx-auto grid w-full max-w-7xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Healthcare coordination platform
            </span>

            <h1 className="mt-6 text-4xl font-black tracking-[-0.06em] text-slate-900 md:text-6xl">
              Connecting Care.
              <span className="mt-2 block text-blue-700">Saving Lives.</span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600 md:text-lg">
              Medi-Referral helps patients, doctors, hospitals and care teams coordinate faster, safer referrals in real time.
            </p>

            <p className="mt-3 text-sm font-bold uppercase tracking-[0.12em] text-slate-500">
              Right Patient. Right Hospital. Right Time.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/select-interface"
                className="sr-btn-primary rounded-full px-6 py-4 text-sm md:text-base"
              >
                Start Medi-Referral <span aria-hidden="true">↗</span>
              </Link>

              <Link
                to="/login"
                className="sr-btn-secondary rounded-full px-6 py-4 text-sm md:text-base"
              >
                Login
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_42px_rgba(15,23,42,0.08)] md:p-5">
            <HealthcareFlow />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function HealthcareFlow() {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-5 md:p-7">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:22px_22px]" />

      <div className="relative z-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Care pathway
            </p>
            <h2 className="mt-2 text-xl font-extrabold text-slate-900">
              Patient to hospital care
            </h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Live
          </span>
        </div>

        <div className="relative flex min-h-[320px] items-center justify-center">
          <div className="absolute h-[180px] w-[180px] rounded-full border border-dashed border-blue-200" />
          <div className="absolute h-[260px] w-[260px] rounded-full border border-dashed border-slate-200" />

          <div className="absolute left-4 top-8 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-blue-700">●</span>
              Patient
            </div>
          </div>

          <div className="absolute right-4 top-8 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-violet-700">✚</span>
              Doctor
            </div>
          </div>

          <div className="absolute left-7 bottom-7 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">🏥</span>
              Hospital
            </div>
          </div>

          <div className="absolute right-6 bottom-7 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">🚑</span>
              Ambulance
            </div>
          </div>

          <div className="relative flex h-20 w-20 items-center justify-center rounded-[28px] bg-blue-600 text-3xl text-white shadow-lg shadow-blue-200">
            +
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-center">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Find</div>
            <div className="mt-2 text-sm font-bold text-slate-800">Care</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-center">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Refer</div>
            <div className="mt-2 text-sm font-bold text-slate-800">Doctor</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-center">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Track</div>
            <div className="mt-2 text-sm font-bold text-slate-800">Ambulance</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-center">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Treat</div>
            <div className="mt-2 text-sm font-bold text-slate-800">Hospital</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
*/