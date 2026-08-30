import { useEffect, useCallback } from 'react';

export interface ShortcutEntry {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  /** If true, shortcut is disabled when any modal is open */
  disableInModal?: boolean;
}

/**
 * Global keyboard shortcuts hook.
 * Registers shortcuts on document and auto-prevents default browser behavior.
 * 
 * @param shortcuts - Array of shortcut definitions
 * @param isAnyModalOpen - If true, shortcuts with disableInModal=true won't fire
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutEntry[] = [],
  isAnyModalOpen: boolean = false
) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!e || typeof e.key !== 'string' || !Array.isArray(shortcuts)) return;

      const eventKey = e.key.toLowerCase();
      // Don't fire shortcuts when typing in inputs/textareas (except Esc, Ctrl+combos)
      const target = e.target as HTMLElement | null;
      const isTextInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      for (const shortcut of shortcuts) {
        if (!shortcut || typeof shortcut.key !== 'string') continue;
        const shortcutKey = shortcut.key.toLowerCase();
        const keyMatch = eventKey === shortcutKey;
        const ctrlMatch = !!shortcut.ctrl === (e.ctrlKey || e.metaKey);
        const shiftMatch = !!shortcut.shift === e.shiftKey;
        const altMatch = !!shortcut.alt === e.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          // Skip if modal-only shortcut and modal is open
          if (shortcut.disableInModal && isAnyModalOpen) continue;

          // For Esc key, always allow
          // For Ctrl+combos, always allow (power-user shortcuts)
          // For plain keys, skip if in text input
          if (!shortcut.ctrl && !shortcut.alt && shortcutKey !== 'escape' && isTextInput) {
            continue;
          }

          e.preventDefault();
          e.stopPropagation();
          shortcut.action?.();
          return;
        }
      }
    },
    [shortcuts, isAnyModalOpen]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);
}
