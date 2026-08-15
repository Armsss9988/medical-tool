export function generatePatientCode(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `XN-${dateStr}-${randomNum}`;
}

export function generateSecretToken(): string {
  return Math.random().toString(36).substring(2, 10);
}
