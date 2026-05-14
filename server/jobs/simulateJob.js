const { getJob } = require('../jobsStore');

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function simulateJob(jobId, io) {
  if (!io) {
    console.error(`Socket.io instance not provided for job ${jobId}`);
    return;
  }

  const steps = [
    { status: 'Uploading', progress: 25, min: 2000, max: 3000 },
    { status: 'Scanning', progress: 50, min: 3000, max: 5000 },
    { status: 'Extracting Data', progress: 75, min: 4000, max: 6000 },
  ];

  // Decide upfront if this job will fail and at which step
  const willFail = Math.random() < 0.1;
  const failAtStep = willFail ? randBetween(0, steps.length - 1) : -1;

  const emitToOwner = (job, payload) => {
    if (!job || !job.clientId) return;
    io.to(job.clientId).emit('job:update', payload);
  };

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    // checking cancelled before delay
    const job = getJob(jobId);
    if (!job) return;
    if (job.cancelled) {
      emitToOwner(job, { jobId, status: 'Cancelled', progress: job.progress });
      return;
    }

    await wait(randBetween(step.min, step.max));

    // checking cancelled again after delay
    const job2 = getJob(jobId);
    if (!job2) return;
    if (job2.cancelled) {
      emitToOwner(job2, { jobId, status: 'Cancelled', progress: job2.progress });
      return;
    }

    // checking if this step is the failure point
    if (willFail && i === failAtStep) {
      job2.status = 'Failed';
      job2.progress = step.progress;
      emitToOwner(job2, { jobId, status: 'Failed', progress: step.progress });
      return;
    }

    // normal progress update
    job2.status = step.status;
    job2.progress = step.progress;
    emitToOwner(job2, { jobId, status: job2.status, progress: job2.progress });
  }

  // all steps passed — complete the job
  const jobFinal = getJob(jobId);
  if (!jobFinal) return;
  if (jobFinal.cancelled) {
    emitToOwner(jobFinal, { jobId, status: 'Cancelled', progress: jobFinal.progress });
    return;
  }

  await wait(1000);
  jobFinal.status = 'Completed';
  jobFinal.progress = 100;
  emitToOwner(jobFinal, { jobId, status: 'Completed', progress: 100 });
}

module.exports = simulateJob;