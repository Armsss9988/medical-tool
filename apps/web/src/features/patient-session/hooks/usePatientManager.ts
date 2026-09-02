import { useState } from 'react';
import { Patient } from '@domain/types';
import { PatientCode } from '@domain/valueObjects/PatientCode';
import { SecretToken } from '@domain/valueObjects/SecretToken';

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

export function createDefaultPatient(customCode?: string): Patient {
  const today = getTodayFormattedStr();
  const sampleCodeVal = generateRandomSampleCode();
  const ticketCode = customCode || PatientCode.create().value || sampleCodeVal;

  return {
    code: ticketCode,
    secretToken: SecretToken.create().value,
    name: '',
    dob: '',
    gender: 'Nam',
    phone: '',
    address: '',
    diagnosis: '',
    sampleCode: ticketCode,
    sampleStatus: 'Đạt',
    orderedAt: today,
    paidAt: undefined,
    receivedAt: today,
    returnedAt: today
  };
}

export function usePatientManager() {
  const [patient, setPatient] = useState<Patient>(() => createDefaultPatient());

  const updatePatientField = <K extends keyof Patient>(field: K, value: Patient[K]) => {
    setPatient((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'code') {
        updated.sampleCode = value as string;
      } else if (field === 'sampleCode') {
        updated.code = value as string;
      }
      return updated;
    });
  };

  const resetPatient = (customCode?: string) => {
    setPatient(createDefaultPatient(customCode));
  };

  return {
    patient,
    setPatient,
    updatePatientField,
    resetPatient
  };
}
