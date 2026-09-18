function ServiceCard({ number, icon, title, description }) {
  return (
    <div className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition duration-300 hover:-translate-y-1 hover:shadow-xl">

      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl">
          {icon}
        </div>

        <span className="text-xs font-bold text-blue-300">
          {number}
        </span>
      </div>

      <h3 className="mt-6 text-lg font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-500">
        {description}
      </p>

      <button className="mt-5 text-xs font-bold uppercase tracking-wider text-blue-600">
        Learn More →
      </button>

    </div>
  );
}

export default ServiceCard;
