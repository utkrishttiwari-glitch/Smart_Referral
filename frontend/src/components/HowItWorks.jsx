function Step({ number, title, description }) {
  return (
    <div className="relative text-center">

      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white shadow-lg shadow-blue-200">
        {number}
      </div>

      <h3 className="mt-5 text-lg font-bold">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-500">
        {description}
      </p>

    </div>
  );
}


function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-20">

      <div className="mx-auto max-w-7xl px-6 md:px-10">

        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
            How It Works
          </p>

          <h2 className="mt-3 text-3xl font-extrabold md:text-4xl">
            From referral to arrival
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-slate-500">
            Our system connects the referring doctor, hospital,
            ambulance team and receiving facility through one workflow.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-4">

          <Step
            number="01"
            title="Upload Report"
            description="Upload the patient's medical report and select the required service."
          />

          <Step
            number="02"
            title="Smart Match"
            description="The system evaluates hospitals using live service and capacity information."
          />

          <Step
            number="03"
            title="Auto Referral"
            description="The selected hospital receives a pre-arrival alert and referral details."
          />

          <Step
            number="04"
            title="Track Arrival"
            description="Medical staff and hospital can follow the ambulance journey in real time."
          />

        </div>

      </div>
    </section>
  );
}

export default HowItWorks;