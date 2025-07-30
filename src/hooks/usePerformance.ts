
import { useEffect, useRef } from 'react';

interface PerformanceOptions {
  logRenders?: boolean;
  logMountTime?: boolean;
  componentName?: string;
}

export const usePerformance = (options: PerformanceOptions = {}) => {
  const { logRenders = false, logMountTime = false, componentName = 'Component' } = options;
  const renderCount = useRef(0);
  const mountTime = useRef<number>();

  useEffect(() => {
    if (logMountTime) {
      mountTime.current = performance.now();
      return () => {
        if (mountTime.current) {
          const duration = performance.now() - mountTime.current;
          console.log(`${componentName} was mounted for ${duration.toFixed(2)}ms`);
        }
      };
    }
  }, [logMountTime, componentName]);

  if (logRenders) {
    renderCount.current += 1;
    console.log(`${componentName} rendered ${renderCount.current} times`);
  }

  const measureFunction = (fn: Function, label: string) => {
    return (...args: any[]) => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();
      console.log(`${label} took ${(end - start).toFixed(2)}ms`);
      return result;
    };
  };

  return { measureFunction };
};
