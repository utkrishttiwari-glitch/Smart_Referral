import { calculateHospitalScore } from "./src/services/scoringService.js";

const testHospitals = [
  {
    hospital: {
      id: 2,
      name: "Metro General Hospital",
    },
    service: {
      capacity: 5,
    },
    distanceKm: 2.02,
    freshness: {
      score: 50,
    },
    dataVerified: true,
  },
  {
    hospital: {
      id: 3,
      name: "Sunrise Medical Center",
    },
    service: {
      capacity: 8,
    },
    distanceKm: 12.03,
    freshness: {
      score: 50,
    },
    dataVerified: true,
  },
];

console.log("\nHospital scores:\n");

for (const hospital of testHospitals) {
  const score = calculateHospitalScore(hospital);

  console.log({
    name: hospital.hospital.name,
    ...score,
  });

  
}

