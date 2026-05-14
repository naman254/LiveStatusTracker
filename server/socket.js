const { getJob } = require('./jobsStore');

let ioInstance = null;

function init(io) {
  ioInstance = io;
  
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    const clientId = socket.handshake.auth && socket.handshake.auth.clientId;

    if (clientId) {
      socket.join(clientId);
    }
    
    // Listen for catchup event
    socket.on('catchup', (data) => {
      const { jobId } = data;
      console.log(`Catchup request for jobId: ${jobId}`);
      
      const job = getJob(jobId);
      if (!job) {
        socket.emit('error', { message: 'Job not found' });
        return;
      }

      if (job.clientId && job.clientId !== clientId) {
        socket.emit('error', { message: 'Job not found' });
        return;
      }
      
      // Emit current status back to this specific socket
      socket.emit('job:update', {
        jobId,
        status: job.status,
        progress: job.progress,
        cancelled: job.cancelled
      });
    });
    
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}

function getIO() {
  return ioInstance;
}

module.exports = { init, getIO };
