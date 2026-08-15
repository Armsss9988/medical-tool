import { useState } from 'react';
import { Patient } from '../domain/types';
import { PatientCode } from '../domain/valueObjects/PatientCode';
import { SecretToken } from '../domain/valueObjects/SecretToken';

export function getTodayFormattedStr(): string {
  return new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function generateRandomSampleCode(): string {
  return String(Math.floor(10000 + Math.random() * 90000));
}

export function createDefaultPatient(): Patient {
  const today = getTodayFormattedStr();
  return {
    code: PatientCode.create().value,
    secretToken: SecretToken.create().value,
    name: '',
    dob: '',
    gender: 'Nam',
    phone: '',
    address: '',
    diagnosis: '',
    sampleCode: generateRandomSampleCode(),
    sampleStatus: 'Đạt',
    orderedAt: today,
    paidAt: today,
    receivedAt: today,
    returnedAt: today
  };
}

export function usePatientManager() {
  const [patient, setPatient] = useState<Patient>(createDefaultPatient);

  const updatePatientField = <K extends keyof Patient>(field: K, value: Patient[K]) => {
    setPatient((prev) => ({ ...prev, [field]: value }));
  };

  const resetPatient = () => {
    setPatient(createDefaultPatient());
  };

  return {
    patient,
    setPatient,
    updatePatientField,
    resetPatient
  };
}
