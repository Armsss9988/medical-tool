import { create } from 'zustand';
import type { SelectedTest } from '@domain/types';

type Updater<T> = T | ((prev: T) => T);

function resolveUpdater<T>(updater: Updater<T>, prev: T): T {
  return typeof updater === 'function' ? (updater as (prev: T) => T)(prev) : updater;
}

export interface WorkspaceStoreState {
  selectedTests: SelectedTest[];
  conclusion: string;
  doctorName: string;
  currentReportId: string | null;
  autoFocusName: boolean;

  setSelectedTests: (updater: Updater<SelectedTest[]>) => void;
  setConclusion: (updater: Updater<string>) => void;
  setDoctorName: (updater: Updater<string>) => void;
  setCurrentReportId: (updater: Updater<string | null>) => void;
  setAutoFocusName: (updater: Updater<boolean>) => void;
  resetWorkspaceForm: () => void;
}

export const useWorkspaceStore = create<WorkspaceStoreState>((set) => ({
  selectedTests: [],
  conclusion: '',
  doctorName: '',
  currentReportId: null,
  autoFocusName: true,

  setSelectedTests: (updater) =>
    set((state) => ({ selectedTests: resolveUpdater(updater, state.selectedTests) })),

  setConclusion: (updater) =>
    set((state) => ({ conclusion: resolveUpdater(updater, state.conclusion) })),

  setDoctorName: (updater) =>
    set((state) => ({ doctorName: resolveUpdater(updater, state.doctorName) })),

  setCurrentReportId: (updater) =>
    set((state) => ({ currentReportId: resolveUpdater(updater, state.currentReportId) })),

  setAutoFocusName: (updater) =>
    set((state) => ({ autoFocusName: resolveUpdater(updater, state.autoFocusName) })),

  resetWorkspaceForm: () =>
    set({
      selectedTests: [],
      conclusion: '',
      doctorName: '',
      currentReportId: null
    })
}));
