import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api.js';

const DetailPage = () => {
  const { imageId } = useParams();
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImage();
  }, [imageId]);

  const loadImage = async () => {
    try {
      const data = await api.get(`/images/${imageId}`);
      setImage(data);
    } catch (error) {
      alert(`Failed to load image: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async (newClassification) => {
    if (!overrideReason.trim()) {
      alert('Please provide a reason for the override');
      return;
    }

    try {
      await api.post('/classify/override', {
        imageId: parseInt(imageId),
        newClassification,
        reason: overrideReason
      });
      
      navigate(`/gallery/${image.batch_id}`);
    } catch (error) {
      alert(`Override failed: ${error.message}`);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!image) return <div>Image not found</div>;

  return (
    <div className="detail-page">
      <button onClick={() => navigate(`/gallery/${image.batch_id}`)}>
        ← Back to Gallery
      </button>

      <h1>Image Details</h1>

      <div className="detail-grid">
        <div className="image-section">
          <div className="image-preview" style={{ backgroundColor: image.hex_color || '#ccc' }}>
            {image.filename}
          </div>
          <div className="color-info">
            <p>Hex: {image.hex_color}</p>
            {image.lab_color && (
              <p>LAB: L={image.lab_color.L?.toFixed(1)} A={image.lab_color.A?.toFixed(1)} B={image.lab_color.B?.toFixed(1)}</p>
            )}
          </div>
        </div>

        <div className="metadata-section">
          <h3>Classification</h3>
          <div className={`classification-badge ${image.classification}`}>
            {image.classification}
          </div>
          <p>Confidence: {(image.confidence * 100).toFixed(1)}%</p>

          <h3>Model Info</h3>
          <p>Model: {image.model_name} {image.model_version}</p>
          <p>Inference Time: {image.inference_time_ms}ms</p>

          <h3>File Info</h3>
          <p>Filename: {image.original_filename}</p>
          <p>Size: {(image.file_size / 1024).toFixed(1)} KB</p>
          <p>Dimensions: {image.width} × {image.height}</p>
        </div>
      </div>

      <div className="override-section">
        <h3>Manual Override</h3>
        <textarea
          placeholder="Reason for override..."
          value={overrideReason}
          onChange={(e) => setOverrideReason(e.target.value)}
          rows={3}
        />
        <div className="override-buttons">
          <button
            onClick={() => handleOverride('good')}
            disabled={image.classification === 'good'}
          >
            Mark as Good
          </button>
          <button
            onClick={() => handleOverride('reject')}
            disabled={image.classification === 'reject'}
          >
            Mark as Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailPage;
