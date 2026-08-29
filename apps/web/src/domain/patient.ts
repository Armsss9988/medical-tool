import { PatientCode } from './valueObjects/PatientCode';
import { SecretToken } from './valueObjects/SecretToken';

// ─── BACKWARD COMPATIBILITY WRAPPERS ────────────────────────────────────────
// These functions delegate to Value Objects (PatientCode, SecretToken).
// DEPRECATED: New code should use PatientCode.create() and SecretToken.create() directly.

/** @deprecated Use PatientCode.create() or PatientCode.generateNextCode() instead */
export function generatePatientCode(): string {
  return PatientCode.create().value;
}

/** @deprecated Use SecretToken.create() instead */
export function generateSecretToken(): string {
  return SecretToken.create().value;
}
