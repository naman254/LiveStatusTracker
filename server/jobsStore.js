const jobs = {};

function createJob(jobId, meta = {}) {
  jobs[jobId] = Object.assign(
    { status: 'Uploading', progress: 0, cancelled: false },
    meta
  );
  return jobs[jobId];
}

function getJob(jobId) {
  return jobs[jobId];
}

function cancelJob(jobId) {
  const job = jobs[jobId];
  if (!job) return null;
  job.cancelled = true;
  job.status = 'Cancelled';
  return job;
}

module.exports = {
  jobs,
  createJob,
  getJob,
  cancelJob,
};
