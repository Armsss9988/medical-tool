// ─── FEATURE SLICE: CLINIC SETTINGS & SECURITY ─────────────────────────────
// Manages clinic profile, database sync configurations, security passkey, and exit guards.

export { default as SettingsModal } from './components/SettingsModal';
export { default as PasswordGateModal, openPasswordGate, closePasswordGate } from './components/PasswordGateModal';
export { default as UnsavedChangesModal } from './components/UnsavedChangesModal';
export { default as TransactionLoadingModal } from './components/TransactionLoadingModal';
export { default as AdminPasskeyScreen } from './components/AdminPasskeyScreen';
