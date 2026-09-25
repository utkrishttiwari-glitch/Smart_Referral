import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const API_URL = "https://smart-referral-backend.onrender.com";
const SOCKET_URL = "https://smart-referral-backend.onrender.com";

/*
 * OpenStreetMap raster map
 */
const MAP_STYLE = {
  version: 8,

  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },

  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
    },
  ],
};

/*
 * Helper:
 * Handles API responses such as:
 *
 * { success: true, data: {...} }
 * { success: true, data: [...] }
 * {...}
 */
function unwrapData(result) {
  if (
    result &&
    typeof result === "object" &&
    Object.prototype.hasOwnProperty.call(result, "data")
  ) {
    return result.data;
  }

  return result;
}

/*
 * Extract latitude/longitude safely.
 */
function getCoordinates(value) {
  if (!value) return null;

  const latitude = Number(
    value.latitude ??
      value.lat ??
      value.location?.latitude
  );

  const longitude = Number(
    value.longitude ??
      value.lng ??
      value.lon ??
      value.location?.longitude
  );

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
}

function LiveTracking() {
  const { referralId } = useParams();

  /*
   * -----------------------------
   * Refs
   * -----------------------------
   */

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  const ambulanceMarkerRef = useRef(null);
  const hospitalMarkerRef = useRef(null);

  /*
   * -----------------------------
   * State
   * -----------------------------
   */

  const [referral, setReferral] = useState(null);
  const [medicalStaff, setMedicalStaff] = useState(null);
  const [hospital, setHospital] = useState(null);
  const [location, setLocation] = useState(null);

  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  /*
   * -----------------------------
   * 1. Load referral
   * -----------------------------
   */

  useEffect(() => {
    let cancelled = false;

    async function loadReferral() {
      try {
        const response = await fetch(
          `${API_URL}/api/referrals/${referralId}`
        );

        if (!response.ok) {
          throw new Error(
            `Referral request failed: ${response.status}`
          );
        }

        const result = await response.json();

        console.log(
          "REFERRAL API RESPONSE:",
          result
        );

        const data = unwrapData(result);

        console.log(
          "REFERRAL DATA:",
          data
        );

        if (!cancelled) {
          setReferral(data);
        }
      } catch (error) {
        console.error(
          "Failed to load referral:",
          error
        );
      }
    }

    if (referralId) {
      loadReferral();
    }

    return () => {
      cancelled = true;
    };
  }, [referralId]);

  /*
   * -----------------------------
   * 2. Load latest location
   * -----------------------------
   */

  useEffect(() => {
    let cancelled = false;

    async function loadLatestLocation() {
      try {
        const response = await fetch(
          `${API_URL}/api/location/referral/${referralId}/latest`
        );

        if (!response.ok) {
          throw new Error(
            `Location request failed: ${response.status}`
          );
        }

        const result = await response.json();

        console.log(
          "LATEST LOCATION RESPONSE:",
          result
        );

        const data = unwrapData(result);

        const coordinates = getCoordinates(data);

        if (!cancelled && coordinates) {
          setLocation({
            ...data,
            ...coordinates,
          });
        }
      } catch (error) {
        console.error(
          "Failed to load latest location:",
          error
        );
      }
    }

    if (referralId) {
      loadLatestLocation();
    }

    return () => {
      cancelled = true;
    };
  }, [referralId]);

  /*
   * -----------------------------
   * 3. Load hospital
   * -----------------------------
   */

  useEffect(() => {
    let cancelled = false;

    async function loadHospital() {
      /*
       * Wait until referral is available.
       */
      if (!referral) return;

      const hospitalId =
        referral.destinationHospitalId ??
        referral.destinationHospital?.id;

      if (!hospitalId) {
        console.warn(
          "No destination hospital ID found in referral:",
          referral
        );

        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/hospitals/${hospitalId}`
        );

        if (!response.ok) {
          throw new Error(
            `Hospital request failed: ${response.status}`
          );
        }

        const result = await response.json();

        console.log(
          "HOSPITAL API RESPONSE:",
          result
        );

        const data = unwrapData(result);

        console.log(
          "HOSPITAL DATA:",
          data
        );

        if (!cancelled && data) {
          setHospital(data);
        }
      } catch (error) {
        console.error(
          "Failed to load hospital:",
          error
        );
      }
    }

    loadHospital();

    return () => {
      cancelled = true;
    };
  }, [referral]);

  /*
   * -----------------------------
   * 4. Load medical staff
   * -----------------------------
   */

  useEffect(() => {
    let cancelled = false;

    async function loadMedicalStaff() {
      if (!referral) return;

      const staffId =
        referral.assignedMedicalStaffId ??
        referral.assignedMedicalStaff?.id;

      /*
       * If the referral already contains the
       * complete staff object, use it directly.
       */
      if (
        referral.assignedMedicalStaff &&
        typeof referral.assignedMedicalStaff === "object"
      ) {
        console.log(
          "STAFF FROM REFERRAL:",
          referral.assignedMedicalStaff
        );

        if (!cancelled) {
          setMedicalStaff(
            referral.assignedMedicalStaff
          );
        }

        return;
      }

      if (!staffId) {
        console.warn(
          "No assigned medical staff ID found:",
          referral
        );

        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/medical-staff`
        );

        if (!response.ok) {
          throw new Error(
            `Medical staff request failed: ${response.status}`
          );
        }

        const result = await response.json();

        console.log(
          "MEDICAL STAFF API RESPONSE:",
          result
        );

        const data = unwrapData(result);

        console.log(
          "MEDICAL STAFF DATA:",
          data
        );

        let staffList = [];

        if (Array.isArray(data)) {
          staffList = data;
        } else if (Array.isArray(data?.data)) {
          staffList = data.data;
        } else if (data?.id) {
          staffList = [data];
        }

        const assignedStaff = staffList.find(
          (staff) =>
            Number(staff.id) === Number(staffId)
        );

        console.log(
          "ASSIGNED STAFF:",
          assignedStaff
        );

        if (!cancelled) {
          setMedicalStaff(
            assignedStaff || null
          );
        }
      } catch (error) {
        console.error(
          "Failed to load medical staff:",
          error
        );
      }
    }

    loadMedicalStaff();

    return () => {
      cancelled = true;
    };
  }, [referral]);

  /*
   * -----------------------------
   * 5. Initial loading state
   * -----------------------------
   */

  useEffect(() => {
    if (
      referral ||
      location ||
      hospital
    ) {
      setLoading(false);
    }
  }, [referral, location, hospital]);

  /*
   * -----------------------------
   * 6. Socket.IO
   * -----------------------------
   */

  useEffect(() => {
    if (!referralId) return;

    console.log(
      "Connecting Socket.IO:",
      SOCKET_URL
    );

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log(
        "Socket connected:",
        socket.id
      );

      socket.emit(
        "join-referral",
        Number(referralId)
      );
    });

    socket.on(
      "location-update",
      (newLocation) => {
        console.log(
          "REAL-TIME LOCATION UPDATE:",
          newLocation
        );

        const coordinates =
          getCoordinates(newLocation);

        if (coordinates) {
          setLocation({
            ...newLocation,
            ...coordinates,
          });
        }
      }
    );

    socket.on(
      "medical-staff-assigned",
      (data) => {
        console.log(
          "MEDICAL STAFF ASSIGNED EVENT:",
          data
        );

        const staff =
          data?.medicalStaff ??
          data?.staff ??
          data;

        if (
          staff &&
          typeof staff === "object"
        ) {
          setMedicalStaff(staff);
        }
      }
    );

    socket.on(
      "referral-status-updated",
      (data) => {
        console.log(
          "REFERRAL STATUS UPDATED:",
          data
        );

        setReferral((previous) => ({
          ...(previous || {}),
          ...(data || {}),
        }));
      }
    );

    socket.on(
      "referral-updated",
      (data) => {
        console.log(
          "REFERRAL UPDATED:",
          data
        );

        setReferral((previous) => ({
          ...(previous || {}),
          ...(data || {}),
        }));
      }
    );

    socket.on(
      "connect_error",
      (error) => {
        console.error(
          "Socket connection error:",
          error.message
        );
      }
    );

    return () => {
      socket.emit(
        "leave-referral",
        Number(referralId)
      );

      socket.disconnect();

      console.log(
        "Socket disconnected"
      );
    };
  }, [referralId]);

  /*
   * -----------------------------
   * 7. Initialize MapLibre
   *
   * IMPORTANT:
   * Map no longer waits for hospital.
   *
   * It can initialize using:
   * location → hospital → fallback.
   * -----------------------------
   */

  useEffect(() => {
    if (!mapContainerRef.current) {
      return;
    }

    if (mapRef.current) {
      return;
    }

    /*
     * Determine initial center.
     */

    const locationCoordinates =
      getCoordinates(location);

    const hospitalCoordinates =
      getCoordinates(hospital);

    let center = [75.904, 22.758];

    if (locationCoordinates) {
      center = [
        locationCoordinates.longitude,
        locationCoordinates.latitude,
      ];
    } else if (hospitalCoordinates) {
      center = [
        hospitalCoordinates.longitude,
        hospitalCoordinates.latitude,
      ];
    }

    console.log(
      "INITIAL MAP CENTER:",
      center
    );

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLE,
        center,
        zoom: 13,
        attributionControl: true,
      });

      mapRef.current = map;

      map.addControl(
        new maplibregl.NavigationControl(),
        "top-right"
      );

      map.on("load", () => {
        console.log(
          "MAPLIBRE LOADED SUCCESSFULLY"
        );

        map.resize();

        setMapReady(true);

        setTimeout(() => {
          map.resize();
        }, 300);
      });

      map.on("error", (event) => {
        console.error(
          "MAPLIBRE ERROR:",
          event
        );
      });
    } catch (error) {
      console.error(
        "MAP INITIALIZATION ERROR:",
        error
      );
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      ambulanceMarkerRef.current = null;
      hospitalMarkerRef.current = null;

      setMapReady(false);
    };
  }, []);

  /*
   * -----------------------------
   * 8. Force resize
   * -----------------------------
   */

  useEffect(() => {
    if (!mapRef.current) return;

    setTimeout(() => {
      mapRef.current.resize();
    }, 100);
  }, [mapReady]);

  /*
   * -----------------------------
   * 9. Hospital marker
   * -----------------------------
   */

  useEffect(() => {
    if (!mapRef.current) return;
    if (!mapReady) return;
    if (!hospital) return;

    const coordinates =
      getCoordinates(hospital);

    if (!coordinates) {
      console.warn(
        "Hospital has invalid coordinates:",
        hospital
      );

      return;
    }

    /*
     * Remove old hospital marker.
     */

    if (hospitalMarkerRef.current) {
      hospitalMarkerRef.current.remove();
    }

    const hospitalElement =
      document.createElement("div");

    hospitalElement.style.width = "42px";
    hospitalElement.style.height = "42px";
    hospitalElement.style.borderRadius = "50%";
    hospitalElement.style.backgroundColor =
      "#dc2626";
    hospitalElement.style.border =
      "4px solid white";
    hospitalElement.style.boxShadow =
      "0 3px 14px rgba(0,0,0,0.30)";
    hospitalElement.style.display = "flex";
    hospitalElement.style.alignItems = "center";
    hospitalElement.style.justifyContent =
      "center";
    hospitalElement.style.color = "white";
    hospitalElement.style.fontSize = "20px";
    hospitalElement.style.fontWeight = "700";

    hospitalElement.innerHTML = "✚";

    hospitalMarkerRef.current =
      new maplibregl.Marker({
        element: hospitalElement,
      })
        .setLngLat([
          coordinates.longitude,
          coordinates.latitude,
        ])
        .setPopup(
          new maplibregl.Popup({
            offset: 25,
          }).setHTML(`
            <div style="font-family: Arial, sans-serif;">
              <strong>
                ${hospital.name || "Hospital"}
              </strong>
              <br/>
              <span>
                Destination Hospital
              </span>
            </div>
          `)
        )
        .addTo(mapRef.current);

    console.log(
      "HOSPITAL MARKER ADDED:",
      coordinates
    );
  }, [hospital, mapReady]);

  /*
   * -----------------------------
   * 10. Ambulance marker
   * -----------------------------
   */

  useEffect(() => {
    if (!mapRef.current) return;
    if (!mapReady) return;
    if (!location) return;

    const coordinates =
      getCoordinates(location);

    if (!coordinates) {
      console.warn(
        "Invalid ambulance coordinates:",
        location
      );

      return;
    }

    /*
     * If marker already exists,
     * smoothly move it instead of
     * recreating it.
     */

    if (ambulanceMarkerRef.current) {
      ambulanceMarkerRef.current.setLngLat([
        coordinates.longitude,
        coordinates.latitude,
      ]);

      console.log(
        "AMBULANCE MARKER MOVED:",
        coordinates
      );

      return;
    }

    /*
     * Create ambulance marker.
     */

    const ambulanceElement =
      document.createElement("div");

    ambulanceElement.style.width = "48px";
    ambulanceElement.style.height = "48px";
    ambulanceElement.style.borderRadius = "50%";
    ambulanceElement.style.backgroundColor =
      "#2563eb";
    ambulanceElement.style.border =
      "4px solid white";
    ambulanceElement.style.boxShadow =
      "0 3px 14px rgba(0,0,0,0.35)";
    ambulanceElement.style.display = "flex";
    ambulanceElement.style.alignItems =
      "center";
    ambulanceElement.style.justifyContent =
      "center";
    ambulanceElement.style.fontSize = "24px";
    ambulanceElement.style.cursor = "pointer";

    ambulanceElement.innerHTML = "🚑";

    ambulanceMarkerRef.current =
      new maplibregl.Marker({
        element: ambulanceElement,
      })
        .setLngLat([
          coordinates.longitude,
          coordinates.latitude,
        ])
        .setPopup(
          new maplibregl.Popup({
            offset: 25,
          }).setHTML(`
            <div style="font-family: Arial, sans-serif;">
              <strong>Ambulance</strong>
              <br/>
              <span>Live location</span>
            </div>
          `)
        )
        .addTo(mapRef.current);

    console.log(
      "AMBULANCE MARKER ADDED:",
      coordinates
    );
  }, [location, mapReady]);

  /*
   * -----------------------------
   * 11. Follow latest ambulance
   * -----------------------------
   *
   * We only center the map when
   * the first location arrives.
   *
   * This avoids constantly moving
   * the user's map while they zoom.
   * -----------------------------
   */

  const hasCenteredOnAmbulance =
    useRef(false);

  useEffect(() => {
    if (!mapRef.current) return;
    if (!mapReady) return;
    if (!location) return;

    const coordinates =
      getCoordinates(location);

    if (!coordinates) return;

    if (!hasCenteredOnAmbulance.current) {
      mapRef.current.easeTo({
        center: [
          coordinates.longitude,
          coordinates.latitude,
        ],
        zoom: 14,
        duration: 700,
      });

      hasCenteredOnAmbulance.current = true;
    }
  }, [location, mapReady]);

  /*
   * -----------------------------
   * 12. Fit route
   * -----------------------------
   *
   * This fits hospital + ambulance.
   * We intentionally do NOT draw a
   * fake straight road route.
   * -----------------------------
   */

  function fitRoute() {
    if (!mapRef.current) return;

    const bounds =
      new maplibregl.LngLatBounds();

    let hasPoint = false;

    const hospitalCoordinates =
      getCoordinates(hospital);

    const ambulanceCoordinates =
      getCoordinates(location);

    if (hospitalCoordinates) {
      bounds.extend([
        hospitalCoordinates.longitude,
        hospitalCoordinates.latitude,
      ]);

      hasPoint = true;
    }

    if (ambulanceCoordinates) {
      bounds.extend([
        ambulanceCoordinates.longitude,
        ambulanceCoordinates.latitude,
      ]);

      hasPoint = true;
    }

    if (!hasPoint) {
      return;
    }

    mapRef.current.fitBounds(bounds, {
      padding: 100,
      maxZoom: 15,
      duration: 800,
    });
  }

  /*
   * -----------------------------
   * 13. Distance calculation
   * -----------------------------
   */

  function calculateDistance() {
    const ambulance =
      getCoordinates(location);

    const destination =
      getCoordinates(hospital);

    if (!ambulance || !destination) {
      return null;
    }

    const R = 6371;

    const dLat =
      ((destination.latitude -
        ambulance.latitude) *
        Math.PI) /
      180;

    const dLon =
      ((destination.longitude -
        ambulance.longitude) *
        Math.PI) /
      180;

    const lat1 =
      (ambulance.latitude * Math.PI) /
      180;

    const lat2 =
      (destination.latitude * Math.PI) /
      180;

    const a =
      Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return R * c;
  }

  const distance =
    calculateDistance();

  /*
   * -----------------------------
   * 14. Render
   * -----------------------------
   */

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}

      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Medi-Referral
            </h1>

            <p className="text-sm text-slate-500">
              Live Ambulance Tracking
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>

            <span className="text-sm font-medium text-slate-700">
              Live
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-7">
        {/* REFERRAL */}

        <section className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500 uppercase tracking-wide">
                Referral
              </p>

              <h2 className="text-2xl font-bold text-slate-900 mt-1">
                {referral?.patientName ||
                  "Patient"}
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Referral #{referralId}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold">
                {referral?.status ||
                  "TRACKING"}
              </span>

              {(referral?.urgency ===
                "INSTANT" ||
                referral?.referralType ===
                  "INSTANT") && (
                <span className="px-4 py-2 rounded-full bg-red-50 text-red-700 text-sm font-semibold">
                  INSTANT
                </span>
              )}
            </div>
          </div>
        </section>

        {/* MAIN GRID */}

        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* MAP */}

          <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-4 py-5 sm:px-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Live Location
                </h3>

                <p className="text-sm text-slate-500">
                  Ambulance location updates in real time
                </p>
              </div>

              <button
                onClick={fitRoute}
                className="sr-fit-route rounded-xl border border-blue-300 bg-white px-4 py-2 text-blue-700 transition hover:bg-blue-50"
              >
                Fit Route
              </button>
            </div>

            {/* MAP CONTAINER */}

            <div
              ref={mapContainerRef}
              style={{
                width: "100%",
                height: "560px",
                minHeight: "560px",
                backgroundColor: "#e5e7eb",
              }}
            />

            {!mapReady && (
              <div className="px-6 py-3 border-t border-slate-200 text-sm text-slate-500">
                Initializing live map...
              </div>
            )}
          </section>

          {/* SIDEBAR */}

          <aside className="space-y-6">
            {/* MEDICAL STAFF */}

            <section className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-5">
                Medical Staff
              </h3>

              {medicalStaff ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500">
                      Name
                    </p>

                    <p className="font-medium text-slate-900">
                      {medicalStaff.name ||
                        "Not available"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Role
                    </p>

                    <p className="font-medium text-slate-900">
                      {medicalStaff.role ||
                        "Medical Staff"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Ambulance
                    </p>

                    <p className="font-medium text-slate-900">
                      {medicalStaff.ambulanceNumber ||
                        "Not available"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Contact
                    </p>

                    <p className="font-medium text-slate-900">
                      {medicalStaff.phone ||
                        "Not available"}
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-slate-500">
                    Medical staff not assigned yet.
                  </p>

                  {referral?.assignedMedicalStaffId && (
                    <p className="text-xs text-slate-400 mt-2">
                      Staff ID:{" "}
                      {referral.assignedMedicalStaffId}
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* LOCATION */}

            <section className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-5">
                Location Status
              </h3>

              {location ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs text-slate-500">
                        Latitude
                      </p>

                      <p className="font-semibold text-slate-900 mt-1">
                        {Number(
                          location.latitude
                        ).toFixed(6)}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs text-slate-500">
                        Longitude
                      </p>

                      <p className="font-semibold text-slate-900 mt-1">
                        {Number(
                          location.longitude
                        ).toFixed(6)}
                      </p>
                    </div>
                  </div>

                  {distance !== null && (
                    <div className="bg-blue-50 rounded-xl p-5">
                      <p className="text-sm text-blue-700">
                        Approx. distance to hospital
                      </p>

                      <p className="text-3xl font-bold text-blue-900 mt-1">
                        {distance.toFixed(2)} km
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-green-700">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>

                    Live location received
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500">
                  Waiting for ambulance location.
                </div>
              )}
            </section>

            {/* DESTINATION */}

            {hospital && (
              <section className="bg-white border border-slate-200 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Destination Hospital
                </h3>

                <p className="font-semibold text-slate-900">
                  {hospital.name ||
                    "Hospital"}
                </p>

                {hospital.address && (
                  <p className="text-sm text-slate-500 mt-1">
                    {hospital.address}
                  </p>
                )}

                <p className="text-sm text-slate-500 mt-2">
                  {hospital.city || ""}
                  {hospital.state
                    ? `, ${hospital.state}`
                    : ""}
                </p>

                {getCoordinates(
                  hospital
                ) && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400">
                      Hospital coordinates
                    </p>

                    <p className="text-sm text-slate-600 mt-1">
                      {Number(
                        hospital.latitude
                      ).toFixed(6)}
                      ,{" "}
                      {Number(
                        hospital.longitude
                      ).toFixed(6)}
                    </p>
                  </div>
                )}
              </section>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

export default LiveTracking;