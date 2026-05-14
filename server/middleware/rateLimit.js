

const requestCounts = new Map();
const WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 30;

function rateLimit(req, res, next) {
  const key = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  // If this is the first request from this IP, initialize the count and start time
  if (!requestCounts.has(key)) {
    requestCounts.set(key, { count: 1, startTime: now });
    return next();
  }

  const record = requestCounts.get(key);

  // if the window has passed, reset the count
  if (now - record.startTime > WINDOW) {
    record.count = 1;
    record.startTime = now;
    return next();
  }

  record.count++;
  if (record.count > MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  next();
}

// periodically cleaning up stale entries to prevent memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts) {
    if (now - record.startTime > WINDOW * 2) {
      requestCounts.delete(key);
    }
  }
}, WINDOW * 2);

module.exports = rateLimit;
