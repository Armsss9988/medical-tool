import { createContext, useContext, type ReactNode } from 'react';
import { useTemplateManagerInternal, type TemplateManagerReturn } from '../features/template-builder/hooks/useTemplateManager';

export const TemplateContext = createContext<TemplateManagerReturn | null>(null);

export function TemplateProvider({ children }: { children: ReactNode }) {
  const templateManager = useTemplateManagerInternal();
  return (
    <TemplateContext.Provider value={templateManager}>
      {children}
    </TemplateContext.Provider>
  );
}

export function useTemplateContext(): TemplateManagerReturn {
  const ctx = useContext(TemplateContext);
  if (!ctx) {
    throw new Error('useTemplateContext must be used within a TemplateProvider');
  }
  return ctx;
}
