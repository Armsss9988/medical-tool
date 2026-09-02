// ─── FEATURE SLICE: PATIENT SESSION ────────────────────────────────────────
// Manages patient demographic intake, code generation, and doctor assignment.

export { default as PatientForm } from './components/PatientForm';
export { default as DoctorSelectCombobox } from './components/DoctorSelectCombobox';
export { usePatientManager, createDefaultPatient } from './hooks/usePatientManager';
