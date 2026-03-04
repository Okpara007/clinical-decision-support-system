/* ============================================================
   HALO FRONTEND — APP CONFIG
   assets/js/config.js

   Contains:
   - App-wide constants
   - Guideline citation database
   - Recommendation templates
   - Form section & question definitions (used by patient entry)
   - Risk card definitions (used by dashboard)
============================================================ */

/* ============================================================
   APP CONSTANTS
============================================================ */
const APP = {
  name:    'HALO',
  version: '1.0.0',
  year:    '2025',

  /* Page routes */
  routes: {
    login:           '/',
    records:         '/records/',
    patientEntry:    '/patient-entry/',
    dashboard:       '/dashboard/',
    recommendations: '/recommendations/',
  },

  /* Session storage keys */
  storage: {
    patient: 'halo_patient',
  },

  api: {
    patientRecords: '/patient/api/records/',
    recommendations: '/dashboard/api/recommendations/',
  },
};

/* ============================================================
   GUIDELINE CITATION DATABASE
   Used by: recommendations.html
============================================================ */
const CITATIONS = {
  'ADA-2024-S9': {
    title: 'ADA Standards of Care 2024 — Section 9',
    body:  'For older adults with type 2 diabetes, <strong>less stringent HbA1c targets (7.5–8.5%)</strong> may be appropriate in patients with limited life expectancy, hypoglycemia unawareness, or significant comorbidities. Metformin remains the preferred first-line agent unless contraindicated.',
    source:'American Diabetes Association. Standards of Medical Care in Diabetes, 2024. Diabetes Care 47(Suppl 1):S1–S321.',
  },
  'ADA-2024-S10': {
    title: 'ADA Standards of Care 2024 — Section 10',
    body:  'In patients with type 2 diabetes and established or high cardiovascular risk, <strong>GLP-1 receptor agonists or SGLT2 inhibitors with proven cardiovascular benefit</strong> are recommended as part of the glucose-lowering regimen, independent of HbA1c.',
    source:'American Diabetes Association. Standards of Medical Care in Diabetes, 2024. Section 10: Cardiovascular Disease and Risk Management.',
  },
  'ESC-2021-HT': {
    title: 'ESC/ESH Guidelines 2021 — Hypertension',
    body:  'Blood pressure target for adults aged ≥65 years is <strong>systolic 130–139 mmHg</strong>, if tolerated. In frail elderly patients, a less stringent target (systolic <150 mmHg) may be acceptable. ACE inhibitors or ARBs are recommended as first-line in patients with diabetes.',
    source:'Williams B, et al. ESC/ESH Guidelines for the Management of Arterial Hypertension. Eur Heart J. 2021;39(33):3021–3104.',
  },
  'ESC-2021-CVD': {
    title: 'ESC Guidelines 2021 — Cardiovascular Prevention',
    body:  'For patients with diabetes and high/very high cardiovascular risk, <strong>LDL-C targets below 1.4 mmol/L (55 mg/dL)</strong> are recommended. High-intensity statin therapy should be initiated.',
    source:'Visseren FLJ, et al. ESC Guidelines on Cardiovascular Disease Prevention. Eur Heart J. 2021;42(34):3227–3337.',
  },
  'JNC-8-BP': {
    title: 'JNC 8 — Blood Pressure Management',
    body:  'In patients aged ≥60 years, pharmacologic treatment is recommended when systolic BP ≥150 mmHg or diastolic BP ≥90 mmHg. <strong>Thiazide diuretics, CCBs, ACEi, or ARBs</strong> are all acceptable first-line agents.',
    source:'James PA, et al. 2014 Evidence-Based Guideline for the Management of High Blood Pressure in Adults (JNC 8). JAMA. 2014;311(5):507–520.',
  },
  'STOPP-2015': {
    title: 'STOPP/START Criteria v2 — Polypharmacy in Elderly',
    body:  'STOPP criteria identify <strong>potentially inappropriate prescribing in adults ≥65 years</strong>. Key concerns include anticholinergics, benzodiazepines, NSAIDs, and drugs increasing fall risk.',
    source:'O\'Mahony D, et al. STOPP/START Criteria for Potentially Inappropriate Prescribing in Older People. Age and Ageing. 2015;44(2):213–218.',
  },
};

/* ============================================================
   RECOMMENDATION TEMPLATES
   Used by: recommendations.html
============================================================ */
const REC_TEMPLATES = [
  {
    id: 'glycemic',
    icon: '🩸',
    title: 'Glycemic Management',
    subtitle: 'Type 2 Diabetes · Individualised HbA1c Target',
    priority: 'URGENT',
    priorityColor:  'var(--risk-high)',
    priorityBg:     'var(--risk-high-bg)',
    priorityBorder: 'var(--risk-high-border)',
    iconBg: 'rgba(239,68,68,0.12)',
    citations: ['ADA-2024-S9', 'ADA-2024-S10'],
    actions: [
      { num:'01', text:'<strong>HbA1c target: 7.5–8.0%</strong> — Given the patient\'s age and comorbid conditions, a less stringent target reduces hypoglycemia risk while maintaining metabolic benefit.' },
      { num:'02', text:'<strong>Review Metformin dose</strong> — Assess eGFR before continuing or adjusting dosage. If eGFR &lt;30, discontinue Metformin per ADA 2024 guidance.' },
      { num:'03', text:'<strong>Consider GLP-1 agonist or SGLT2 inhibitor</strong> — If cardiovascular risk is elevated, agents with proven CV benefit (e.g. empagliflozin, liraglutide) should be prioritised.' },
      { num:'04', text:'<strong>Monitor fasting glucose 2–3× per week</strong> — Structured self-monitoring with target fasting glucose 80–130 mg/dL.' },
    ],
  },
  {
    id: 'hypertension',
    icon: '🫀',
    title: 'Blood Pressure Control',
    subtitle: 'Hypertension · Renal-Safe Regimen',
    priority: 'HIGH',
    priorityColor:  'var(--risk-med)',
    priorityBg:     'var(--risk-med-bg)',
    priorityBorder: 'var(--risk-med-border)',
    iconBg: 'rgba(245,158,11,0.12)',
    citations: ['ESC-2021-HT', 'JNC-8-BP'],
    actions: [
      { num:'01', text:'<strong>Target systolic BP: 130–140 mmHg</strong> — Aggressive lowering below 120 mmHg may increase fall and syncope risk in elderly patients.' },
      { num:'02', text:'<strong>Optimise ACE inhibitor / ARB</strong> — First-line therapy for hypertension with diabetes. Monitor creatinine and potassium within 2 weeks.' },
      { num:'03', text:'<strong>Add calcium channel blocker if dual therapy needed</strong> — Amlodipine 5–10 mg is well-tolerated and reduces cardiovascular events.' },
      { num:'04', text:'<strong>Lifestyle modifications</strong> — Sodium restriction (&lt;2g/day), regular aerobic activity (as tolerated), and weight management.' },
    ],
  },
  {
    id: 'cardiovascular',
    icon: '❤️',
    title: 'Cardiovascular Protection',
    subtitle: 'CVD Risk Reduction · Lipid & Antiplatelet',
    priority: 'MODERATE',
    priorityColor:  'var(--accent-light)',
    priorityBg:     'rgba(45,125,210,0.08)',
    priorityBorder: 'rgba(45,125,210,0.3)',
    iconBg: 'rgba(45,125,210,0.1)',
    citations: ['ESC-2021-CVD', 'ADA-2024-S10'],
    actions: [
      { num:'01', text:'<strong>Statin therapy — high intensity</strong> — Target LDL-C &lt;70 mg/dL. Atorvastatin 40–80 mg or rosuvastatin 20–40 mg recommended.' },
      { num:'02', text:'<strong>Antiplatelet therapy review</strong> — Aspirin 75–100 mg for secondary prevention only. Assess bleeding risk vs benefit carefully.' },
      { num:'03', text:'<strong>Annual cardiovascular risk reassessment</strong> — Use validated scoring tool (SCORE2-OP) to guide intensity of intervention.' },
      { num:'04', text:'<strong>Smoking cessation support</strong> — Refer to structured cessation programme and consider pharmacotherapy if applicable.' },
    ],
  },
  {
    id: 'polypharmacy',
    icon: '💊',
    title: 'Medication Review',
    subtitle: 'Polypharmacy · Drug Safety · Deprescribing',
    priority: 'REVIEW',
    priorityColor:  'var(--risk-low)',
    priorityBg:     'var(--risk-low-bg)',
    priorityBorder: 'var(--risk-low-border)',
    iconBg: 'rgba(16,185,129,0.1)',
    citations: ['STOPP-2015'],
    actions: [
      { num:'01', text:'<strong>Apply STOPP/START criteria</strong> — Conduct a structured medication review to identify potentially inappropriate prescribing.' },
      { num:'02', text:'<strong>Deprescribing candidates</strong> — Review necessity of all medications. Consider discontinuing drugs with no clear indication or high interaction potential.' },
      { num:'03', text:'<strong>Medication reconciliation</strong> — Verify actual medication use vs prescription. Assess adherence and address barriers.' },
      { num:'04', text:'<strong>Simplify regimen where possible</strong> — Consider fixed-dose combinations to reduce pill burden and support adherence.' },
    ],
  },
];

/* ============================================================
   PATIENT ENTRY — Form Sections & Question Flow
   Used by: patient-entry.html
============================================================ */
const FORM_SECTIONS = [
  {
    id: 'demographics',
    label: 'Demographics',
    icon: '👤',
    fields: [
      { id:'fullName',      label:'Full Name',          required:true,  span:2 },
      { id:'age',           label:'Age (years)',         required:true  },
      { id:'gender',        label:'Gender',              required:true  },
      { id:'weight',        label:'Weight (kg)',         required:true  },
      { id:'height',        label:'Height (cm)',         required:true  },
      { id:'ethnicity',     label:'Ethnicity',           required:false },
      { id:'smokingStatus', label:'Smoking Status',      required:false },
    ],
  },
  {
    id: 'vitals',
    label: 'Vital Signs',
    icon: '💓',
    fields: [
      { id:'systolicBP',      label:'Systolic BP (mmHg)',      required:true  },
      { id:'diastolicBP',     label:'Diastolic BP (mmHg)',     required:true  },
      { id:'heartRate',       label:'Heart Rate (bpm)',         required:true  },
      { id:'temperature',     label:'Temperature (°C)',         required:false },
      { id:'oxygenSat',       label:'O₂ Saturation (%)',       required:false },
      { id:'respiratoryRate', label:'Respiratory Rate (/min)', required:false },
    ],
  },
  {
    id: 'labs',
    label: 'Lab Results',
    icon: '🧪',
    fields: [
      { id:'hba1c',            label:'HbA1c (%)',               required:true  },
      { id:'fastingGlucose',   label:'Fasting Glucose (mg/dL)', required:true  },
      { id:'totalCholesterol', label:'Total Cholesterol (mg/dL)',required:false },
      { id:'hdl',              label:'HDL (mg/dL)',              required:false },
      { id:'ldl',              label:'LDL (mg/dL)',              required:false },
      { id:'triglycerides',    label:'Triglycerides (mg/dL)',   required:false },
      { id:'creatinine',       label:'Creatinine (mg/dL)',      required:false },
      { id:'egfr',             label:'eGFR (mL/min)',           required:false },
    ],
  },
  {
    id: 'medications',
    label: 'Medications',
    icon: '💊',
    fields: [
      { id:'currentMeds',     label:'Current Medications',        required:false, type:'tags', span:2 },
      { id:'allergies',       label:'Known Allergies',             required:false, span:2 },
      { id:'medicationCount', label:'Total Medication Count',     required:false },
      { id:'adherence',       label:'Adherence Level',             required:false },
    ],
  },
  {
    id: 'functional',
    label: 'Functional Status',
    icon: '🧠',
    fields: [
      { id:'mobilityStatus',     label:'Mobility Status',      required:false },
      { id:'cognitiveStatus',    label:'Cognitive Status',     required:false },
      { id:'adlScore',           label:'ADL Score (0–6)',      required:false },
      { id:'fallHistory',        label:'Fall History',          required:false },
      { id:'socialSupport',      label:'Social Support',        required:false },
      { id:'livingArrangement',  label:'Living Arrangement',    required:false },
    ],
  },
];

const CHAT_QUESTIONS = [
  { id:'q_name',       fieldId:'fullName',        inputType:'text',   placeholder:'e.g. John Adeyemi',
    message:"Hello! I'm the HALO Clinical Assistant. Let's start — what is the patient's **full name**?" },
  { id:'q_age',        fieldId:'age',             inputType:'number', placeholder:'e.g. 72',
    message:"What is the patient's **age** in years? (Must be ≥60)",
    validate: v => parseInt(v) >= 60 || 'HALO is designed for patients aged 60 and above.' },
  { id:'q_gender',     fieldId:'gender',          inputType:'quick',  options:['Male','Female','Other'],
    message:"What is the patient's **gender**?" },
  { id:'q_weight',     fieldId:'weight',          inputType:'number', placeholder:'e.g. 78',
    message:"What is the patient's **weight** in kilograms?" },
  { id:'q_height',     fieldId:'height',          inputType:'number', placeholder:'e.g. 168',
    message:"And their **height** in centimeters?" },
  { id:'q_smoking',    fieldId:'smokingStatus',   inputType:'quick',  options:['Never','Former','Current'],
    message:"What is the patient's **smoking status**?" },
  { id:'q_sbp',        fieldId:'systolicBP',      inputType:'number', placeholder:'e.g. 145',
    message:"Now **vital signs**. What is the **systolic blood pressure** (mmHg)?" },
  { id:'q_dbp',        fieldId:'diastolicBP',     inputType:'number', placeholder:'e.g. 90',
    message:"And the **diastolic blood pressure** (mmHg)?" },
  { id:'q_hr',         fieldId:'heartRate',       inputType:'number', placeholder:'e.g. 78',
    message:"What is the **heart rate** (beats per minute)?" },
  { id:'q_o2',         fieldId:'oxygenSat',       inputType:'text',   placeholder:'e.g. 97 or skip',
    message:"What is the **oxygen saturation** (%)? Type 'skip' if unavailable." },
  { id:'q_hba1c',      fieldId:'hba1c',           inputType:'number', placeholder:'e.g. 8.2',
    message:"Now **lab results**. What is the **HbA1c** level (%)?" },
  { id:'q_glucose',    fieldId:'fastingGlucose',  inputType:'number', placeholder:'e.g. 145',
    message:"What is the **fasting glucose** (mg/dL)?" },
  { id:'q_chol',       fieldId:'totalCholesterol',inputType:'text',   placeholder:'e.g. 210 or skip',
    message:"What is the **total cholesterol** (mg/dL)? Type 'skip' if unavailable." },
  { id:'q_ldl',        fieldId:'ldl',             inputType:'text',   placeholder:'e.g. 130 or skip',
    message:"What is the **LDL cholesterol** (mg/dL)? Type 'skip' if unavailable." },
  { id:'q_creatinine', fieldId:'creatinine',      inputType:'text',   placeholder:'e.g. 1.1 or skip',
    message:"What is the **creatinine** level (mg/dL)? Type 'skip' if unavailable." },
  { id:'q_meds',       fieldId:'currentMeds',     inputType:'tags',   placeholder:'e.g. Metformin 500mg',
    message:"Now **medications**. List current medications one at a time. Type **'done'** when finished." },
  { id:'q_allergies',  fieldId:'allergies',       inputType:'text',   placeholder:'e.g. Penicillin or none',
    message:"Any known **drug allergies**? Type 'none' if not applicable." },
  { id:'q_adherence',  fieldId:'adherence',       inputType:'quick',  options:['Good','Moderate','Poor'],
    message:"How would you rate the patient's **medication adherence**?" },
  { id:'q_mobility',   fieldId:'mobilityStatus',  inputType:'quick',  options:['Independent','Assisted','Wheelchair','Bed-bound'],
    message:"Finally, **functional status**. What is the patient's **mobility status**?" },
  { id:'q_cognitive',  fieldId:'cognitiveStatus', inputType:'quick',  options:['Normal','Mild Impairment','Moderate Impairment','Severe'],
    message:"What is the patient's **cognitive status**?" },
  { id:'q_falls',      fieldId:'fallHistory',     inputType:'quick',  options:['None','1–2 falls','3+ falls'],
    message:"Any **fall history** in the past 12 months?" },
  { id:'q_living',     fieldId:'livingArrangement',inputType:'quick', options:['Lives alone','With family','Care facility','Assisted living'],
    message:"What is the patient's **living arrangement**?" },
];

/* ============================================================
   DASHBOARD — Risk Card Definitions
   Used by: dashboard.html
============================================================ */
const RISK_CARDS = [
  {
    id: 'hypoglycemia',
    title: 'Hypoglycemia Risk',
    subtitle: 'Low blood glucose event probability',
    icon: '🩸',
    description: 'Elevated risk driven by HbA1c levels, current insulin therapy, and kidney function. Monitor glucose closely and consider dose adjustments.',
    shapFeatures: [
      { name:'HbA1c Level',    weight:0.92 },
      { name:'Insulin Use',    weight:0.78 },
      { name:'eGFR',           weight:0.61 },
      { name:'Meal Regularity',weight:0.44 },
      { name:'Age',            weight:0.37 },
    ],
  },
  {
    id: 'cardiovascular',
    title: 'Cardiovascular Risk',
    subtitle: '10-year major cardiac event likelihood',
    icon: '❤️',
    description: 'Risk is influenced by blood pressure, cholesterol profile, smoking history, and age. ESC guidelines recommend statin therapy and BP control below 130/80 mmHg.',
    shapFeatures: [
      { name:'Systolic BP',    weight:0.88 },
      { name:'LDL Cholesterol',weight:0.74 },
      { name:'Smoking History',weight:0.65 },
      { name:'Age',            weight:0.58 },
      { name:'Triglycerides',  weight:0.32 },
    ],
  },
  {
    id: 'bloodpressure',
    title: 'Uncontrolled BP Risk',
    subtitle: 'Probability of persistent hypertension',
    icon: '🫀',
    description: 'Medication adherence, sodium intake, and kidney function are the primary contributors. A structured review of antihypertensive regimen is recommended.',
    shapFeatures: [
      { name:'Med Adherence',  weight:0.85 },
      { name:'Baseline Systolic',weight:0.77 },
      { name:'Creatinine',     weight:0.55 },
      { name:'BMI',            weight:0.49 },
      { name:'Diastolic BP',   weight:0.41 },
    ],
  },
  {
    id: 'polypharmacy',
    title: 'Polypharmacy Risk',
    subtitle: 'Drug interaction & adverse event likelihood',
    icon: '💊',
    description: 'High medication count combined with renal impairment increases interaction risk. A medication review using STOPP/START criteria is recommended.',
    shapFeatures: [
      { name:'Medication Count',weight:0.91 },
      { name:'eGFR',            weight:0.69 },
      { name:'Adherence Level', weight:0.54 },
      { name:'Age',             weight:0.48 },
      { name:'Cognitive Status',weight:0.36 },
    ],
  },
];
