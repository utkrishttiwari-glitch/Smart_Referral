// verify_hospital_data_pg.js
import "dotenv/config";
import { Client } from "pg";
import fs from "fs";
import path from "path";

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();

  const reportsDir = path.resolve("../reports");
  fs.mkdirSync(reportsDir, { recursive: true });

  const queryAll = async (text) => {
    const res = await client.query(text);
    return res.rows;
  };

  const hospitals = await queryAll(`SELECT id, name, address, city, state, phone, latitude, longitude, "isActive" as "isActive", source, "sourceUpdatedAt", created_at, updated_at FROM "Hospital" ORDER BY id`);
  const hospitalServices = await queryAll(`SELECT "hospitalId", "serviceId", "isAvailable", capacity, "updatedAt" FROM "HospitalService" ORDER BY "hospitalId"`);
  const bedAvailability = await queryAll(`SELECT "hospitalId", "bedType", "totalBeds", "availableBeds", "updatedAt" FROM "BedAvailability" ORDER BY "hospitalId"`);
  const dataUpdates = await queryAll(`SELECT "hospitalId", source, "dataType", "updatedAt", verified FROM "HospitalDataUpdate" ORDER BY "hospitalId"`);

  // Write CSV export (hospitals only)
  const csvHeaders = ["id","name","address","city","state","phone","latitude","longitude","isActive","source","sourceUpdatedAt","created_at","updated_at"];
  const csvLines = [csvHeaders.join(",")];
  hospitals.forEach(row => {
    const line = csvHeaders.map(h => {
      let v = row[h];
      if (v === null || v === undefined) return "";
      const s = String(v).replace(/"/g, '""');
      if (s.includes(',') || s.includes('\n') || s.includes('"')) {
        return `"${s}"`;
      }
      return s;
    }).join(",");
    csvLines.push(line);
  });
  fs.writeFileSync(path.join(reportsDir, "hospital-data-export.csv"), csvLines.join("\n"));

  // Build markdown report
  let md = `# Hospital Data Report\n\n`;
  md += `## Hospitals (${hospitals.length})\n\n`;
  md += "| ID | Name | City | State | Active | Source | Updated Today? |\n";
  md += "|---|---|---|---|---|---|---|\n";
  const today = new Date().toISOString().split('T')[0];
  hospitals.forEach(h => {
    const upd = h.sourceUpdatedAt ? new Date(h.sourceUpdatedAt).toISOString().split('T')[0] : '';
    const updatedToday = upd === today ? 'Yes' : 'No';
    md += `| ${h.id} | ${h.name} | ${h.city} | ${h.state} | ${h.isActive} | ${h.source} | ${updatedToday} |\n`;
  });

  md += `\n## Hospital Services (${hospitalServices.length})\n\n`;
  md += "| Hospital ID | Service ID | Available | Capacity | Updated At |\n|---|---|---|---|---|\n";
  hospitalServices.forEach(s => {
    md += `| ${s.hospitalId} | ${s.serviceId} | ${s.isAvailable} | ${s.capacity} | ${s.updatedAt} |\n`;
  });

  md += `\n## Bed Availability (${bedAvailability.length})\n\n`;
  md += "| Hospital ID | Bed Type | Total Beds | Available Beds | Updated At |\n|---|---|---|---|---|\n";
  bedAvailability.forEach(b => {
    md += `| ${b.hospitalId} | ${b.bedType} | ${b.totalBeds} | ${b.availableBeds} | ${b.updatedAt} |\n`;
  });

  md += `\n## Hospital Data Updates (${dataUpdates.length})\n\n`;
  md += "| Hospital ID | Source | Data Type | Updated At | Verified |\n|---|---|---|---|---|\n";
  dataUpdates.forEach(d => {
    md += `| ${d.hospitalId} | ${d.source} | ${d.dataType} | ${d.updatedAt} | ${d.verified} |\n`;
  });

  // Detect demo hospitals
  const demoNames = ["City Care Hospital", "Metro General Hospital", "Sunrise Medical Center"];
  const demoHospitals = hospitals.filter(h => demoNames.includes(h.name));
  if (demoHospitals.length > 0) {
    md += `\n> **NOTE** Demo hospitals still present: ${demoHospitals.map(h => h.name).join(', ')}\n`;
  }

  fs.writeFileSync(path.join(reportsDir, "hospital-data-report.md"), md);

  await client.end();
  console.log("Report generation completed");
}

main().catch(err => {
  console.error("Error generating report:", err);
});

