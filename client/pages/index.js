import Head from 'next/head';
import { useState, useRef, useEffect } from 'react';
import {
  API,
  getOrCreateClientId,
  getStoredJobs,
  persistJobs,
  isTerminal,
} from '../lib/helpers';
import { useSocket } from '../hooks/useSocket';
import JobCard from '../components/JobCard';
import UploadBox from '../components/UploadBox';

export default function Home() {
  const [files, setFiles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const jobsRef = useRef(jobs);

  // keeping ref in sync so socket hook always has latest jobs
  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);

  // socket.io connection
  const { connected, socketRef } = useSocket(jobsRef, setJobs);

  // load persisted jobs on mount

  useEffect(() => {
    const stored = getStoredJobs();
    if (stored.length > 0) {
      setJobs(
        stored.map((entry) => ({
          jobId: entry.jobId,
          filename: entry.filename || 'Unknown file',
          status: 'pending',
          progress: 0,
          error: null,
        }))
      );
    }
  }, []);

  // file selection with validation

  const onFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length) {
      setFiles((prev) => [...prev, ...selected]);
    }
  };

  // upload

  const handleSubmit = async () => {
    if (files.length === 0 || uploading) return;
    setUploading(true);
    const clientId = getOrCreateClientId();

    // create placeholder jobs for all selected files
    const newJobs = files.map((f) => ({
      jobId: null,
      filename: f.name,
      status: 'uploading',
      progress: 0,
      error: null,
    }));
    setJobs((prev) => [...newJobs, ...prev]);

    // Upload files one by one
    const results = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const fd = new FormData();
        fd.append('file', files[i]);
        const res = await fetch(`${API}/upload`, {
          method: 'POST',
          body: fd,
          headers: { 'x-client-id': clientId },
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Upload failed (HTTP ${res.status})`);
        }

        const { jobId } = await res.json();

        setJobs((prev) => {
          const copy = [...prev];
          copy[i] = { ...copy[i], jobId, status: 'uploading' };
          return copy;
        });

        if (socketRef.current?.connected) {
          socketRef.current.emit('catchup', { jobId });
        }

        results.push({ jobId, filename: files[i].name });
      } catch (err) {
        setJobs((prev) => {
          const copy = [...prev];
          copy[i] = { ...copy[i], status: 'failed', progress: 0, error: err.message };
          return copy;
        });
      }
    }

    if (results.length) {
      const existing = getStoredJobs();
      persistJobs([...results, ...existing]);
    }

    setFiles([]);
    if (inputRef.current) inputRef.current.value = '';
    setUploading(false);
  };

  // cancel job

  const cancelJob = async (jobId) => {
    if (!jobId) return;
    const clientId = getOrCreateClientId();
    // Optimistic UI
    setJobs((prev) =>
      prev.map((j) =>
        j.jobId === jobId ? { ...j, status: 'cancelled', error: null } : j
      )
    );
    try {
      const res = await fetch(`${API}/cancel/${jobId}`, {
        method: 'POST',
        headers: { 'x-client-id': clientId },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Cancel failed (${res.status})`);
      }
    } catch (err) {
      setJobs((prev) =>
        prev.map((j) =>
          j.jobId === jobId
            ? { ...j, status: 'failed', error: `Cancel failed: ${err.message}` }
            : j
        )
      );
    }
  };

  // dismiss / clear

  const dismissJob = (jobId) => {
    setJobs((prev) => prev.filter((j) => j.jobId !== jobId));
    const stored = getStoredJobs();
    persistJobs(stored.filter((e) => e.jobId !== jobId));
  };

  const clearTerminalJobs = () => {
    const next = jobs.filter((j) => !isTerminal(j.status));
    setJobs(next);
    const activeIds = new Set(next.map((j) => j.jobId));
    const stored = getStoredJobs();
    persistJobs(stored.filter((e) => activeIds.has(e.jobId)));
  };

  // render

  const isDisconnected = !connected;

  return (
    <>
      <Head>
        <title>Live Status Tracker</title>
        <meta
          name="description"
          content="Upload documents and track processing in real-time"
        />
      </Head>

      <main className="container">
        <h1 className="title">Live Status Tracker</h1>

        {/* connection banner */}
        {isDisconnected && jobs.length > 0 && (
          <div className="conn-banner" id="connection-banner">
            <span className="conn-spinner" />
            Connection lost — reconnecting…
          </div>
        )}

        {/* upload section */}
        <UploadBox
          files={files}
          uploading={uploading}
          onFileChange={onFileChange}
          onSubmit={handleSubmit}
          inputRef={inputRef}
        />

        {/* jobs list */}
        {jobs.length > 0 && (
          <div className="jobs-section" id="jobs-section">
            <div className="jobs-head">
              <h2 className="jobs-heading">Jobs</h2>
              <span className="jobs-count">{jobs.length}</span>
              {jobs.some((j) => isTerminal(j.status)) && (
                <button
                  className="btn-clear-all"
                  onClick={clearTerminalJobs}
                  id="btn-clear-all"
                >
                  Clear All
                </button>
              )}
            </div>

            {jobs.map((job, i) => (
              <JobCard
                key={job.jobId || `p-${i}`}
                job={job}
                index={i}
                isDisconnected={isDisconnected}
                onCancel={cancelJob}
                onDismiss={dismissJob}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
