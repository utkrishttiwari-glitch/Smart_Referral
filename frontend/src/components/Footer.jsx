function Footer() {
  return (
    <footer className="bg-[#062b69] px-6 py-12 text-white">

      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-center">

        <div>
          <h3 className="text-lg font-bold">
            Medi-Referral
          </h3>

          <p className="mt-1 text-sm text-blue-200">
            Connecting Care. Saving Lives.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-blue-200">
          <a href="/" className="hover:text-white">Home</a>
          <a href="/select-interface" className="hover:text-white">Start</a>
          <a href="/login" className="hover:text-white">Login</a>
        </nav>
        <p className="text-sm text-blue-200">© 2026 Medi-Referral</p>

      </div>

    </footer>
  );
}

export default Footer;
