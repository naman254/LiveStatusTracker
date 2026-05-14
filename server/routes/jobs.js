const express = require('express');
const router = express.Router();
const { statusHandler, cancelHandler } = require('../controllers/jobsController');

router.get('/status/:jobId', statusHandler);
router.post('/cancel/:jobId', cancelHandler);

module.exports = router;
