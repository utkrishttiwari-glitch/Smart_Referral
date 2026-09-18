// verify_hospital_data.js
import fs from 'fs';
import path from 'path';
import { db } from '../src/db.js';

async function main() {
  // Connect to DB
  await db.connect();

  // Ensure reports directory exists
  const reportsDir = path.resolve('../reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  // Helper to write CSV
  const writeCsv = (filename, rows, headers) => {
    const csvLines = [];
    csvLines.push(headers.join(','));
    rows.forEach(row => {
      const line = headers.map(h => {
        let val = row[h];
        if (val === null || val === undefined) return '';
        const s = String(val).replace(/"/g, '""');
        if (s.includes(',') || s.includes('\n') || s.includes('"')) {
          return `"${s}"`;
        }
        return s;
      }).join(',');
      csvLines.push(line);
    });
    fs.writeFileSync(path.join(reportsDir, filename), csvLines.join('\n'));
  };

  // Query tables
  const hospitals = await db.orm.public.Hospital.select(
    "id",
    "name",
    "address",
    "city",
    "state",
    "phone",
    "latitude",
    "longitude",
    "isActive",
    "source",
    "sourceUpdatedAt",
    "created_at",
    "updated_at"
  ).all();

  const hospitalServices = await db.orm.public.HospitalService.select(
    "hospitalId",
    "serviceId",
    "isAvailable",
    "capacity",
    "updatedAt"
  ).all();

  const bedAvail = await db.orm.public.BedAvailability.select(
    "hospitalId",
    "bedType",
    "totalBeds",
    "availableBeds",
    "updatedAt"
  ).all();

  const dataUpdates = await db.orm.public.HospitalDataUpdate.select(
    "hospitalId",
    "source",
    "dataType",
    "updatedAt",
    "verified"
  ).all();

  // Write CSV export (hospitals only)
  writeCsv('hospital-data-export.csv', hospitals, [
    'id','name','address','city','state','phone','latitude','longitude','isActive','source','sourceUpdatedAt','created_at','updated_at'
  ]);

  // Build markdown report
  let md = `# Hospital Data Report\n\n## Hospitals (${hospitals.length})\n\n`;
  md += '| ID | Name | City | State | Active | Source | Updated Today? |\n';
  md += '|---|---|---|---|---|---|---|\n';
  const today = new Date().toISOString().split('T')[0];
  hospitals.forEach(h => {
    const upd = h.sourceUpdatedAt ? new Date(h.sourceUpdatedAt).toISOString().split('T')[0] : '';
    const updatedToday = upd === today ? 'Yes' : 'No';
    md += `| ${h.id} | ${h.name} | ${h.city} | ${h.state} | ${h.isActive} | ${h.source} | ${updatedToday} |\n`;
  });

  md += `\n## Hospital Services (${hospitalServices.length})\n\n`;
  md += '| Hospital ID | Service ID | Available | Capacity | Updated At |\n';
  md += '|---|---|---|---|---|\n';
  hospitalServices.forEach(s => {
    md += `| ${s.hospitalId} | ${s.serviceId} | ${s.isAvailable} | ${s.capacity} | ${s.updatedAt} |\n`;
  });

  md += `\n## Bed Availability (${bedAvail.length})\n\n`;
  md += '| Hospital ID | Bed Type | Total Beds | Available Beds | Updated At |\n';
  md += '|---|---|---|---|---|\n';
  bedAvail.forEach(b => {
    md += `| ${b.hospitalId} | ${b.bedType} | ${b.totalBeds} | ${b.availableBeds} | ${b.updatedAt} |\n`;
  });

  md += `\n## Hospital Data Updates (${dataUpdates.length})\n\n`;
  md += '| Hospital ID | Source | Data Type | Updated At | Verified |\n';
  md += '|---|---|---|---|---|\n';
  dataUpdates.forEach(d => {
    md += `| ${d.hospitalId} | ${d.source} | ${d.dataType} | ${d.updatedAt} | ${d.verified} |\n`;
  });

  // Demo hospitals detection
  const demoNames = ['City Care Hospital', 'Metro General Hospital', 'Sunrise Medical Center'];
  const demoHospitals = hospitals.filter(h => demoNames.includes(h.name));
  if (demoHospitals.length > 0) {
    md += `\n> **NOTE** Demo hospitals still present: ${demoHospitals.map(h => h.name).join(', ')}\n`;
  }

  // Write markdown report
  fs.writeFileSync(path.join(reportsDir, 'hospital-data-report.md'), md);

  // Close DB connection
  await db.close();
  console.log('Report generation completed');
}

main().catch(err => {
  console.error('Error generating report:', err);
});

