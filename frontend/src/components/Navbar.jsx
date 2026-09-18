import { useState } from "react";
import { Link } from "react-router-dom";

function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-4 md:px-8">
      <div className="mx-auto max-w-7xl rounded-2xl border border-slate-200/80 bg-white/95 px-5 py-4 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between gap-5">

        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
            ✚
          </div>

          <div>
            <h1 className="text-lg font-bold tracking-tight text-blue-900">
              MedRoute
            </h1>
            <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
              Emergency Care Network
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            to="/"
            className="text-sm font-medium text-blue-600"
          >
            Home
          </Link>

          <a
            href="/#services"
            className="text-sm font-medium text-slate-500 transition hover:text-blue-600"
          >
            Services
          </a>

          <a
            href="/#how-it-works"
            className="text-sm font-medium text-slate-500 transition hover:text-blue-600"
          >
            How It Works
          </a>

        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden text-sm font-semibold text-slate-600 sm:block"
          >
            Login
          </Link>

          <Link
            to="/select-interface"
            className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
          >
            Start MedRoute
          </Link>
          <button type="button" onClick={() => setOpen((value) => !value)} className="ml-1 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 md:hidden" aria-label="Toggle navigation">{open ? "×" : "☰"}</button>
          </div>
        </div>
        {open && <nav className="mt-4 grid gap-2 border-t border-slate-100 pt-4 md:hidden"><a href="/#services" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600">Services</a><a href="/#how-it-works" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600">How It Works</a><Link to="/login" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600">Login</Link></nav>}
      </div>
    </header>
  );
}

export default Navbar;
