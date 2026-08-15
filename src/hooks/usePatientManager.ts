import { useState } from "react";
import { Patient } from "@domain/types";
import { PatientCode } from "@domain/valueObjects/PatientCode";
import { SecretToken } from "@domain/valueObjects/SecretToken";

function generateInitialPatient(): Patient {
  return {
    code: PatientCode.create().value,
    secretToken: SecretToken.create().value,
    name: "",
    dob: "",
    gender: "Nam",
    phone: "",
    address: "",
    diagnosis: ""
  };
}

export function usePatientManager() {
  const [patient, setPatient] = useState<Patient>(generateInitialPatient);

  const resetPatient = () => {
    setPatient(generateInitialPatient());
  };

  const setPatientField = <K extends keyof Patient>(field: K, value: Patient[K]) => {
    setPatient((prev) => ({ ...prev, [field]: value }));
  };

  return {
    patient,
    setPatient,
    resetPatient,
    setPatientField
  };
}
