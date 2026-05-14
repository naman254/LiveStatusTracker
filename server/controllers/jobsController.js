const { getJob, cancelJob } = require('../jobsStore');
const socket = require('../socket');

function statusHandler(req, res) {
  const { jobId } = req.params;
  const job = getJob(jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  return res.json({ jobId, ...job });
}

function cancelHandler(req, res) {
  const { jobId } = req.params;

  // verify the requester owns this job
  const clientId = req.headers['x-client-id'];
  const existing = getJob(jobId);
  if (!existing) return res.status(404).json({ error: 'Job not found' });

  if (existing.clientId && existing.clientId !== clientId) {
    return res.status(403).json({ error: 'Not authorized to cancel this job' });
  }

  const job = cancelJob(jobId);

  const io = socket.getIO();
  if (io && job.clientId) {
    io.to(job.clientId).emit('job:update', {
      jobId,
      status: job.status,
      progress: job.progress,
      cancelled: job.cancelled,
    });
  }

  return res.json({ jobId, ...job });
}

module.exports = { statusHandler, cancelHandler };
