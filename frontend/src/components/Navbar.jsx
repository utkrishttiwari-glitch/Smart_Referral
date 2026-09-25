import { useState } from "react";
import { Link } from "react-router-dom";

function Navbar() {
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState(null);

  return (
    <>
      <header className="sr-public-header sticky top-0 z-50 px-4 pt-4 md:px-8">
        <div className="mx-auto max-w-7xl rounded-2xl border border-slate-200/80 bg-white/95 px-5 py-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-5">
            <Link to="/" className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                ✚
              </div>

              <div className="min-w-0">
                <h1 className="text-lg font-bold tracking-tight text-blue-900">
                  Medi-Referral
                </h1>
                <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
                  Connecting Care. Saving Lives.
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-8 md:flex">
              <Link to="/" className="text-sm font-medium text-blue-600">
                Home
              </Link>
              <button
                type="button"
                onClick={() => setModal("how-it-works")}
                className="text-sm font-medium text-slate-500 transition hover:text-blue-600"
              >
                How It Works
              </button>
              <button
                type="button"
                onClick={() => setModal("about")}
                className="text-sm font-medium text-slate-500 transition hover:text-blue-600"
              >
                About
              </button>
            </nav>

            <div className="flex items-center gap-3">
              <label className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 md:flex">
                <span aria-hidden="true">◎</span>
                <select
                  aria-label="Language"
                  className="bg-transparent text-xs font-semibold text-slate-700 outline-none"
                  defaultValue="en"
                >
                  <option value="en">EN</option>
                  <option value="hi">हिं</option>
                  <option value="mr">मर</option>
                </select>
              </label>

              <Link
                to="/login"
                className="hidden text-sm font-semibold text-slate-600 sm:block"
              >
                Login
              </Link>

              <Link
                to="/select-interface"
                className="sr-nav-cta rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
              >
                Start Medi-Referral
              </Link>

              <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 md:hidden"
                aria-label="Toggle navigation"
              >
                {open ? "×" : "☰"}
              </button>
            </div>
          </div>

          {open && (
            <nav className="mt-4 grid gap-2 border-t border-slate-100 pt-4 md:hidden">
              <Link to="/" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600">
                Home
              </Link>
              <button type="button" onClick={() => { setModal("how-it-works"); setOpen(false); }} className="rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-600">
                How It Works
              </button>
              <button type="button" onClick={() => { setModal("about"); setOpen(false); }} className="rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-600">
                About
              </button>
              <Link to="/login" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600">
                Login
              </Link>
            </nav>
          )}
        </div>
      </header>

      {modal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                  {modal === "how-it-works" ? "How It Works" : "About"}
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
                  {modal === "how-it-works" ? "A faster referral flow" : "A healthcare coordination platform"}
                </h2>
              </div>
              <button type="button" onClick={() => setModal(null)} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-800">
                ×
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
              {modal === "how-it-works" ? (
                <>
                  <p>Choose a role, select the right referral path, and match the patient to a suitable hospital based on live availability.</p>
                  <p>Doctors can create standard or instant referrals, hospitals can review incoming cases, and care teams can track patient movement in real time.</p>
                </>
              ) : (
                <>
                  <p>Medi-Referral connects patients, clinicians, hospitals, and support teams through one coordinated healthcare workflow.</p>
                  <p>It helps reduce delays, improve referral quality, and give teams clearer visibility during emergency transfer and patient movement.</p>
                </>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
