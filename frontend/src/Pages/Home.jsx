import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import ServiceCard from "../components/ServiceCard";
import HowItWorks from "../components/HowItWorks";
import Footer from "../components/Footer";

function Home() {
  return (
    <div className="min-h-screen bg-slate-50 pt-28">

      <Navbar />

      <main>

        <Hero />

        {/* Services */}
        <section
          id="services"
          className="mx-auto max-w-7xl px-6 py-20 md:px-10"
        >
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">

            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
                Our Services
              </p>

              <h2 className="max-w-xl text-3xl font-extrabold text-slate-900 md:text-4xl">
                Emergency care coordination,
                <span className="text-blue-600">
                  {" "}connected in one place.
                </span>
              </h2>
            </div>

            <a href="#services" className="w-fit rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200">
              Explore Services →
            </a>

          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            <ServiceCard
              number="01"
              icon="🏥"
              title="Smart Hospital Matching"
              description="Find hospitals based on required services, capacity, distance and real-time availability."
            />

            <ServiceCard
              number="02"
              icon="📋"
              title="Digital Referral"
              description="Upload medical reports and create a structured referral for the receiving hospital."
            />

            <ServiceCard
              number="03"
              icon="🚑"
              title="Ambulance Coordination"
              description="Assign medical staff and coordinate the patient's journey to the receiving hospital."
            />

            <ServiceCard
              number="04"
              icon="📍"
              title="Live Tracking"
              description="Track ambulance location and keep the receiving hospital informed before arrival."
            />

          </div>
        </section>

        <HowItWorks />

        {/* CTA */}
        <section className="px-6 py-16 md:px-10">

          <div className="mx-auto max-w-7xl overflow-hidden rounded-4xl bg-blue-600 px-8 py-12 text-center md:px-16">

            <h2 className="text-3xl font-extrabold text-white md:text-4xl">
              Need emergency referral assistance?
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-blue-100">
              Connect with the right hospital and coordinate care faster.
            </p>

            <Link to="/login" className="mt-7 inline-flex rounded-full bg-white px-8 py-3.5 font-semibold text-blue-700 shadow-xl transition hover:bg-blue-50">
              Start a Referral →
            </Link>

          </div>

        </section>

      </main>

      <Footer />

    </div>
  );
}

export default Home;