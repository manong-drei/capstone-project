import { useState, useCallback } from 'react'
import * as queueService from '../services/queueService'

export function useQueue() {
  const [queue,   setQueue]   = useState(null)
  const [queues,  setQueues]  = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const fetchMyQueue = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await queueService.getMyQueue()
      setQueue(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAllQueues = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await queueService.getAllQueues()
      setQueues(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const submitQueue = useCallback(async (payload) => {
    setLoading(true)
    setError(null)
    try {
      const data = await queueService.createQueue(payload)
      setQueue(data)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const callNext = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await queueService.callNextQueue()
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateStatus = useCallback(async (id, status) => {
    setLoading(true)
    setError(null)
    try {
      await queueService.updateQueueStatus(id, status)
      setQueues(prev => prev.map(q => q.id === id ? { ...q, status } : q))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    queue,
    queues,
    loading,
    error,
    fetchMyQueue,
    fetchAllQueues,
    submitQueue,
    callNext,
    updateStatus,
  }
}
