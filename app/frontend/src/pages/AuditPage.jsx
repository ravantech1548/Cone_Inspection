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

  const exportReport = (format) => {
    window.open(`/api/reports/batch/${selectedBatch}/export?format=${format}`, '_blank');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="audit-page">
      <h1>Audit & Reports</h1>

      <div className="batch-list">
        <h2>Batches</h2>
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
            <p>Acceptable Color: {report.batch.acceptable_color_name}</p>
            <p>ΔE Tolerance: {report.batch.delta_e_tolerance}</p>
            <p>Total Images: {report.batch.total_images}</p>
            <p>Good: {report.batch.good_count}</p>
            <p>Reject: {report.batch.reject_count}</p>
          </div>

          {report.overrides.length > 0 && (
            <div className="overrides-section">
              <h3>Manual Overrides ({report.overrides.length})</h3>
              <table>
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Original</th>
                    <th>New</th>
                    <th>Reason</th>
                    <th>User</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {report.overrides.map(override => (
                    <tr key={override.id}>
                      <td>{override.filename}</td>
                      <td>{override.original_classification}</td>
                      <td>{override.new_classification}</td>
                      <td>{override.reason}</td>
                      <td>{override.username}</td>
                      <td>{new Date(override.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditPage;
