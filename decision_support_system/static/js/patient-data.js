/* ============================================================
   HALO FRONTEND — MOCK PATIENT DATA
   assets/js/patient-data.js

   Contains:
   - 15 realistic elderly patient records
   - computeRisks()  — per-patient risk scores
   - overallRisk()   — overall risk level string
   
   NOTE: In production this module is replaced by API calls
   to the Flask/Django backend. The function signatures
   (computeRisks, overallRisk) remain the same so the
   rest of the frontend doesn't need to change.
============================================================ */

/* ============================================================
   MOCK PATIENT RECORDS
   Fields mirror the patient-entry form exactly
============================================================ */
const MOCK_PATIENTS = [
  {
    id:'PT-A1F3C2', name:'James Okafor',      age:74, gender:'M', weight:82,  height:170,
    hba1c:8.6, sbp:158, dbp:94,  hr:82, fasting:162, ldl:148, creatinine:1.3,
    smoking:'Former',  adherence:'Moderate', mobility:'Independent', cognitive:'Mild Impairment',
    meds:['Metformin','Amlodipine','Lisinopril','Atorvastatin','Aspirin'],
    falls:'1–2 falls', status:'Urgent',   date:'2025-07-14',
  },
  {
    id:'PT-B2D4E8', name:'Amina Bello',        age:68, gender:'F', weight:65,  height:158,
    hba1c:7.2, sbp:138, dbp:85,  hr:74, fasting:128, ldl:110, creatinine:0.9,
    smoking:'Never',   adherence:'Good',     mobility:'Independent', cognitive:'Normal',
    meds:['Metformin','Ramipril'],
    falls:'None',      status:'Reviewed', date:'2025-07-12',
  },
  {
    id:'PT-C3F5G1', name:'Emmanuel Adeyemi',   age:81, gender:'M', weight:70,  height:165,
    hba1c:9.1, sbp:172, dbp:98,  hr:90, fasting:188, ldl:162, creatinine:1.6,
    smoking:'Current', adherence:'Poor',     mobility:'Assisted',    cognitive:'Moderate Impairment',
    meds:['Insulin glargine','Amlodipine','Furosemide','Warfarin','Allopurinol','Omeprazole'],
    falls:'3+ falls',  status:'Urgent',   date:'2025-07-15',
  },
  {
    id:'PT-D4H6I3', name:'Grace Nwosu',         age:63, gender:'F', weight:78,  height:162,
    hba1c:7.8, sbp:145, dbp:88,  hr:76, fasting:142, ldl:128, creatinine:1.0,
    smoking:'Never',   adherence:'Good',     mobility:'Independent', cognitive:'Normal',
    meds:['Metformin','Lisinopril','Atorvastatin'],
    falls:'None',      status:'Pending',  date:'2025-07-10',
  },
  {
    id:'PT-E5J7K2', name:'Ibrahim Musa',         age:77, gender:'M', weight:88,  height:172,
    hba1c:8.3, sbp:162, dbp:96,  hr:84, fasting:174, ldl:155, creatinine:1.4,
    smoking:'Former',  adherence:'Moderate', mobility:'Independent', cognitive:'Mild Impairment',
    meds:['Glipizide','Losartan','Atorvastatin','Aspirin','Bisoprolol'],
    falls:'1–2 falls', status:'Pending',  date:'2025-07-13',
  },
  {
    id:'PT-F6L8M4', name:'Fatima Abdullahi',     age:70, gender:'F', weight:60,  height:155,
    hba1c:7.5, sbp:132, dbp:82,  hr:70, fasting:132, ldl:105, creatinine:0.8,
    smoking:'Never',   adherence:'Good',     mobility:'Independent', cognitive:'Normal',
    meds:['Metformin','Amlodipine'],
    falls:'None',      status:'Reviewed', date:'2025-07-08',
  },
  {
    id:'PT-G7N9O5', name:'Sunday Eze',           age:85, gender:'M', weight:67,  height:168,
    hba1c:9.4, sbp:178, dbp:102, hr:92, fasting:204, ldl:170, creatinine:1.8,
    smoking:'Former',  adherence:'Poor',     mobility:'Wheelchair',  cognitive:'Severe',
    meds:['Insulin lispro','Insulin glargine','Furosemide','Digoxin','Warfarin','Allopurinol','Omeprazole'],
    falls:'3+ falls',  status:'Urgent',   date:'2025-07-15',
  },
  {
    id:'PT-H8P0Q6', name:'Chidinma Obi',         age:65, gender:'F', weight:72,  height:160,
    hba1c:7.4, sbp:136, dbp:84,  hr:72, fasting:126, ldl:118, creatinine:0.9,
    smoking:'Never',   adherence:'Good',     mobility:'Independent', cognitive:'Normal',
    meds:['Metformin','Losartan'],
    falls:'None',      status:'Reviewed', date:'2025-07-09',
  },
  {
    id:'PT-I9R1S7', name:'Tunde Fashola',         age:73, gender:'M', weight:84,  height:174,
    hba1c:8.0, sbp:155, dbp:92,  hr:80, fasting:158, ldl:140, creatinine:1.2,
    smoking:'Former',  adherence:'Moderate', mobility:'Independent', cognitive:'Mild Impairment',
    meds:['Metformin','Glibenclamide','Atorvastatin','Aspirin'],
    falls:'1–2 falls', status:'Pending',  date:'2025-07-11',
  },
  {
    id:'PT-J0T2U8', name:'Ngozi Ikenna',          age:67, gender:'F', weight:68,  height:157,
    hba1c:7.6, sbp:140, dbp:86,  hr:75, fasting:136, ldl:122, creatinine:1.0,
    smoking:'Never',   adherence:'Good',     mobility:'Independent', cognitive:'Normal',
    meds:['Metformin','Ramipril','Atorvastatin'],
    falls:'None',      status:'Reviewed', date:'2025-07-07',
  },
  {
    id:'PT-K1V3W9', name:'Clement Okonkwo',       age:79, gender:'M', weight:76,  height:169,
    hba1c:8.8, sbp:166, dbp:97,  hr:86, fasting:180, ldl:158, creatinine:1.5,
    smoking:'Current', adherence:'Poor',     mobility:'Assisted',    cognitive:'Moderate Impairment',
    meds:['Insulin glargine','Amlodipine','Furosemide','Atorvastatin','Aspirin','Omeprazole'],
    falls:'3+ falls',  status:'Urgent',   date:'2025-07-14',
  },
  {
    id:'PT-L2X4Y0', name:'Blessing Chukwu',       age:62, gender:'F', weight:74,  height:163,
    hba1c:7.3, sbp:134, dbp:83,  hr:71, fasting:124, ldl:112, creatinine:0.8,
    smoking:'Never',   adherence:'Good',     mobility:'Independent', cognitive:'Normal',
    meds:['Metformin','Amlodipine'],
    falls:'None',      status:'Reviewed', date:'2025-07-06',
  },
  {
    id:'PT-M3Z5A1', name:'Yusuf Garba',            age:76, gender:'M', weight:80,  height:171,
    hba1c:8.5, sbp:160, dbp:95,  hr:83, fasting:170, ldl:148, creatinine:1.3,
    smoking:'Former',  adherence:'Moderate', mobility:'Independent', cognitive:'Mild Impairment',
    meds:['Glipizide','Losartan','Aspirin','Bisoprolol','Atorvastatin'],
    falls:'1–2 falls', status:'Pending',  date:'2025-07-12',
  },
  {
    id:'PT-N4B6C2', name:'Adaeze Okafor',          age:69, gender:'F', weight:66,  height:159,
    hba1c:7.7, sbp:142, dbp:87,  hr:73, fasting:138, ldl:120, creatinine:0.9,
    smoking:'Never',   adherence:'Good',     mobility:'Independent', cognitive:'Normal',
    meds:['Metformin','Lisinopril'],
    falls:'None',      status:'Reviewed', date:'2025-07-05',
  },
  {
    id:'PT-O5D7E3', name:'Haruna Suleiman',         age:82, gender:'M', weight:73,  height:167,
    hba1c:9.2, sbp:174, dbp:100, hr:89, fasting:196, ldl:165, creatinine:1.7,
    smoking:'Former',  adherence:'Poor',     mobility:'Wheelchair',  cognitive:'Severe',
    meds:['Insulin glargine','Insulin lispro','Furosemide','Warfarin','Digoxin','Allopurinol','Omeprazole'],
    falls:'3+ falls',  status:'Urgent',   date:'2025-07-15',
  },
];

/* ============================================================
   computeRisks(patient)
   Returns { hypoglycemia, cardiovascular, bloodpressure, polypharmacy }
   All scores 0–100.

   Uses deterministic pseudo-random seeded on patient data so the
   same patient always gets the same scores on every page.
============================================================ */
function computeRisks(p) {
  const seed = p.name.length + p.age + Math.round(p.hba1c * 10);
  const rng  = (min, max, o) =>
    min + (((seed + o) * 9301 + 49297) % 233280) / 233280 * (max - min);

  return {
    hypoglycemia:   Math.min(95, Math.round(20 + (p.hba1c - 6) * 8   + rng(0, 15, 1))),
    cardiovascular: Math.min(95, Math.round(15 + (p.sbp - 120) * 0.4 + (p.age - 60) * 0.5 + rng(0, 12, 2))),
    bloodpressure:  Math.min(95, Math.round(20 + (p.sbp - 120) * 0.5 + rng(0, 18, 3))),
    polypharmacy:   Math.min(95, Math.round(10 + p.meds.length * 6   + rng(0, 14, 4))),
  };
}

/* ============================================================
   overallRisk(risks)
   Returns 'high' | 'medium' | 'low' based on average score
============================================================ */
function overallRisk(risks) {
  const avg = Math.round(
    Object.values(risks).reduce((a, b) => a + b, 0) / Object.values(risks).length
  );
  if (avg >= 65) return 'high';
  if (avg >= 40) return 'medium';
  return 'low';
}
