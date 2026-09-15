import type { ReactNode } from 'react';
import { useModalStore, type ModalState, type ModalActions } from '../stores/useModalStore';

// ─── MODAL CONTEXT (MIGRATED TO ZUSTAND STORE) ─────────────────────────────
// Now backed by Zustand `useModalStore` for zero prop-drilling & O(1) performance.
// Preserves complete backward compatibility for components calling `useModal()`.

export interface ModalContextValue extends ModalState, Omit<ModalActions, 'isAnyModalOpen'> {
  isAnyModalOpen: boolean;
}

export function useModal(): ModalContextValue {
  const store = useModalStore();
  return {
    ...store,
    isAnyModalOpen: store.isAnyModalOpen(),
  };
}

export function ModalProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
