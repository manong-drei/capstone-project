import { useEffect } from 'react';
import { subscribeToDataChanges } from '@/services/dataSync';

// Supply a useCallback loader so renders do not restart its request lifecycle.
export default function useLiveData(load, enabled = true, refreshKey = 0) {
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let running = false;
    let pending = false;
    let background = false;
    const refresh = async (reason) => {
      if (controller.signal.aborted) return;
      if (running) {
        if (reason !== 'poll') pending = true;
        return;
      }
      running = true;
      try {
        await load(controller.signal, background);
      } catch (error) {
        if (!controller.signal.aborted) console.error('Data refresh failed.', error);
      } finally {
        running = false;
        background = true;
        if (pending && !controller.signal.aborted) {
          pending = false;
          void refresh('change');
        }
      }
    };
    const unsubscribe = subscribeToDataChanges(refresh);
    void refresh('initial');
    return () => { controller.abort(); unsubscribe(); };
  }, [load, enabled, refreshKey]);
}
