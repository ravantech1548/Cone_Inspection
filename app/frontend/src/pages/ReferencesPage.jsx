import React, { useState, useEffect } from 'react';
import { api } from '../utils/api.js';

const ReferencesPage = () => {
  const [references, setReferences] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferences();
  }, []);

  const loadReferences = async () => {
    try {
      // Get model classes from YOLO model
      const modelData = await api.get('/model/classes');
      const modelClasses = modelData.classes || [];
      
      // Get uploaded reference images
      const refData = await api.get('/references');
      setReferences(refData.references || []);
      
      // Use model classes as the source of truth
      setClasses(modelClasses);
      
      // Auto-create folders for model classes
      for (const className of modelClasses) {
        try {
          await api.post('/references/classes', { className });
        } catch (err) {
          // Ignore if already exists
        }
      }
      
      // Auto-select first class if none selected
      if (modelClasses.length > 0 && !selectedClass) {
        setSelectedClass(modelClasses[0]);
      }
    } catch (error) {
      alert(`Failed to load references: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };



  const handleFileSelect = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    if (files.length === 0 || !selectedClass) return;

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/references/upload?class=${selectedClass}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      setFiles([]);
      loadReferences();
    } catch (error) {
      alert(`Upload failed: ${error.message}`);
    }
  };

  const handleDelete = async (className, filename) => {
    if (!confirm(`Delete ${filename}?`)) return;
    
    try {
      await api.delete(`/references/${className}/${filename}`);
      loadReferences();
    } catch (error) {
      alert(`Delete failed: ${error.message}`);
    }
  };

  const filteredReferences = selectedClass 
    ? references.filter(r => r.class === selectedClass)
    : references;

  if (loading) return <div>Loading...</div>;

  return (
    <div className="references-page">
      <h1>Reference Cone Tip Images</h1>
      <p>Upload reference images for each cone tip class. These are used by the YOLO model for classification.</p>

      <div className="references-controls">
        <div className="model-info-box">
          <h3>📦 Model Classes</h3>
          <p>Classes are automatically loaded from your YOLO best.pt model.</p>
          <p><strong>{classes.length}</strong> classes detected</p>
          {classes.length === 0 && (
            <p className="warning">⚠️ Make sure YOLO inference service is running</p>
          )}
        </div>

        <div className="upload-references">
          <h3>Upload Reference Images</h3>
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            <option value="">Select class...</option>
            {classes.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
          
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png"
            onChange={handleFileSelect}
            disabled={!selectedClass}
          />
          
          {files.length > 0 && (
            <div>
              <p>{files.length} files selected</p>
              <button onClick={handleUpload}>Upload to {selectedClass}</button>
            </div>
          )}
        </div>
      </div>

      <div className="references-gallery">
        <h3>Reference Images</h3>
        
        <div className="class-tabs">
          <button 
            onClick={() => setSelectedClass('')}
            className={!selectedClass ? 'active' : ''}
          >
            All ({references.length})
          </button>
          {classes.map(cls => (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={selectedClass === cls ? 'active' : ''}
            >
              {cls} ({references.filter(r => r.class === cls).length})
            </button>
          ))}
        </div>

        <div className="image-grid">
          {filteredReferences.map((ref, idx) => (
            <div key={idx} className="reference-card">
              <img src={ref.path} alt={ref.filename} />
              <div className="reference-info">
                <span className="class-badge">{ref.class}</span>
                <span className="filename">{ref.filename}</span>
                <button 
                  onClick={() => handleDelete(ref.class, ref.filename)}
                  className="btn-delete"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredReferences.length === 0 && (
          <p className="empty-state">No reference images yet. Upload some to get started!</p>
        )}
      </div>
    </div>
  );
};

export default ReferencesPage;
