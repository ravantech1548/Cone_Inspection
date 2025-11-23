import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api.js';

const UploadPage = () => {
  const [batchName, setBatchName] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const navigate = useNavigate();

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      f => f.type === 'image/jpeg' || f.type === 'image/png'
    );
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    try {
      const batch = await api.post('/batches', { name: batchName || undefined });
      const uploadResults = await api.uploadFiles(batch.id, files);
      
      setResults(uploadResults);
      
      setTimeout(() => {
        navigate(`/gallery/${batch.id}`);
      }, 2000);
    } catch (error) {
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-page">
      <h1>Upload Cone Images</h1>
      
      <div className="form-group">
        <label htmlFor="batchName">Batch Name (optional)</label>
        <input
          id="batchName"
          type="text"
          value={batchName}
          onChange={(e) => setBatchName(e.target.value)}
          placeholder="e.g., Morning Batch 2024-01-15"
        />
      </div>

      <div
        className="dropzone"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <p>Drag and drop images here, or click to select</p>
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          id="fileInput"
        />
        <label htmlFor="fileInput" className="btn-secondary">
          Select Files
        </label>
      </div>

      {files.length > 0 && (
        <div className="file-list">
          <h3>{files.length} files selected</h3>
          <ul>
            {files.slice(0, 10).map((file, idx) => (
              <li key={idx}>{file.name}</li>
            ))}
            {files.length > 10 && <li>... and {files.length - 10} more</li>}
          </ul>
          <button onClick={handleUpload} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload Batch'}
          </button>
        </div>
      )}

      {results && (
        <div className="upload-results">
          <h3>Upload Complete</h3>
          <p>Uploaded: {results.results.filter(r => r.status === 'uploaded').length}</p>
          <p>Duplicates: {results.results.filter(r => r.status === 'duplicate').length}</p>
          <p>Redirecting to gallery...</p>
        </div>
      )}
    </div>
  );
};

export default UploadPage;
