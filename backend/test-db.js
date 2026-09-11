import { db } from "./src/db.js";

try {
  const hospitals = await db.orm.public.Hospital
    .select(
      "id",
      "name",
      "city",
      "state",
      "latitude",
      "longitude",
      "isActive"
    )
    .all();

  console.log("\nHospitals:");
  console.table(hospitals);

  const services = await db.orm.public.Service
    .select(
      "id",
      "name",
      "description",
      "isActive"
    )
    .all();

  console.log("\nServices:");
  console.table(services);
} catch (error) {
  console.error("Database query failed:");
  console.error(error);
} finally {
  await db.close();
}