import { ALLOWED_EXTENSIONS, ACCEPT_STRING } from '../lib/helpers';

export default function UploadBox({ files, uploading, onFileChange, onSubmit, inputRef }) {
  return (
    <div className="upload-box">
      <div className="input-row">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_STRING}
          onChange={onFileChange}
          multiple
          id="file-input"
          className="file-input"
        />
        <button
          onClick={onSubmit}
          disabled={files.length === 0 || uploading}
          className="btn-submit"
          id="btn-submit"
        >
          {uploading
            ? 'Uploading…'
            : `Submit${files.length > 1 ? ` (${files.length})` : ''}`}
        </button>
      </div>

      {files.length > 0 && (
        <p className="selected-file">
          Selected: <strong>{files.map((f) => f.name).join(', ')}</strong>
        </p>
      )}

      <p className="hint">
        Allowed: {ALLOWED_EXTENSIONS.join(', ')} · Max 10 MB per file
      </p>
    </div>
  );
}
