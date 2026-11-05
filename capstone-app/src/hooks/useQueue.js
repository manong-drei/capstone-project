import { useState, useCallback } from "react";
import * as queueService from "@/services/queueService";

export function useQueue() {
  const [queue, setQueue] = useState(null);
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchMyQueue = useCallback(async (signal, background = false) => {
    if (!background) setLoading(true);
    try {
      const data = await queueService.getMyQueue({ signal });
      if (signal?.aborted) return;
      setQueue(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      if (signal?.aborted) return;
      setQueue((current) => current ? { ...current, wait_estimate: null } : current);
      setError(err.message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  const fetchAllQueues = useCallback(async (signal, background = false) => {
    if (!background) setLoading(true);
    try {
      const data = await queueService.getAllQueues(undefined, { signal });
      if (signal?.aborted) return;
      setQueues(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      if (!signal?.aborted) setError(err.message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  const submitQueue = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const data = await queueService.createQueue(payload);
      setQueue(data);
      setLastUpdated(new Date());
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const callNext = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await queueService.callNextQueue();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = useCallback(async (id, status) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await queueService.updateQueueStatus(id, status);
      setQueues((prev) =>
        prev.map((q) => (q.id === id ? updated : q)),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    queue,
    queues,
    loading,
    error,
    lastUpdated,
    fetchMyQueue,
    fetchAllQueues,
    submitQueue,
    callNext,
    updateStatus,
  };
}
