import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api.js';

const GalleryPage = () => {
  const { batchId } = useParams();
  const [batch, setBatch] = useState(null);
  const [images, setImages] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [batchId]);

  const loadData = async () => {
    try {
      console.log('Loading batch:', batchId);
      
      const batchData = await api.get(`/batches/${batchId}`).catch(err => {
        console.error('Batch load error:', err);
        throw new Error(`Failed to load batch: ${err.message}`);
      });
      
      console.log('Batch loaded:', batchData);
      
      const imagesData = await api.get(`/images?batchId=${batchId}`).catch(err => {
        console.error('Images load error:', err);
        throw new Error(`Failed to load images: ${err.message}`);
      });
      
      console.log('Images loaded:', imagesData.length);
      
      setBatch(batchData);
      setImages(imagesData);
    } catch (error) {
      console.error('Failed to load gallery:', error);
      alert(`Failed to load: ${error.message}\n\nCheck browser console (F12) for details.`);
    } finally {
      setLoading(false);
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
            {image.thumbnail ? (
              <img 
                src={`data:image/jpeg;base64,${image.thumbnail}`} 
                alt={image.filename}
                className="image-thumbnail"
              />
            ) : (
              <div className="image-placeholder" style={{ backgroundColor: image.hex_color || '#ccc' }}>
                {image.filename}
              </div>
            )}
            <div className={`classification ${image.classification}`}>
              {image.classification}
              {image.confidence && (
                <span className="confidence"> {(image.confidence * 100).toFixed(0)}%</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default GalleryPage;
