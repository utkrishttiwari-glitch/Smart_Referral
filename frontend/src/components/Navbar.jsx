import { Link } from "react-router-dom";

function Navbar() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-4 md:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-sm">

        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
            ✚
          </div>

          <div>
            <h1 className="text-lg font-bold tracking-tight text-blue-900">
              SmartReferral
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

          <Link
            to="/hospitals"
            className="text-sm font-medium text-slate-500 transition hover:text-blue-600"
          >
            Hospitals
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden text-sm font-semibold text-slate-600 sm:block"
          >
            Login
          </Link>

          <Link
            to="/referral"
            className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
          >
            Start Referral
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Navbar;