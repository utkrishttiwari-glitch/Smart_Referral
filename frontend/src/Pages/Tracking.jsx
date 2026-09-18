import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const BACKEND_URL = "http://localhost:5000";

const OSRM_URL =
  "https://router.project-osrm.org/route/v1/driving";

function Tracking() {
  const [searchParams] = useSearchParams();

  const referralId = searchParams.get("id");

  /*
   * =========================================================
   * STATE
   * =========================================================
   */

  const [referral, setReferral] = useState(null);

  const [location, setLocation] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [locationError, setLocationError] = useState("");

  const [socketConnected, setSocketConnected] =
    useState(false);

  const [mapReady, setMapReady] =
    useState(false);

  const [routeLoading, setRouteLoading] =
    useState(false);

  const [routeError, setRouteError] =
    useState("");

  const [routeInfo, setRouteInfo] = useState({
    distanceKm: null,
    durationMin: null,
    source: null,
  });

  /*
   * =========================================================
   * REFS
   * =========================================================
   */

  const mapContainerRef = useRef(null);

  const mapRef = useRef(null);

  const ambulanceMarkerRef =
    useRef(null);

  const hospitalMarkerRef =
    useRef(null);

  const routeRequestRef =
    useRef(0);

  /*
   * =========================================================
   * FETCH REFERRAL
   * =========================================================
   */

  useEffect(() => {
    async function fetchReferral() {
      if (!referralId) {
        setError(
          "Referral ID is missing."
        );

        setLoading(false);

        return;
      }

      try {
        console.log(
          "Fetching referral:",
          referralId
        );

        const response = await fetch(
          `${BACKEND_URL}/api/referrals/${referralId}`
        );

        const result =
          await response.json();

        console.log(
          "Referral response:",
          result
        );

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              "Failed to load referral"
          );
        }

        setReferral(result.data);

        setError("");
      } catch (err) {
        console.error(
          "Failed to fetch referral:",
          err
        );

        setError(
          err.message ||
            "Failed to load referral."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchReferral();
  }, [referralId]);

  /*
   * =========================================================
   * FETCH LATEST AMBULANCE LOCATION
   * =========================================================
   */

  useEffect(() => {
    async function fetchLatestLocation() {
      if (!referralId) {
        return;
      }

      try {
        console.log(
          "Fetching latest ambulance location..."
        );

        const response =
          await fetch(
            `${BACKEND_URL}/api/location/referral/${referralId}/latest`
          );

        const result =
          await response.json();

        console.log(
          "Latest location:",
          result
        );

        if (response.ok && result.success && result.data) {
          setLocation(
            result.data
          );
          setLocationError("");
        } else if (response.status === 404) {
          setLocation(null);
          setLocationError("");
        } else if (!response.ok) {
          setLocationError("Unable to load the latest ambulance location.");
        }
      } catch (err) {
        console.error(
          "Failed to fetch latest location:",
          err
        );
        setLocationError("Unable to connect to MedRoute.");
      }
    }

    fetchLatestLocation();
  }, [referralId]);

  /*
   * =========================================================
   * SOCKET.IO
   * =========================================================
   */

  useEffect(() => {
    if (!referralId) {
      return;
    }

    console.log(
      "Connecting to Socket.IO..."
    );

    const socket =
      io(BACKEND_URL);

    socket.on("connect", () => {
      console.log(
        "Socket connected:",
        socket.id
      );

      setSocketConnected(true);

      socket.emit(
        "join-referral",
        Number(referralId)
      );
    });

    socket.on(
      "location-update",
      (newLocation) => {
        console.log(
          "LIVE LOCATION RECEIVED:",
          newLocation
        );

        setLocation(
          newLocation
        );
        setLocationError("");
      }
    );

    socket.on(
      "disconnect",
      () => {
        console.log(
          "Socket disconnected"
        );

        setSocketConnected(false);
      }
    );

    socket.on(
      "connect_error",
      (socketError) => {
        console.error(
          "Socket connection error:",
          socketError
        );

        setSocketConnected(false);
      }
    );

    return () => {
      socket.emit(
        "leave-referral",
        Number(referralId)
      );

      socket.disconnect();
    };
  }, [referralId]);

  /*
   * =========================================================
   * INITIALIZE MAP
   *
   * IMPORTANT:
   * We wait until loading is false because
   * the map container doesn't exist during
   * the loading screen.
   * =========================================================
   */

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!mapContainerRef.current) {
      console.log(
        "Map container not available yet."
      );

      return;
    }

    if (mapRef.current) {
      return;
    }

    console.log(
      "Initializing MapLibre..."
    );

    /*
     * Direct OpenStreetMap raster tiles.
     *
     * This avoids depending on an external
     * style JSON from OpenFreeMap.
     */

    const mapStyle = {
      version: 8,

      sources: {
        osm: {
          type: "raster",

          tiles: [
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          ],

          tileSize: 256,

          attribution:
            "© OpenStreetMap contributors",
        },
      },

      layers: [
        {
          id: "osm",

          type: "raster",

          source: "osm",

          minzoom: 0,

          maxzoom: 19,
        },
      ],
    };

    const map =
      new maplibregl.Map({
        container:
          mapContainerRef.current,

        style: mapStyle,

        center: [
          77.2177,
          28.6304,
        ],

        zoom: 12,

        attributionControl: true,
      });

    map.addControl(
      new maplibregl.NavigationControl(),
      "top-right"
    );

    map.on("load", () => {
      console.log(
        "MAP READY"
      );

      setMapReady(true);

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.resize();
        }
      }, 300);
    });

    map.on("error", (event) => {
      console.error(
        "MapLibre error:",
        event
      );
    });

    mapRef.current = map;

    return () => {
      console.log(
        "Destroying MapLibre..."
      );

      if (mapRef.current) {
        mapRef.current.remove();

        mapRef.current = null;
      }

      setMapReady(false);
    };
  }, [loading]);

  /*
   * =========================================================
   * RESIZE MAP
   * =========================================================
   */

  useEffect(() => {
    if (
      !mapReady ||
      !mapRef.current
    ) {
      return;
    }

    const timer =
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.resize();
        }
      }, 200);

    return () => {
      clearTimeout(timer);
    };
  }, [mapReady]);

  /*
   * =========================================================
   * HOSPITAL MARKER
   * =========================================================
   */

  useEffect(() => {
    if (
      !mapReady ||
      !mapRef.current ||
      !referral?.destinationHospital
    ) {
      return;
    }

    const hospital =
      referral.destinationHospital;

    const latitude =
      Number(
        hospital.latitude
      );

    const longitude =
      Number(
        hospital.longitude
      );

    if (
      !Number.isFinite(
        latitude
      ) ||
      !Number.isFinite(
        longitude
      )
    ) {
      console.error(
        "Invalid hospital coordinates:",
        hospital
      );

      return;
    }

    console.log(
      "Creating hospital marker:",
      {
        latitude,
        longitude,
      }
    );

    if (
      hospitalMarkerRef.current
    ) {
      hospitalMarkerRef.current.remove();
    }

    const markerElement =
      document.createElement(
        "div"
      );

    markerElement.style.width =
      "48px";

    markerElement.style.height =
      "48px";

    markerElement.style.borderRadius =
      "50%";

    markerElement.style.background =
      "#ffffff";

    markerElement.style.border =
      "3px solid #2563eb";

    markerElement.style.display =
      "flex";

    markerElement.style.alignItems =
      "center";

    markerElement.style.justifyContent =
      "center";

    markerElement.style.boxShadow =
      "0 8px 20px rgba(15, 23, 42, 0.20)";

    markerElement.style.fontSize =
      "23px";

    markerElement.style.cursor =
      "pointer";

    markerElement.innerHTML =
      "🏥";

    hospitalMarkerRef.current =
      new maplibregl.Marker({
        element:
          markerElement,
      })
        .setLngLat([
          longitude,
          latitude,
        ])
        .setPopup(
          new maplibregl.Popup({
            offset: 28,
          }).setHTML(`
            <div style="
              font-family: Arial, sans-serif;
              padding: 4px;
            ">
              <strong style="
                color:#0f172a;
                font-size:14px;
              ">
                ${escapeHtml(
                  hospital.name
                )}
              </strong>

              <div style="
                color:#64748b;
                margin-top:4px;
                font-size:12px;
              ">
                Destination Hospital
              </div>
            </div>
          `)
        )
        .addTo(
          mapRef.current
        );
  }, [
    referral,
    mapReady,
  ]);

  /*
   * =========================================================
   * AMBULANCE MARKER
   * =========================================================
   */

  useEffect(() => {
    if (
      !mapReady ||
      !mapRef.current ||
      !location
    ) {
      return;
    }

    const latitude =
      Number(
        location.latitude
      );

    const longitude =
      Number(
        location.longitude
      );

    if (
      !Number.isFinite(
        latitude
      ) ||
      !Number.isFinite(
        longitude
      )
    ) {
      console.error(
        "Invalid ambulance coordinates:",
        location
      );

      return;
    }

    console.log(
      "Updating ambulance marker:",
      {
        latitude,
        longitude,
      }
    );

    /*
     * Create marker once.
     */

    if (
      !ambulanceMarkerRef.current
    ) {
      const markerElement =
        document.createElement(
          "div"
        );

      markerElement.style.width =
        "58px";

      markerElement.style.height =
        "58px";

      markerElement.style.borderRadius =
        "50%";

      markerElement.style.background =
        "#2563eb";

      markerElement.style.border =
        "4px solid #ffffff";

      markerElement.style.display =
        "flex";

      markerElement.style.alignItems =
        "center";

      markerElement.style.justifyContent =
        "center";

      markerElement.style.boxShadow =
        "0 10px 28px rgba(37, 99, 235, 0.40)";

      markerElement.style.fontSize =
        "27px";

      markerElement.style.cursor =
        "pointer";

      markerElement.innerHTML =
        "🚑";

      ambulanceMarkerRef.current =
        new maplibregl.Marker({
          element:
            markerElement,
        })
          .setLngLat([
            longitude,
            latitude,
          ])
          .setPopup(
            new maplibregl.Popup({
              offset: 32,
            }).setHTML(`
              <div style="
                font-family: Arial, sans-serif;
                padding: 4px;
              ">
                <strong style="
                  color:#0f172a;
                  font-size:14px;
                ">
                  Ambulance
                </strong>

                <div style="
                  color:#64748b;
                  margin-top:4px;
                  font-size:12px;
                ">
                  Live location
                </div>
              </div>
            `)
          )
          .addTo(
            mapRef.current
          );
    } else {
      /*
       * Move existing marker.
       */

      ambulanceMarkerRef.current.setLngLat(
        [
          longitude,
          latitude,
        ]
      );
    }
  }, [
    location,
    mapReady,
  ]);

  /*
   * =========================================================
   * ROUTE + DISTANCE + ETA
   * =========================================================
   */

  useEffect(() => {
    if (
      !location ||
      !referral?.destinationHospital
    ) {
      console.log(
        "Route waiting for location/referral"
      );

      return;
    }

    const ambulanceLat =
      Number(
        location.latitude
      );

    const ambulanceLng =
      Number(
        location.longitude
      );

    const hospitalLat =
      Number(
        referral
          .destinationHospital
          .latitude
      );

    const hospitalLng =
      Number(
        referral
          .destinationHospital
          .longitude
      );

    if (
      !Number.isFinite(
        ambulanceLat
      ) ||
      !Number.isFinite(
        ambulanceLng
      ) ||
      !Number.isFinite(
        hospitalLat
      ) ||
      !Number.isFinite(
        hospitalLng
      )
    ) {
      console.error(
        "Invalid route coordinates:",
        {
          ambulanceLat,
          ambulanceLng,
          hospitalLat,
          hospitalLng,
        }
      );

      return;
    }

    /*
     * -------------------------------------------------------
     * Calculate straight-line distance immediately.
     * -------------------------------------------------------
     */

    const fallbackDistance =
      calculateDistanceKm(
        ambulanceLat,
        ambulanceLng,
        hospitalLat,
        hospitalLng
      );

    const fallbackDuration =
      calculateEstimatedMinutes(
        fallbackDistance
      );

    /*
     * Show estimate immediately.
     */

    setRouteInfo({
      distanceKm:
        fallbackDistance,

      durationMin:
        fallbackDuration,

      source:
        "ESTIMATE",
    });

    console.log(
      "Basic route calculated:",
      {
        distanceKm:
          fallbackDistance,

        durationMin:
          fallbackDuration,
      }
    );

    /*
     * Map isn't ready yet.
     *
     * Distance and ETA are already
     * available, so don't block them.
     */

    if (
      !mapReady ||
      !mapRef.current
    ) {
      console.log(
        "Map not ready yet. Waiting to draw route."
      );

      return;
    }

    console.log(
      "ROUTE CALCULATION STARTED"
    );

    calculateRoute({
      map:
        mapRef.current,

      ambulanceLat,

      ambulanceLng,

      hospitalLat,

      hospitalLng,

      requestRef:
        routeRequestRef,

      setRouteInfo,

      setRouteLoading,

      setRouteError,
    });
  }, [
    location,
    referral,
    mapReady,
  ]);

  /*
   * =========================================================
   * LOADING SCREEN
   * =========================================================
   */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-28">

        <div className="mx-auto max-w-7xl px-4 py-16">

          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">

            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

            <h2 className="text-xl font-bold text-slate-900">
              Loading referral...
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Please wait while we retrieve
              the referral details.
            </p>

          </div>

        </div>

      </div>
    );
  }

  /*
   * =========================================================
   * ERROR SCREEN
   * =========================================================
   */

  if (error || !referral) {
    return (
      <div className="min-h-screen bg-slate-50 pt-28">

        <div className="mx-auto max-w-3xl px-4 py-16">

          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl">
              !
            </div>

            <h2 className="mt-5 text-2xl font-bold text-slate-900">
              Referral not found
            </h2>

            <p className="mt-2 text-slate-500">
              {error ||
                "We could not find this referral."}
            </p>

            <Link
              to="/referral"
              className="mt-6 inline-flex rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Create New Referral
            </Link>

          </div>

        </div>

      </div>
    );
  }

  /*
   * =========================================================
   * DISPLAY DATA
   * =========================================================
   */

  const hospital =
    referral.destinationHospital;

  const service =
    referral.requiredService;

  const medicalStaff =
    referral.medicalStaff;

  const status =
    referral.status ||
    "CREATED";

  const formattedStatus =
    status.replaceAll(
      "_",
      " "
    );

  const locationTime =
    location?.recordedAt
      ? new Date(
          location.recordedAt
        ).toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        )
      : null;

  const etaText =
    routeInfo.durationMin !==
    null
      ? `${Math.max(
          1,
          Math.ceil(
            routeInfo.durationMin
          )
        )} min`
      : "Unavailable";

  const distanceText =
    routeInfo.distanceKm !==
    null
      ? `${routeInfo.distanceKm.toFixed(
          1
        )} km`
      : "Unavailable";

  /*
   * =========================================================
   * MAIN UI
   * =========================================================
   */

  const hasLocation = Boolean(location);
  const journeyLabel =
    status === "REJECTED"
      ? "Referral rejected"
      : status === "CREATED" || status === "SENT" || status === "RECEIVED"
        ? "Waiting for hospital confirmation"
        : status === "ACCEPTED"
          ? "Referral accepted · preparing arrival"
          : status === "AMBULANCE_ASSIGNED"
            ? "Ambulance assigned"
            : status === "ARRIVED" || status === "COMPLETED"
              ? "Patient has arrived"
              : "En route to destination";

  return (
    <main className="sr-page min-h-screen pb-16 pt-8">

      <div className="sr-shell">

        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>

            <Link
              to="/"
              className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
            >
              ← Back to MedRoute
            </Link>

            <div className="mt-3 flex flex-wrap items-center gap-3">

              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                MedRoute Live Tracking
              </h1>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
                #{referral.id}
              </span>

            </div>

            <p className="mt-2 text-sm text-slate-500">
              Monitor the referral and ambulance
              journey in real time.
            </p>

          </div>

          <div className="flex items-center gap-3">

            <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">

              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  socketConnected
                    ? "animate-pulse bg-emerald-500"
                    : "bg-slate-300"
                }`}
              />

              <span className="text-xs font-semibold text-slate-600">
                {socketConnected
                  ? "LIVE"
                  : "CONNECTING"}
              </span>

            </div>

            <div className="rounded-full bg-blue-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white">
              {formattedStatus}
            </div>

          </div>

        </div>

        {/* MAIN GRID */}

        <div className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">

          {/* MAP SECTION */}

          <section className="sr-card overflow-hidden">

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

              <div>

                <h2 className="font-bold text-slate-900">
                  Live Ambulance Location
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Ambulance position and route
                  update automatically.
                </p>

              </div>

              <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5">

                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />

                <span className="text-xs font-semibold text-emerald-700">
                  Live
                </span>

              </div>

            </div>

            {/* MAP */}

            <div className="relative">

              <div
                ref={
                  mapContainerRef
                }
                className="h-120 w-full"
              />

              {/* MAP INFO CARD */}

              <div className="absolute bottom-4 left-4 right-4">

                <div className="rounded-3xl bg-white/95 p-4 shadow-xl backdrop-blur">

                  {/* AMBULANCE HEADER */}

                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-3">

                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-2xl shadow-md">
                        🚑
                      </div>

                      <div>

                        <p className="text-sm font-bold text-slate-900">
                                  {journeyLabel}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {medicalStaff?.name ||
                            "Medical staff assigned"}
                        </p>

                      </div>

                    </div>

                    <div className="text-right">

                      <p className="text-xs font-medium text-slate-400">
                        STATUS
                      </p>

                      <p className="mt-1 text-sm font-bold text-emerald-600">
                        {socketConnected ? "LIVE" : "RECONNECTING"}
                      </p>

                    </div>

                  </div>

                  {/* ETA + DISTANCE */}

                  <div className="mt-4 grid grid-cols-2 gap-3">

                    <div className="rounded-2xl bg-slate-50 px-3 py-3">

                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        ETA
                      </p>

                      <p className="mt-1 text-lg font-bold text-slate-900">

                        {!hasLocation
                          ? "Waiting"
                          : routeLoading
                          ? "Finding route..."
                          : etaText}

                      </p>

                    </div>

                    <div className="rounded-2xl bg-slate-50 px-3 py-3">

                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Distance
                      </p>

                      <p className="mt-1 text-lg font-bold text-slate-900">

                        {!hasLocation
                          ? "Waiting"
                          : routeLoading
                          ? "Finding route..."
                          : distanceText}

                      </p>

                    </div>

                  </div>

                  {/* AMBULANCE + UPDATED */}

                  <div className="mt-3 grid grid-cols-2 gap-3">

                    <div className="rounded-2xl bg-slate-50 px-3 py-2">

                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Ambulance
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {medicalStaff?.ambulanceNumber ||
                          "AMB"}
                      </p>

                    </div>

                    <div className="rounded-2xl bg-slate-50 px-3 py-2">

                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Updated
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {locationTime || "Waiting"}
                      </p>

                    </div>

                  </div>

                  {/* ROUTE SOURCE */}

                  {!hasLocation && (
                    <div className="mt-3 rounded-2xl bg-blue-50 px-3 py-2">
                      <p className="text-xs font-semibold text-blue-700">
                        {medicalStaff
                          ? "Waiting for ambulance location."
                          : "Medical staff has not been assigned yet."}
                      </p>
                    </div>
                  )}

                  {locationError && (
                    <div className="mt-3 rounded-2xl bg-red-50 px-3 py-2">
                      <p className="text-xs font-medium text-red-700">
                        {locationError}
                      </p>
                    </div>
                  )}

                  {routeInfo.source && hasLocation && (
                    <div className="mt-3">

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${
                          routeInfo.source ===
                          "OSRM"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >

                        {routeInfo.source ===
                        "OSRM"
                          ? "Real road route"
                          : "Estimated route"}

                      </span>

                    </div>
                  )}

                  {/* ROUTE ERROR */}

                  {routeError && (
                    <div className="mt-3 rounded-2xl bg-amber-50 px-3 py-2">

                      <p className="text-xs font-medium text-amber-700">
                        {routeError}
                      </p>

                    </div>
                  )}

                </div>

              </div>

            </div>

            {/* COORDINATES */}

            <div className="grid grid-cols-2 gap-px bg-slate-100">

              <div className="bg-white px-5 py-4">

                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Latitude
                </p>

                <p className="mt-1 font-mono text-sm font-semibold text-slate-700">

                  {location
                    ? Number(
                        location.latitude
                      ).toFixed(6)
                    : "Waiting..."}

                </p>

              </div>

              <div className="bg-white px-5 py-4">

                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Longitude
                </p>

                <p className="mt-1 font-mono text-sm font-semibold text-slate-700">

                  {location
                    ? Number(
                        location.longitude
                      ).toFixed(6)
                    : "Waiting..."}

                </p>

              </div>

            </div>

          </section>

          {/* RIGHT SIDE */}

          <div className="space-y-5">

            {/* REFERRAL CARD */}

            <section className="rounded-3xl bg-white p-6 shadow-sm">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-xl">
                  📋
                </div>

                <div>

                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Referral
                  </p>

                  <h2 className="font-bold text-slate-900">
                    #{referral.id}
                  </h2>

                </div>

              </div>

              <div className="mt-6 space-y-4">

                <div>

                  <p className="text-xs font-medium text-slate-400">
                    Patient
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {referral.patientName}
                  </p>

                </div>

                <div>

                  <p className="text-xs font-medium text-slate-400">
                    Required Service
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {service?.name ||
                      "Medical Service"}
                  </p>

                </div>

                {referral.referringDoctorName && (
                  <div>

                    <p className="text-xs font-medium text-slate-400">
                      Referring Doctor
                    </p>

                    <p className="mt-1 font-semibold text-slate-800">
                      {
                        referral.referringDoctorName
                      }
                    </p>

                  </div>
                )}

              </div>

            </section>

            {/* DESTINATION */}

            <section className="rounded-3xl bg-white p-6 shadow-sm">

              <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl">
                  🏥
                </div>

                <div className="min-w-0">

                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Destination
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-slate-900">
                    {hospital?.name ||
                      "Hospital"}
                  </h2>

                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    {hospital?.address ||
                      hospital?.city ||
                      "Destination hospital"}
                  </p>

                </div>

              </div>

              <div className="mt-5 rounded-2xl bg-blue-50 p-4">

                <div className="flex items-center justify-between">

                  <span className="text-xs font-semibold text-blue-700">
                    Hospital location
                  </span>

                  <span className="text-xs text-blue-500">
                    🏥 Map
                  </span>

                </div>

                <p className="mt-2 font-mono text-xs text-blue-900">

                  {hospital?.latitude
                    ? Number(
                        hospital.latitude
                      ).toFixed(6)
                    : "—"}

                  {" , "}

                  {hospital?.longitude
                    ? Number(
                        hospital.longitude
                      ).toFixed(6)
                    : "—"}

                </p>

              </div>

            </section>

            {/* MEDICAL STAFF */}

            <section className="rounded-3xl bg-white p-6 shadow-sm">

              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl">
                  👨‍⚕️
                </div>

                <div>

                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Medical Staff
                  </p>

                  <h2 className="font-bold text-slate-900">
                    {medicalStaff?.name ||
                      "Not assigned"}
                  </h2>

                </div>

              </div>

              {medicalStaff && (
                <div className="mt-5 space-y-3">

                  <div className="flex items-center justify-between">

                    <span className="text-sm text-slate-500">
                      Role
                    </span>

                    <span className="text-sm font-semibold text-slate-800">
                      {medicalStaff.role}
                    </span>

                  </div>

                  <div className="flex items-center justify-between">

                    <span className="text-sm text-slate-500">
                      Ambulance
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      {medicalStaff.ambulanceNumber ||
                        "Not assigned"}
                    </span>

                  </div>

                  {medicalStaff.phone && (
                    <div className="flex items-center justify-between">

                      <span className="text-sm text-slate-500">
                        Contact
                      </span>

                      <span className="text-sm font-semibold text-slate-800">
                        {medicalStaff.phone}
                      </span>

                    </div>
                  )}

                </div>
              )}

            </section>

          </div>

        </div>

            {/* REFERRAL JOURNEY */}

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">

          <div className="mb-6">

            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Referral Journey
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Emergency care coordination
            </h2>

          </div>

          <div className="grid gap-4 md:grid-cols-4">

            <JourneyStep
              number="01"
              title="Referral Created"
              active={true}
              description="Referral submitted"
            />

            <JourneyStep
              number="02"
              title="Hospital"
              active={[
                "SENT",
                "RECEIVED",
                "ACCEPTED",
              ].includes(status)}
              description={
                status ===
                "ACCEPTED"
                  ? "Hospital accepted"
                  : "Awaiting confirmation"
              }
            />

            <JourneyStep
              number="03"
              title="Ambulance"
              active={Boolean(
                medicalStaff &&
                  location
              )}
              description={
                location
                  ? "Live tracking active"
                  : "Waiting for location"
              }
            />

            <JourneyStep
              number="04"
              title="Arrival"
              active={
                status ===
                "COMPLETED"
              }
              description={
                status ===
                "COMPLETED"
                  ? "Patient arrived"
                  : "Destination hospital"
              }
            />

          </div>

        </section>

      </div>

    </main>
  );
}

/*
 * ===========================================================
 * REAL ROUTE CALCULATION
 * ===========================================================
 */

async function calculateRoute({
  map,
  ambulanceLat,
  ambulanceLng,
  hospitalLat,
  hospitalLng,
  requestRef,
  setRouteInfo,
  setRouteLoading,
  setRouteError,
}) {
  const requestId =
    ++requestRef.current;

  setRouteLoading(true);

  setRouteError("");

  /*
   * ---------------------------------------------------------
   * FALLBACK DISTANCE
   * ---------------------------------------------------------
   */

  const fallbackDistance =
    calculateDistanceKm(
      ambulanceLat,
      ambulanceLng,
      hospitalLat,
      hospitalLng
    );

  const fallbackDuration =
    calculateEstimatedMinutes(
      fallbackDistance
    );

  /*
   * ---------------------------------------------------------
   * DRAW FALLBACK ROUTE FIRST
   * ---------------------------------------------------------
   */

  drawFallbackRoute(
    map,
    [
      [
        ambulanceLng,
        ambulanceLat,
      ],
      [
        hospitalLng,
        hospitalLat,
      ],
    ]
  );

  fitFallbackBounds(
    map,
    [
      ambulanceLng,
      ambulanceLat,
    ],
    [
      hospitalLng,
      hospitalLat,
    ]
  );

  /*
   * Keep usable values while OSRM loads.
   */

  setRouteInfo({
    distanceKm:
      fallbackDistance,

    durationMin:
      fallbackDuration,

    source:
      "ESTIMATE",
  });

  /*
   * ---------------------------------------------------------
   * OSRM URL
   * ---------------------------------------------------------
   */

  const url =
    `${OSRM_URL}/` +
    `${ambulanceLng},${ambulanceLat};` +
    `${hospitalLng},${hospitalLat}` +
    "?overview=full&geometries=geojson";

  console.log(
    "OSRM REQUEST:",
    url
  );

  const controller =
    new AbortController();

  const timeoutId =
    setTimeout(() => {
      controller.abort();
    }, 8000);

  try {
    const response =
      await fetch(
        url,
        {
          method: "GET",
          signal:
            controller.signal,
        }
      );

    clearTimeout(
      timeoutId
    );

    console.log(
      "OSRM STATUS:",
      response.status
    );

    if (!response.ok) {
      throw new Error(
        `OSRM HTTP ${response.status}`
      );
    }

    const data =
      await response.json();

    if (
      !data.routes ||
      !data.routes.length
    ) {
      throw new Error(
        "No route found."
      );
    }

    if (
      requestId !==
      requestRef.current
    ) {
      return;
    }

    const route =
      data.routes[0];

    const distanceKm =
      Number(
        route.distance
      ) / 1000;

    const durationMin =
      Number(
        route.duration
      ) / 60;

    /*
     * Draw real road geometry.
     */

    drawRealRoute(
      map,
      route.geometry
    );

    /*
     * Fit map to real route.
     */

    fitRouteOnMap(
      map,
      route.geometry
    );

    /*
     * Update UI.
     */

    setRouteInfo({
      distanceKm,

      durationMin,

      source:
        "OSRM",
    });

    setRouteError("");

    console.log(
      "REAL ROAD ROUTE READY:",
      {
        distanceKm,
        durationMin,
      }
    );
  } catch (err) {
    clearTimeout(
      timeoutId
    );

    console.warn(
      "OSRM unavailable:",
      err
    );

    if (
      requestId !==
      requestRef.current
    ) {
      return;
    }

    /*
     * Fallback remains active.
     */

    setRouteInfo({
      distanceKm:
        fallbackDistance,

      durationMin:
        fallbackDuration,

      source:
        "ESTIMATE",
    });

    if (
      err.name ===
      "AbortError"
    ) {
      setRouteError(
        "Road routing timed out. Showing an estimated route."
      );
    } else {
      setRouteError(
        "Road routing unavailable. Showing an estimated route."
      );
    }
  } finally {
    clearTimeout(
      timeoutId
    );

    if (
      requestId ===
      requestRef.current
    ) {
      setRouteLoading(
        false
      );
    }
  }
}

/*
 * ===========================================================
 * DRAW REAL ROAD ROUTE
 * ===========================================================
 */

function drawRealRoute(
  map,
  geometry
) {
  if (
    !map ||
    !geometry
  ) {
    return;
  }

  const sourceId =
    "ambulance-route";

  const layerId =
    "ambulance-route-line";

  const routeData = {
    type: "Feature",

    properties: {},

    geometry,
  };

  if (
    !map.isStyleLoaded()
  ) {
    map.once(
      "load",
      () => {
        drawRealRoute(
          map,
          geometry
        );
      }
    );

    return;
  }

  if (
    !map.getSource(
      sourceId
    )
  ) {
    map.addSource(
      sourceId,
      {
        type: "geojson",

        data: routeData,
      }
    );
  } else {
    map
      .getSource(
        sourceId
      )
      ?.setData(
        routeData
      );
  }

  if (
    !map.getLayer(
      layerId
    )
  ) {
    map.addLayer({
      id: layerId,

      type: "line",

      source: sourceId,

      layout: {
        "line-cap":
          "round",

        "line-join":
          "round",
      },

      paint: {
        "line-color":
          "#2563eb",

        "line-width":
          6,

        "line-opacity":
          0.85,
      },
    });
  } else {
    map.setPaintProperty(
      layerId,
      "line-color",
      "#2563eb"
    );

    map.setPaintProperty(
      layerId,
      "line-width",
      6
    );

    map.setPaintProperty(
      layerId,
      "line-opacity",
      0.85
    );

    map.setPaintProperty(
      layerId,
      "line-dasharray",
      [
        1,
        0,
      ]
    );
  }
}

/*
 * ===========================================================
 * DRAW FALLBACK ROUTE
 * ===========================================================
 */

function drawFallbackRoute(
  map,
  coordinates
) {
  if (!map) {
    return;
  }

  const sourceId =
    "ambulance-route";

  const layerId =
    "ambulance-route-line";

  const routeData = {
    type: "Feature",

    properties: {},

    geometry: {
      type: "LineString",

      coordinates,
    },
  };

  if (
    !map.isStyleLoaded()
  ) {
    map.once(
      "load",
      () => {
        drawFallbackRoute(
          map,
          coordinates
        );
      }
    );

    return;
  }

  if (
    !map.getSource(
      sourceId
    )
  ) {
    map.addSource(
      sourceId,
      {
        type: "geojson",

        data: routeData,
      }
    );
  } else {
    map
      .getSource(
        sourceId
      )
      ?.setData(
        routeData
      );
  }

  if (
    !map.getLayer(
      layerId
    )
  ) {
    map.addLayer({
      id: layerId,

      type: "line",

      source: sourceId,

      layout: {
        "line-cap":
          "round",

        "line-join":
          "round",
      },

      paint: {
        "line-color":
          "#64748b",

        "line-width":
          5,

        "line-dasharray":
          [
            2,
            2,
          ],

        "line-opacity":
          0.7,
      },
    });
  } else {
    map.setPaintProperty(
      layerId,
      "line-color",
      "#64748b"
    );

    map.setPaintProperty(
      layerId,
      "line-width",
      5
    );

    map.setPaintProperty(
      layerId,
      "line-dasharray",
      [
        2,
        2,
      ]
    );

    map.setPaintProperty(
      layerId,
      "line-opacity",
      0.7
    );
  }
}

/*
 * ===========================================================
 * FIT REAL ROUTE
 * ===========================================================
 */

function fitRouteOnMap(
  map,
  geometry
) {
  if (
    !map ||
    !geometry?.coordinates?.length
  ) {
    return;
  }

  const bounds =
    new maplibregl.LngLatBounds();

  for (
    const coordinate of
    geometry.coordinates
  ) {
    bounds.extend(
      coordinate
    );
  }

  map.fitBounds(
    bounds,
    {
      padding: {
        top: 70,
        bottom: 150,
        left: 60,
        right: 60,
      },

      duration: 900,

      maxZoom: 15,
    }
  );
}

/*
 * ===========================================================
 * FIT FALLBACK ROUTE
 * ===========================================================
 */

function fitFallbackBounds(
  map,
  ambulance,
  hospital
) {
  if (!map) {
    return;
  }

  const bounds =
    new maplibregl.LngLatBounds();

  bounds.extend(
    ambulance
  );

  bounds.extend(
    hospital
  );

  map.fitBounds(
    bounds,
    {
      padding: {
        top: 70,
        bottom: 150,
        left: 60,
        right: 60,
      },

      duration: 900,

      maxZoom: 15,
    }
  );
}

/*
 * ===========================================================
 * HAVERSINE DISTANCE
 * ===========================================================
 */

function calculateDistanceKm(
  lat1,
  lon1,
  lat2,
  lon2
) {
  const earthRadiusKm =
    6371;

  const dLat =
    toRadians(
      lat2 - lat1
    );

  const dLon =
    toRadians(
      lon2 - lon1
    );

  const a =
    Math.sin(
      dLat / 2
    ) ** 2 +
    Math.cos(
      toRadians(lat1)
    ) *
      Math.cos(
        toRadians(lat2)
      ) *
      Math.sin(
        dLon / 2
      ) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return (
    earthRadiusKm * c
  );
}

/*
 * ===========================================================
 * ESTIMATED ETA
 * ===========================================================
 *
 * Prototype estimate only.
 *
 * Uses 30 km/h average speed.
 *
 * This is not a medically validated ETA.
 * ===========================================================
 */

function calculateEstimatedMinutes(
  distanceKm
) {
  const averageSpeedKmH =
    30;

  return Math.max(
    1,
    (distanceKm /
      averageSpeedKmH) *
      60
  );
}

/*
 * ===========================================================
 * HELPERS
 * ===========================================================
 */

function toRadians(
  degrees
) {
  return (
    (degrees * Math.PI) /
    180
  );
}

function escapeHtml(
  value
) {
  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}

/*
 * ===========================================================
 * JOURNEY STEP
 * ===========================================================
 */

function JourneyStep({
  number,
  title,
  description,
  active,
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        active
          ? "border-blue-100 bg-blue-50"
          : "border-slate-100 bg-slate-50"
      }`}
    >

      <div className="flex items-center gap-3">

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${
            active
              ? "bg-blue-600 text-white"
              : "bg-slate-200 text-slate-500"
          }`}
        >
          {number}
        </div>

        <div>

          <p
            className={`text-sm font-bold ${
              active
                ? "text-blue-900"
                : "text-slate-700"
            }`}
          >
            {title}
          </p>

          <p className="mt-0.5 text-xs text-slate-500">
            {description}
          </p>

        </div>

      </div>

    </div>
  );
}

export default Tracking;

