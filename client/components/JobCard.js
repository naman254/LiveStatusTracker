import { isTerminal, statusLabel } from '../lib/helpers';
export default function JobCard({ job, index, isDisconnected, onCancel, onDismiss }) {
  const s = job.status;
  const showReconnecting = isDisconnected && !isTerminal(s);

  return (
    <div
      className={`job-card${showReconnecting ? ' card-dim' : ''}`}
      id={`job-card-${index}`}
    >
      <div className="job-top">
        <span className="job-name" title={job.filename}>
          {job.filename}
        </span>
        <div className="job-actions">
          <span className={`job-badge badge-${showReconnecting ? 'reconnecting' : s}`}>
            <span className="dot" />
            {showReconnecting ? 'Reconnecting…' : statusLabel(s)}
          </span>
          {job.jobId && !isTerminal(s) && (
            <button
              className="btn-cancel"
              onClick={() => onCancel(job.jobId)}
              title="Cancel this job"
              id={`cancel-job-${index}`}
            >
              ✕ Cancel
            </button>
          )}
          {isTerminal(s) && (
            <button
              className="btn-dismiss"
              onClick={() => onDismiss(job.jobId)}
              title="Dismiss this job"
              id={`dismiss-job-${index}`}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="progress-track">
        <div
          className={`progress-bar bar-${s}`}
          style={{ width: `${job.progress}%` }}
        />
      </div>

      <div className="job-bottom">
        <span className="job-pct">{job.progress}%</span>
        {job.jobId && (
          <span className="job-id" title={job.jobId}>
            {job.jobId.slice(0, 8)}…
          </span>
        )}
      </div>

      {job.error && <p className="job-error">{job.error}</p>}
    </div>
  );
}
