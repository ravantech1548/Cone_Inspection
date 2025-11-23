import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api.js';

const GalleryPage = () => {
  const { batchId } = useParams();
  const [batch, setBatch] = useState(null);
  const [images, setImages] = useState([]);
  const [taxonomy, setTaxonomy] = useState([]);
  const [selectedColorId, setSelectedColorId] = useState(null);
  const [deltaE, setDeltaE] = useState(10);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [batchId]);

  const loadData = async () => {
    try {
      const [batchData, imagesData, taxonomyData] = await Promise.all([
        api.get(`/batches/${batchId}`),
        api.get(`/images?batchId=${batchId}`),
        api.get('/admin/taxonomy')
      ]);
      
      setBatch(batchData);
      setImages(imagesData);
      setTaxonomy(taxonomyData);
      
      if (batchData.acceptable_color_id) {
        setSelectedColorId(batchData.acceptable_color_id);
        setDeltaE(batchData.delta_e_tolerance);
      }
    } catch (error) {
      alert(`Failed to load: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectColor = async () => {
    try {
      await api.post(`/batches/${batchId}/select-color`, {
        colorId: selectedColorId,
        deltaETolerance: deltaE
      });
      
      await api.post('/classify/apply', { batchId: parseInt(batchId) });
      
      loadData();
    } catch (error) {
      alert(`Classification failed: ${error.message}`);
    }
  };

  const filteredImages = images.filter(img => {
    if (filter === 'all') return true;
    return img.classification === filter;
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div className="gallery-page">
      <h1>Batch: {batch?.name}</h1>
      
      <div className="batch-info">
        <p>Total: {batch?.total_images} | Good: {batch?.good_count} | Reject: {batch?.reject_count}</p>
        <p>Status: {batch?.status}</p>
      </div>

      {batch?.status !== 'finalized' && (
        <div className="color-selector">
          <h3>Select Acceptable Color</h3>
          <select value={selectedColorId || ''} onChange={(e) => setSelectedColorId(parseInt(e.target.value))}>
            <option value="">Choose color...</option>
            {taxonomy.map(color => (
              <option key={color.id} value={color.id}>{color.color_name}</option>
            ))}
          </select>
          
          <label>
            ΔE Tolerance:
            <input
              type="number"
              value={deltaE}
              onChange={(e) => setDeltaE(parseFloat(e.target.value))}
              min="0"
              max="100"
              step="0.5"
            />
          </label>
          
          <button onClick={handleSelectColor} disabled={!selectedColorId}>
            Classify Batch
          </button>
        </div>
      )}

      <div className="filters">
        <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>
          All
        </button>
        <button onClick={() => setFilter('good')} className={filter === 'good' ? 'active' : ''}>
          Good
        </button>
        <button onClick={() => setFilter('reject')} className={filter === 'reject' ? 'active' : ''}>
          Reject
        </button>
      </div>

      <div className="image-grid">
        {filteredImages.map(image => (
          <Link key={image.id} to={`/image/${image.id}`} className="image-card">
            <div className="image-placeholder" style={{ backgroundColor: image.hex_color || '#ccc' }}>
              {image.filename}
            </div>
            <div className={`classification ${image.classification}`}>
              {image.classification}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default GalleryPage;
