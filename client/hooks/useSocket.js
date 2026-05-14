import { useEffect, useRef, useState } from 'react';
import { io as ioClient } from 'socket.io-client';
import {
  API,
  getOrCreateClientId,
  getStoredJobs,
  normalizeStatus,
  isTerminal,
} from '../lib/helpers';

// Manages socket connection, catchup on reconnect, and job:update events
export function useSocket(jobsRef, setJobs) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const clientId = getOrCreateClientId();
    const socket = ioClient(API, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: { clientId },
    });
    socketRef.current = socket;

    const handleConnect = () => {
      setConnected(true);
      // Catchup for all stored non-terminal jobs
      const stored = getStoredJobs();
      const current = jobsRef.current;
      stored.forEach((entry) => {
        const match = current.find((j) => j.jobId === entry.jobId);
        if (match && isTerminal(match.status)) return;
        socket.emit('catchup', { jobId: entry.jobId });
      });
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', () => setConnected(false));

    socket.on('job:update', (data) => {
      const { jobId, status: rawStatus, progress, cancelled } = data;
      const status = cancelled ? 'cancelled' : normalizeStatus(rawStatus);
      setJobs((prev) => {
        const idx = prev.findIndex((j) => j.jobId === jobId);
        if (idx === -1) return prev;

        // Don't let a stale update overwrite a terminal state
        // (e.g. server sends "Scanning" after user already cancelled)
        if (isTerminal(prev[idx].status) && !isTerminal(status)) return prev;

        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          status,
          progress: progress ?? copy[idx].progress,
          error: status === 'failed' ? 'Job processing failed' : copy[idx].error,
        };
        return copy;
      });
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect');
      socket.off('job:update');
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return { connected, socketRef };
}
