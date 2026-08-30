import { useEffect } from 'react';

export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  disableInModal?: boolean;
  disableInInput?: boolean;
}

export function useKeyboardShortcuts(
  shortcuts: ShortcutConfig[],
  isModalOpen: boolean = false
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if target is an input or textarea
      const target = e.target as HTMLElement;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      for (const sc of shortcuts) {
        const keyMatch = e.key.toLowerCase() === sc.key.toLowerCase();
        const ctrlMatch = sc.ctrl === undefined || e.ctrlKey === sc.ctrl || e.metaKey === sc.ctrl;
        const shiftMatch = sc.shift === undefined || e.shiftKey === sc.shift;
        const altMatch = sc.alt === undefined || e.altKey === sc.alt;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          if (sc.disableInModal && isModalOpen) continue;
          if (sc.disableInInput && isInput) continue;

          e.preventDefault();
          sc.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, isModalOpen]);
}
