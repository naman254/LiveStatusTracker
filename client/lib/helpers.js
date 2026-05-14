export const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const LS_KEY = 'lst_jobs';
export const CLIENT_ID_KEY = 'lst_client_id';

export const ALLOWED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'txt', 'rtf', 'odt',
  'xls', 'xlsx', 'csv', 'ppt', 'pptx',
];
export const ACCEPT_STRING = ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(',');

// localStorage helpers

export function getStoredJobs() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || [];
  } catch {
    return [];
  }
}

export function persistJobs(entries) {
  localStorage.setItem(LS_KEY, JSON.stringify(entries));
}

export function getOrCreateClientId() {
  if (typeof window === 'undefined') return '';
  const existing = localStorage.getItem(CLIENT_ID_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID?.();
  localStorage.setItem(CLIENT_ID_KEY, id);
  return id;
}

// Status helpers

export function normalizeStatus(raw) {
  if (!raw) return 'pending';
  const lower = raw.toLowerCase().replace(/\s+/g, '-');
  const map = {
    uploading: 'uploading',
    scanning: 'scanning',
    'extracting-data': 'extracting',
    completed: 'completed',
    failed: 'failed',
    cancelled: 'cancelled',
    uploaded: 'uploaded',
    pending: 'pending',
  };
  return map[lower] || lower;
}

export function isTerminal(s) {
  return ['completed', 'failed', 'cancelled'].includes(s);
}


export function statusLabel(s) {
  const map = {
    uploading: 'Uploading',
    uploaded: 'Uploaded',
    scanning: 'Scanning',
    extracting: 'Extracting Data',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
    pending: 'Pending',
  };
  return map[s] || s;
}
