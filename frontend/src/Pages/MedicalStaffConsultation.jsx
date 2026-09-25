import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import PortalNav from "../components/PortalNav";

const API = import.meta.env.VITE_API_URL + "/api/coordination";

function MedicalStaffConsultation() {
  const [doctors, setDoctors] = useState([]);
  const [consultation, setConsultation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notice, setNotice] = useState("");
  const staff = {
    name: "Raj Kumar",
    role: "Paramedic",
    ambulanceNumber: "AMB-101",
    referralId: 12,
    patientName: "Assigned patient",
  };

  useEffect(() => {
    fetch(`${API}/doctors`)
      .then((res) => res.json())
      .then((result) => setDoctors(result.data || []));
    const socket = io(import.meta.env.VITE_API_URL + "");
    socket.on("consultation-status-updated", setConsultation);
    socket.on("consultation-message", (message) => {
      setMessages((curr) =>
        curr.some((m) => m.id === message.id) ? curr : [...curr, message]
      );
    });
    return () => socket.disconnect();
  }, []);

  async function startConsultation(doctorId) {
    const response = await fetch(`${API}/consultations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientName: staff.patientName,
        doctorId,
        medicalStaffId: 1,
        referralId: staff.referralId,
        context: `Ambulance ${staff.ambulanceNumber} en route`,
      }),
    });
    const result = await response.json();
    if (result.success) {
      setConsultation(result.data);
      await loadMessages(result.data.id);
      setNotice("Prototype consultation requested. No video call has been placed.");
    }
  }

  async function loadMessages(consultationId) {
    const response = await fetch(`${API}/consultations/${consultationId}/messages`);
    const result = await response.json();
    if (result.success) setMessages(result.data || []);
  }

  async function sendInstruction(messageType, content) {
    if (!consultation) return;
    await fetch(`${API}/consultations/${consultation.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderRole: "MEDICAL_STAFF",
        senderName: staff.name,
        messageType,
        content,
      }),
    });
    await loadMessages(consultation.id);
    setNotice("Request sent to the verified doctor.");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PortalNav role="medical" />
      <main className="mx-auto max-w-5xl px-5 py-10 md:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
          Ambulance coordination
        </p>
        <h1 className="mt-3 text-4xl font-extrabold text-slate-900">
          Doctor Consultation
        </h1>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* LEFT COLUMN */}
          <section className="rounded-3xl bg-white p-7 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Medical staff
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              {staff.name}
            </h2>
            <p className="mt-1 text-slate-500">
              {staff.role} · {staff.ambulanceNumber}
            </p>
            <span className="mt-5 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              Available
            </span>
            <dl className="mt-7 space-y-4 text-sm">
              <div>
                <dt className="text-slate-400">Current referral</dt>
                <dd className="font-bold text-slate-800">#{staff.referralId}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Patient</dt>
                <dd className="font-bold text-slate-800">{staff.patientName}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Destination</dt>
                <dd className="font-bold text-slate-800">Metro General Hospital</dd>
              </div>
            </dl>
          </section>

          {/* RIGHT COLUMN */}
          <section className="rounded-3xl bg-white p-7 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
              Verified specialists
            </p>
            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 p-4"
              >
                <div>
                  <h2 className="font-bold text-slate-900">{doctor.name}</h2>
                  <p className="text-sm text-slate-500">
                    {doctor.specialization} · Verified
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startConsultation(doctor.id)}
                  className="rounded-full bg-[#1769e0] px-4 py-2 text-xs font-bold text-white"
                >
                  Start Consultation
                </button>
              </div>
            ))}

            {consultation && (
              <div className="mt-6 rounded-2xl bg-blue-50 p-5">
                <p className="text-sm font-bold text-blue-900">
                  Status: {consultation.status}
                </p>
                <p className="mt-2 text-sm text-blue-800">
                  Doctor instructions must come from the verified specialist. AI does not generate prescriptions.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      sendInstruction(
                        "PRESCRIPTION_REQUEST",
                        "Request prescription guidance from the verified doctor."
                      )
                    }
                    className="rounded-full bg-white px-3 py-2 text-xs font-bold text-blue-800"
                  >
                    Request Prescription
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      sendInstruction(
                        "PRECAUTION_REQUEST",
                        "Request emergency precautions for transport."
                      )
                    }
                    className="rounded-full bg-white px-3 py-2 text-xs font-bold text-blue-800"
                  >
                    Request Precaution
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      sendInstruction(
                        "INSTRUCTION_REQUEST",
                        "Request monitoring and arrival preparation instructions."
                      )
                    }
                    className="rounded-full bg-white px-3 py-2 text-xs font-bold text-blue-800"
                  >
                    Request Instructions
                  </button>
                </div>
                <div className="mt-5 space-y-2">
                  {messages.map((item) => (
                    <div key={item.id} className="rounded-xl bg-white p-3 text-sm">
                      <p className="font-bold text-slate-800">
                        {item.senderName} · {item.senderRole.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 text-slate-600">{item.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {notice && (
              <p className="mt-4 text-sm font-semibold text-emerald-700">
                {notice}
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default MedicalStaffConsultation;
