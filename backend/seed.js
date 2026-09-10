import { db } from "./src/db.js";

try {
  // 1. Create or find services
  const emergency =
    await db.orm.public.Service.first({ name: "Emergency Care" }) ??
    await db.orm.public.Service.create({
      name: "Emergency Care",
      description: "24/7 emergency medical care",
      isActive: true,
    });

  const trauma =
    await db.orm.public.Service.first({ name: "Trauma Care" }) ??
    await db.orm.public.Service.create({
      name: "Trauma Care",
      description: "Emergency trauma and injury treatment",
      isActive: true,
    });

  const cardiology =
    await db.orm.public.Service.first({ name: "Cardiology" }) ??
    await db.orm.public.Service.create({
      name: "Cardiology",
      description: "Cardiac diagnosis and treatment",
      isActive: true,
    });

  console.log("Services ready");

  // 2. Create or find hospitals
  const cityCare =
    await db.orm.public.Hospital.first({
      name: "City Care Hospital",
    }) ??
    await db.orm.public.Hospital.create({
      name: "City Care Hospital",
      address: "MG Road",
      city: "Delhi",
      state: "Delhi",
      latitude: 28.6139,
      longitude: 77.2090,
      phone: "011-40000001",
      isActive: true,
    });

  const metroGeneral =
    await db.orm.public.Hospital.first({
      name: "Metro General Hospital",
    }) ??
    await db.orm.public.Hospital.create({
      name: "Metro General Hospital",
      address: "Connaught Place",
      city: "Delhi",
      state: "Delhi",
      latitude: 28.6304,
      longitude: 77.2177,
      phone: "011-40000002",
      isActive: true,
    });

  const sunrise =
    await db.orm.public.Hospital.first({
      name: "Sunrise Medical Center",
    }) ??
    await db.orm.public.Hospital.create({
      name: "Sunrise Medical Center",
      address: "Noida Sector 18",
      city: "Noida",
      state: "Uttar Pradesh",
      latitude: 28.5706,
      longitude: 77.3219,
      phone: "0120-40000003",
      isActive: true,
    });

  console.log("Hospitals ready");

  // 3. Create or find hospital-service relationships

  const hospitalServices = [
    {
      hospitalId: cityCare.id,
      serviceId: emergency.id,
      isAvailable: true,
      capacity: 0,
      notes: "Emergency department currently at capacity",
    },
    {
      hospitalId: metroGeneral.id,
      serviceId: emergency.id,
      isAvailable: true,
      capacity: 5,
      notes: "Emergency beds available",
    },
    {
      hospitalId: sunrise.id,
      serviceId: emergency.id,
      isAvailable: true,
      capacity: 8,
      notes: "Emergency department operational",
    },
    {
      hospitalId: metroGeneral.id,
      serviceId: trauma.id,
      isAvailable: true,
      capacity: 3,
      notes: "Trauma unit operational",
    },
    {
      hospitalId: sunrise.id,
      serviceId: cardiology.id,
      isAvailable: true,
      capacity: 4,
      notes: "Cardiology beds available",
    },
  ];

  for (const hospitalService of hospitalServices) {
    const existing =
      await db.orm.public.HospitalService.first({
        hospitalId: hospitalService.hospitalId,
        serviceId: hospitalService.serviceId,
      });

    if (!existing) {
      await db.orm.public.HospitalService.create(hospitalService);
    }
  }

  console.log("Hospital services ready");

  // 4. Create or find bed availability records

  const bedRecords = [
    {
      hospitalId: cityCare.id,
      bedType: "Emergency",
      totalBeds: 20,
      availableBeds: 0,
    },
    {
      hospitalId: metroGeneral.id,
      bedType: "Emergency",
      totalBeds: 30,
      availableBeds: 5,
    },
    {
      hospitalId: sunrise.id,
      bedType: "Emergency",
      totalBeds: 40,
      availableBeds: 8,
    },
  ];

  for (const bedRecord of bedRecords) {
    const existing =
      await db.orm.public.BedAvailability.first({
        hospitalId: bedRecord.hospitalId,
        bedType: bedRecord.bedType,
      });

    if (!existing) {
      await db.orm.public.BedAvailability.create(bedRecord);
    }
  }

  console.log("Bed availability ready");

  // 5. Create or find data freshness records

  const dataUpdates = [
    {
      hospitalId: cityCare.id,
      source: "MANUAL",
      dataType: "BED_AVAILABILITY",
      isVerified: true,
    },
    {
      hospitalId: metroGeneral.id,
      source: "HMIS",
      dataType: "BED_AVAILABILITY",
      isVerified: true,
    },
    {
      hospitalId: sunrise.id,
      source: "MANUAL",
      dataType: "BED_AVAILABILITY",
      isVerified: true,
    },
  ];

  for (const dataUpdate of dataUpdates) {
    const existing =
      await db.orm.public.HospitalDataUpdate.first({
        hospitalId: dataUpdate.hospitalId,
        source: dataUpdate.source,
        dataType: dataUpdate.dataType,
      });

    if (!existing) {
      await db.orm.public.HospitalDataUpdate.create(dataUpdate);
    }
  }

  console.log("Data freshness records ready");

  console.log("\nDatabase seeding completed successfully.");
} catch (error) {
  console.error("\nDatabase seeding failed:");
  console.error(error);
} finally {
  await db.close();
}