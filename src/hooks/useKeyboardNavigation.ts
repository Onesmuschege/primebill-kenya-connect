
import { useEffect, useCallback } from 'react';

interface KeyboardNavigationOptions {
  enableArrowKeys?: boolean;
  enableTabNavigation?: boolean;
  enableEscapeKey?: boolean;
  onEscape?: () => void;
  containerRef?: React.RefObject<HTMLElement>;
}

export const useKeyboardNavigation = (options: KeyboardNavigationOptions = {}) => {
  const {
    enableArrowKeys = false,
    enableTabNavigation = true,
    enableEscapeKey = false,
    onEscape,
    containerRef
  } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    const container = containerRef?.current || document;
    
    // Handle escape key
    if (enableEscapeKey && event.key === 'Escape') {
      event.preventDefault();
      onEscape?.();
      return;
    }

    // Handle arrow key navigation
    if (enableArrowKeys && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      
      const focusableElements = container.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      
      const focusableArray = Array.from(focusableElements) as HTMLElement[];
      const currentIndex = focusableArray.indexOf(target);
      
      if (currentIndex === -1) return;
      
      let nextIndex = currentIndex;
      
      switch (event.key) {
        case 'ArrowUp':
        case 'ArrowLeft':
          nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableArray.length - 1;
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          nextIndex = currentIndex < focusableArray.length - 1 ? currentIndex + 1 : 0;
          break;
      }
      
      focusableArray[nextIndex]?.focus();
    }

    // Handle tab navigation enhancements
    if (enableTabNavigation && event.key === 'Tab') {
      const focusableElements = container.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      
      // Trap focus within container if containerRef is provided
      if (containerRef?.current) {
        if (event.shiftKey && target === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        } else if (!event.shiftKey && target === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    }
  }, [enableArrowKeys, enableTabNavigation, enableEscapeKey, onEscape, containerRef]);

  useEffect(() => {
    const container = containerRef?.current || document;
    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, containerRef]);

  // Helper function to focus first element
  const focusFirst = useCallback(() => {
    const container = containerRef?.current || document;
    const firstFocusable = container.querySelector(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;
    
    firstFocusable?.focus();
  }, [containerRef]);

  // Helper function to focus last element
  const focusLast = useCallback(() => {
    const container = containerRef?.current || document;
    const focusableElements = container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    lastElement?.focus();
  }, [containerRef]);

  return {
    focusFirst,
    focusLast
  };
};

// Custom hook for managing focus restoration
export const useFocusRestore = () => {
  const previouslyFocusedElement = useCallback(() => {
    return document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback((element: HTMLElement | null) => {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  }, []);

  return {
    previouslyFocusedElement,
    restoreFocus
  };
};
