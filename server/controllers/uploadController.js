const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { createJob } = require('../jobsStore');
const socket = require('../socket');
const simulateJob = require('../jobs/simulateJob');

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'csv', 'ppt', 'pptx'];

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
}).single('file');

function uploadHandler(req, res) {
  upload(req, res, function (err) {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds 10MB limit' });
      }
      return res.status(500).json({ error: 'Upload error', details: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided. Use field name "file".' });
    }

    // Server side file extension validation
    const ext = req.file.originalname.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return res.status(400).json({
        error: `File type .${ext} is not allowed. Accepted: ${ALLOWED_EXTENSIONS.join(', ')}`,
      });
    }

    const clientId = req.headers['x-client-id'];
    if (!clientId) {
      return res.status(400).json({ error: 'Missing client id header.' });
    }

    const jobId = uuidv4();
    createJob(jobId, { filename: req.file.originalname, clientId });

    // Immediately return the jobId; processing happens asynchronously
    res.status(202).json({ jobId });

    // Start background simulation using the servers socket.io instance
    try {
      const io = socket.getIO();
      simulateJob(jobId, io).catch((err) => console.error('Simulation error', err));
    } catch (err) {
      console.error('Failed to start job simulation', err);
    }

    return;
  });
}

module.exports = { uploadHandler };
