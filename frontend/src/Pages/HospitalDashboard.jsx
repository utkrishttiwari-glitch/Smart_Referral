import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import { io } from "socket.io-client";

const BACKEND_URL =
  "http://localhost:5000";

/*
 * Demo hospital.
 *
 * Metro General Hospital = ID 2
 *
 * Later this will come from
 * authenticated hospital user.
 */

const HOSPITAL_ID = 2;

function HospitalDashboard() {
  const [hospital, setHospital] =
    useState(null);

  const [referrals, setReferrals] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [actionLoading, setActionLoading] =
    useState(null);

  const [notification, setNotification] =
    useState(null);

  /*
   * =======================================================
   * LOAD REFERRALS
   * =======================================================
   */

  const loadReferrals =
    useCallback(
      async () => {
        try {
          setLoading(true);

          const response =
            await fetch(
              `${BACKEND_URL}/api/referrals/hospital/${HOSPITAL_ID}`
            );

          const result =
            await response.json();

          if (
            !response.ok ||
            !result.success
          ) {
            throw new Error(
              result.message ||
                "Failed to load referrals."
            );
          }

          setHospital(
            result.hospital
          );

          setReferrals(
            result.data || []
          );

          setError("");
        } catch (err) {
          console.error(
            "Hospital dashboard error:",
            err
          );

          setError(
            err.message ||
              "Failed to load referrals."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    loadReferrals();
  }, [loadReferrals]);

  /*
   * =======================================================
   * SOCKET.IO
   * =======================================================
   */

  useEffect(() => {
    const socket =
      io(BACKEND_URL);

    socket.on(
      "connect",
      () => {
        console.log(
          "Hospital dashboard connected:",
          socket.id
        );
      }
    );

    /*
     * Listen to all referral events.
     *
     * For this demo the dashboard
     * reloads whenever a referral changes.
     */

    socket.on(
      "referral-status-updated",
      (data) => {
        console.log(
          "Referral status updated:",
          data
        );

        loadReferrals();

        setNotification({
          type: "info",

          message:
            `Referral #${data.referralId} is now ${formatStatus(
              data.status
            )}.`,
        });
      }
    );

    socket.on(
      "pre-arrival-alert",
      (alert) => {
        console.log(
          "Pre-arrival alert:",
          alert
        );

        loadReferrals();

        setNotification({
          type: "success",

          message:
            alert.message ||
            "New pre-arrival alert received.",
        });
      }
    );

    return () => {
      socket.disconnect();
    };
  }, [loadReferrals]);

  /*
   * =======================================================
   * ACCEPT / REJECT
   * =======================================================
   */

  async function updateStatus(
    referralId,
    status
  ) {
    try {
      setActionLoading(
        `${referralId}-${status}`
      );

      const response =
        await fetch(
          `${BACKEND_URL}/api/referrals/${referralId}/status`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              status,

              message:
                status ===
                "ACCEPTED"
                  ? "Hospital has accepted the referral and is preparing for the patient's arrival."
                  : "Hospital has rejected the referral.",
            }),
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Failed to update referral."
        );
      }

      /*
       * Update locally immediately.
       */

      setReferrals(
        (current) =>
          current.map(
            (referral) =>
              referral.id ===
              referralId
                ? {
                    ...referral,

                    status,
                  }
                : referral
          )
      );

      if (
        status === "ACCEPTED"
      ) {
        setNotification({
          type: "success",

          message:
            `Referral #${referralId} accepted. Pre-arrival alert sent.`,
        });
      } else {
        setNotification({
          type: "warning",

          message:
            `Referral #${referralId} rejected.`,
        });
      }

      /*
       * Reload from backend.
       */

      await loadReferrals();
    } catch (err) {
      console.error(
        "Status update error:",
        err
      );

      setNotification({
        type: "error",

        message:
          err.message ||
          "Failed to update referral.",
      });
    } finally {
      setActionLoading(
        null
      );
    }
  }

  /*
   * =======================================================
   * LOADING
   * =======================================================
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 pt-28">

        <div className="mx-auto max-w-7xl px-4 py-16">

          <div className="rounded-3xl bg-white p-12 text-center shadow-sm">

            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              Loading hospital dashboard...
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Retrieving incoming referrals.
            </p>

          </div>

        </div>

      </main>
    );
  }

  /*
   * =======================================================
   * ERROR
   * =======================================================
   */

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 pt-28">

        <div className="mx-auto max-w-3xl px-4 py-16">

          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-2xl">
              !
            </div>

            <h2 className="mt-5 text-2xl font-bold text-slate-900">
              Dashboard unavailable
            </h2>

            <p className="mt-2 text-slate-500">
              {error}
            </p>

            <button
              type="button"
              onClick={
                loadReferrals
              }
              className="mt-6 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Try Again
            </button>

          </div>

        </div>

      </main>
    );
  }

  /*
   * =======================================================
   * COUNTS
   * =======================================================
   */

  const incomingCount =
    referrals.filter(
      (referral) =>
        referral.status ===
          "CREATED" ||
        referral.status ===
          "SENT" ||
        referral.status ===
          "RECEIVED"
    ).length;

  const acceptedCount =
    referrals.filter(
      (referral) =>
        referral.status ===
        "ACCEPTED"
    ).length;

  const transitCount =
    referrals.filter(
      (referral) =>
        referral.status ===
          "AMBULANCE_ASSIGNED" ||
        referral.status ===
          "IN_TRANSIT"
    ).length;

  /*
   * =======================================================
   * UI
   * =======================================================
   */

  return (
    <main className="min-h-screen bg-slate-50 pt-28 pb-16">

      <div className="mx-auto max-w-7xl px-4 md:px-8">

        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

          <div>

            <Link
              to="/"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              ← SmartReferral
            </Link>

            <div className="mt-3 flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-2xl text-white">
                🏥
              </div>

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Hospital Dashboard
                </p>

                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  {hospital?.name ||
                    "Hospital"}
                </h1>

              </div>

            </div>

            <p className="mt-3 text-sm text-slate-500">
              Manage incoming referrals and
              prepare for patient arrivals.
            </p>

          </div>

          <div className="flex items-center gap-3">

            <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2">

              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />

              <span className="text-xs font-bold text-emerald-700">
                LIVE
              </span>

            </div>

            <button
              type="button"
              onClick={
                loadReferrals
              }
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Refresh
            </button>

          </div>

        </div>

        {/* NOTIFICATION */}

        {notification && (
          <div
            className={`mb-6 flex items-center justify-between rounded-2xl border px-5 py-4 ${
              notification.type ===
              "success"
                ? "border-emerald-100 bg-emerald-50 text-emerald-800"
                : notification.type ===
                    "warning"
                  ? "border-amber-100 bg-amber-50 text-amber-800"
                  : notification.type ===
                      "error"
                    ? "border-red-100 bg-red-50 text-red-800"
                    : "border-blue-100 bg-blue-50 text-blue-800"
            }`}
          >

            <div className="flex items-center gap-3">

              <span className="text-xl">
                {notification.type ===
                "success"
                  ? "✓"
                  : notification.type ===
                      "warning"
                    ? "⚠"
                    : notification.type ===
                        "error"
                      ? "!"
                      : "ℹ"}
              </span>

              <p className="text-sm font-semibold">
                {notification.message}
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                setNotification(
                  null
                )
              }
              className="text-lg opacity-60 hover:opacity-100"
            >
              ×
            </button>

          </div>
        )}

        {/* STATS */}

        <div className="grid gap-4 md:grid-cols-4">

          <StatCard
            label="Incoming"
            value={
              incomingCount
            }
            icon="📥"
          />

          <StatCard
            label="Accepted"
            value={
              acceptedCount
            }
            icon="✓"
          />

          <StatCard
            label="In Transit"
            value={
              transitCount
            }
            icon="🚑"
          />

          <StatCard
            label="Total Referrals"
            value={
              referrals.length
            }
            icon="📋"
          />

        </div>

        {/* REFERRALS */}

        <section className="mt-8">

          <div className="mb-5 flex items-center justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Referral Queue
              </p>

              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Incoming Patient Referrals
              </h2>

            </div>

            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
              {referrals.length} referrals
            </span>

          </div>

          {referrals.length ===
          0 ? (
            <div className="rounded-3xl bg-white p-12 text-center shadow-sm">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl">
                📭
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-900">
                No referrals yet
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                New referrals sent to this
                hospital will appear here.
              </p>

            </div>
          ) : (
            <div className="space-y-4">

              {referrals.map(
                (referral) => (
                  <ReferralCard
                    key={
                      referral.id
                    }
                    referral={
                      referral
                    }
                    actionLoading={
                      actionLoading
                    }
                    onAccept={() =>
                      updateStatus(
                        referral.id,
                        "ACCEPTED"
                      )
                    }
                    onReject={() =>
                      updateStatus(
                        referral.id,
                        "REJECTED"
                      )
                    }
                  />
                )
              )}

            </div>
          )}

        </section>

      </div>

    </main>
  );
}

/*
=========================================================
STAT CARD
=========================================================
*/

function StatCard({
  label,
  value,
  icon,
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-xl">
          {icon}
        </div>

        <span className="text-3xl font-bold text-slate-900">
          {value}
        </span>

      </div>

      <p className="mt-4 text-sm font-medium text-slate-500">
        {label}
      </p>

    </div>
  );
}

/*
=========================================================
REFERRAL CARD
=========================================================
*/

function ReferralCard({
  referral,
  actionLoading,
  onAccept,
  onReject,
}) {
  const isPending =
    referral.status ===
      "CREATED" ||
    referral.status ===
      "SENT" ||
    referral.status ===
      "RECEIVED";

  const isAccepted =
    referral.status ===
    "ACCEPTED";

  const isRejected =
    referral.status ===
    "REJECTED";

  const isBusy =
    actionLoading ===
      `${referral.id}-ACCEPTED` ||
    actionLoading ===
      `${referral.id}-REJECTED`;

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

        {/* LEFT */}

        <div className="min-w-0 flex-1">

          <div className="flex flex-wrap items-center gap-3">

            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              REFERRAL #{referral.id}
            </span>

            <StatusBadge
              status={
                referral.status
              }
            />

            {referral.urgency && (
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold uppercase text-red-600">
                {referral.urgency}
              </span>
            )}

          </div>

          <h3 className="mt-4 text-xl font-bold text-slate-900">
            {referral.patientName}
          </h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <InfoItem
              label="Service"
              value={
                referral
                  .requiredService
                  ?.name ||
                "Medical Service"
              }
            />

            <InfoItem
              label="Referring Doctor"
              value={
                referral.referringDoctorName ||
                "Not provided"
              }
            />

            <InfoItem
              label="Reason"
              value={
                referral.reason ||
                "Not provided"
              }
            />

            <InfoItem
              label="Created"
              value={
                referral.createdAt
                  ? new Date(
                      referral.createdAt
                    ).toLocaleString(
                      [],
                      {
                        dateStyle:
                          "medium",
                        timeStyle:
                          "short",
                      }
                    )
                  : "—"
              }
            />

          </div>

          {referral.notes && (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Notes
              </p>

              <p className="mt-1 text-sm text-slate-700">
                {referral.notes}
              </p>

            </div>
          )}

        </div>

        {/* ACTIONS */}

        <div className="flex shrink-0 flex-col gap-3 lg:w-44">

          {isPending && (
            <>
              <button
                type="button"
                disabled={isBusy}
                onClick={
                  onAccept
                }
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading ===
                `${referral.id}-ACCEPTED`
                  ? "Accepting..."
                  : "✓ Accept Referral"}
              </button>

              <button
                type="button"
                disabled={isBusy}
                onClick={
                  onReject
                }
                className="rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading ===
                `${referral.id}-REJECTED`
                  ? "Rejecting..."
                  : "Reject"}
              </button>
            </>
          )}

          {isAccepted && (
            <div className="rounded-2xl bg-emerald-50 p-4 text-center">

              <div className="text-2xl">
                ✓
              </div>

              <p className="mt-1 text-sm font-bold text-emerald-800">
                Referral Accepted
              </p>

              <p className="mt-1 text-xs text-emerald-600">
                Pre-arrival alert sent
              </p>

            </div>
          )}

          {isRejected && (
            <div className="rounded-2xl bg-red-50 p-4 text-center">

              <div className="text-2xl">
                ✕
              </div>

              <p className="mt-1 text-sm font-bold text-red-800">
                Referral Rejected
              </p>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}

/*
=========================================================
INFO ITEM
=========================================================
*/

function InfoItem({
  label,
  value,
}) {
  return (
    <div>

      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-800">
        {value}
      </p>

    </div>
  );
}

/*
=========================================================
STATUS BADGE
=========================================================
*/

function StatusBadge({
  status,
}) {
  const styles = {
    CREATED:
      "bg-amber-50 text-amber-700",

    SENT:
      "bg-blue-50 text-blue-700",

    RECEIVED:
      "bg-blue-50 text-blue-700",

    ACCEPTED:
      "bg-emerald-50 text-emerald-700",

    REJECTED:
      "bg-red-50 text-red-700",

    AMBULANCE_ASSIGNED:
      "bg-purple-50 text-purple-700",

    IN_TRANSIT:
      "bg-indigo-50 text-indigo-700",

    ARRIVED:
      "bg-teal-50 text-teal-700",

    COMPLETED:
      "bg-slate-100 text-slate-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
        styles[status] ||
        "bg-slate-100 text-slate-600"
      }`}
    >
      {formatStatus(
        status
      )}
    </span>
  );
}

/*
=========================================================
FORMAT STATUS
=========================================================
*/

function formatStatus(
  status
) {
  return String(
    status || ""
  )
    .replaceAll(
      "_",
      " "
    );
}

export default HospitalDashboard;