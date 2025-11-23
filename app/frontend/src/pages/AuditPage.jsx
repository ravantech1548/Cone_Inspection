import React, { useState, useEffect } from 'react';
import { api } from '../utils/api.js';

const AuditPage = () => {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      const data = await api.get('/batches');
      setBatches(data);
    } catch (error) {
      alert(`Failed to load batches: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadReport = async (batchId) => {
    try {
      const data = await api.get(`/reports/batch/${batchId}`);
      setReport(data);
      setSelectedBatch(batchId);
    } catch (error) {
      alert(`Failed to load report: ${error.message}`);
    }
  };

  const exportReport = async (format) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reports/batch/${selectedBatch}/export?format=${format}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch-${selectedBatch}-report.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert(`Failed to export: ${error.message}`);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="audit-page">
      <h1>Inspection Reports</h1>
      <p>View and export inspection batch results</p>

      <div className="batch-list">
        <h2>Inspection Batches</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Status</th>
              <th>Total</th>
              <th>Good</th>
              <th>Reject</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {batches.map(batch => (
              <tr key={batch.id}>
                <td>{batch.id}</td>
                <td>{batch.name}</td>
                <td>{batch.status}</td>
                <td>{batch.total_images}</td>
                <td>{batch.good_count}</td>
                <td>{batch.reject_count}</td>
                <td>{new Date(batch.created_at).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => loadReport(batch.id)}>View Report</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {report && (
        <div className="report-section">
          <h2>Batch Report: {report.batch.name}</h2>
          
          <div className="report-actions">
            <button onClick={() => exportReport('json')}>Export JSON</button>
            <button onClick={() => exportReport('csv')}>Export CSV</button>
          </div>

          <div className="report-summary">
            <h3>Summary</h3>
            <p>Inspector: {report.batch.username}</p>
            <p>Selected Good Class: {report.batch.selected_good_class || 'Not set'}</p>
            <p>Status: {report.batch.status}</p>
            <p>Total Images: {report.batch.total_images}</p>
            <p>Good: {report.batch.good_count}</p>
            <p>Reject: {report.batch.reject_count}</p>
            <p>Created: {new Date(report.batch.created_at).toLocaleString()}</p>
            {report.batch.finalized_at && (
              <p>Finalized: {new Date(report.batch.finalized_at).toLocaleString()}</p>
            )}
          </div>

          <div className="images-section">
            <h3>Images ({report.images.length})</h3>
            <table className="report-images-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Filename</th>
                  <th>Classification</th>
                  <th>Predicted Class</th>
                  <th>Confidence</th>
                  <th>Model</th>
                  <th>Inference Time</th>
                </tr>
              </thead>
              <tbody>
                {report.images.map(image => (
                  <tr key={image.id}>
                    <td>
                      {image.thumbnail ? (
                        <img 
                          src={`data:image/jpeg;base64,${image.thumbnail}`}
                          alt={image.filename}
                          className="report-thumbnail"
                          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                      ) : (
                        <div 
                          className="report-thumbnail-placeholder"
                          style={{ 
                            width: '60px', 
                            height: '60px', 
                            backgroundColor: image.hex_color || '#ccc',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            color: '#fff'
                          }}
                        >
                          No Image
                        </div>
                      )}
                    </td>
                    <td>{image.filename}</td>
                    <td className={image.classification}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: image.classification === 'good' ? '#d4edda' : '#f8d7da',
                        color: image.classification === 'good' ? '#155724' : '#721c24',
                        fontWeight: 'bold'
                      }}>
                        {image.classification.toUpperCase()}
                      </span>
                    </td>
                    <td>{image.payload?.predicted_class || 'N/A'}</td>
                    <td>{image.confidence ? (image.confidence * 100).toFixed(1) + '%' : 'N/A'}</td>
                    <td>{image.model_name}:{image.model_version}</td>
                    <td>{image.inference_time_ms}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditPage;
