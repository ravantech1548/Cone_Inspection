import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api.js';

const InspectionPage = () => {
  const [references, setReferences] = useState([]);
  const [selectedGoodClass, setSelectedGoodClass] = useState(null);
  const [mode, setMode] = useState('select'); // 'select', 'camera', 'upload'
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [classifying, setClassifying] = useState(false);
  const [result, setResult] = useState(null);
  const [batchResults, setBatchResults] = useState([]);
  const [currentBatchId, setCurrentBatchId] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadReferences();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (mode === 'camera' && selectedGoodClass && !stream) {
      startCamera();
    }
  }, [mode, selectedGoodClass]);

  const loadReferences = async () => {
    try {
      setLoading(true);
      
      // Get model classes from YOLO model
      const modelData = await api.get('/model/classes').catch(() => ({ classes: [] }));
      const modelClasses = modelData.classes || [];
      
      // Get uploaded reference images (use /list endpoint accessible to all authenticated users)
      const refData = await api.get('/references/list').catch(() => ({ references: [] }));
      const uploadedRefs = refData.references || [];
      
      // Create reference list with model classes
      const classSamples = modelClasses.map(className => {
        // Find first uploaded image for this class
        const uploadedRef = uploadedRefs.find(ref => ref.class === className);
        
        return {
          class: className,
          filename: uploadedRef?.filename || null,
          path: uploadedRef?.path || null,
          hasImage: !!uploadedRef
        };
      });
      
      setReferences(classSamples);
    } catch (error) {
      console.error('Failed to load references:', error);
      setReferences([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGoodClass = (className) => {
    // Toggle: if clicking the same class, deselect it
    if (selectedGoodClass === className) {
      setSelectedGoodClass(null);
    } else {
      // Select new class (stay on selection page)
      setSelectedGoodClass(className);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedGoodClass) {
      setMode('camera');
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
        };
      }
    } catch (error) {
      console.error('Camera error:', error);
      alert(`Camera access denied: ${error.message}\n\nPlease allow camera access or use Upload mode.`);
      setMode('upload');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) {
      alert('Camera not ready');
      return;
    }
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      alert('Camera not initialized. Please wait a moment.');
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob(async (blob) => {
      if (!blob) {
        alert('Failed to capture image');
        return;
      }
      
      setCapturedImage(blob);
      await classifyImage(blob);
    }, 'image/jpeg', 0.95);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setCapturedImage(file);
      await classifyImage(file);
    }
  };

  const classifyImage = async (imageBlob) => {
    setClassifying(true);
    setResult(null);
    
    try {
      // Ensure we have a valid blob
      if (!imageBlob || !(imageBlob instanceof Blob || imageBlob instanceof File)) {
        throw new Error('Invalid image data');
      }
      
      // Create batch if first image
      let batchId = currentBatchId;
      if (!batchId) {
        const batch = await api.post('/batches', { 
          name: `Inspection ${new Date().toLocaleString()}` 
        });
        batchId = batch.id;
        setCurrentBatchId(batchId);
        
        // Save selected good class
        await api.post(`/batches/${batchId}/select-color`, {
          colorId: 1, // Placeholder, we're using class name instead
          deltaETolerance: 10
        });
      }
      
      // Create form data and upload
      const formData = new FormData();
      formData.append('file', imageBlob, imageBlob.name || 'capture.jpg');
      
      const token = localStorage.getItem('token');
      const uploadResponse = await fetch(
        `/api/inspection/classify-and-save?batchId=${batchId}&selectedGoodClass=${selectedGoodClass}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        }
      );
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Classification failed');
      }
      
      const classificationResult = await uploadResponse.json();
      
      const finalResult = {
        ...classificationResult,
        selectedGoodClass,
        timestamp: new Date().toISOString()
      };
      
      setResult(finalResult);
      setBatchResults(prev => [...prev, finalResult]);
      
    } catch (error) {
      console.error('Classification error:', error);
      alert(`Classification failed: ${error.message}`);
    } finally {
      setClassifying(false);
    }
  };

  const resetCapture = () => {
    setCapturedImage(null);
    setResult(null);
  };

  const changeGoodClass = () => {
    setMode('select');
    setSelectedGoodClass(null);
    setBatchResults([]);
    setCurrentBatchId(null);
    stopCamera();
  };

  const viewBatch = () => {
    if (currentBatchId) {
      navigate(`/gallery/${currentBatchId}`);
    }
  };

  // Step 1: Select good class
  if (mode === 'select') {
    if (loading) {
      return (
        <div className="inspection-page">
          <h1>Loading...</h1>
          <p>Connecting to YOLO inference service...</p>
        </div>
      );
    }
    
    return (
      <div className="inspection-page">
        <h1>Select Acceptable Cone Tip</h1>
        <p>Choose which cone tip type should be classified as GOOD. All others will be REJECTED.</p>
        <p className="model-info">Classes loaded from YOLO model (best.pt)</p>
        
        <div className="reference-selection">
          {references.map((ref) => (
            <div 
              key={ref.class} 
              className={`reference-option ${!ref.hasImage ? 'no-image' : ''} ${selectedGoodClass === ref.class ? 'selected' : ''}`}
              onClick={() => handleSelectGoodClass(ref.class)}
            >
              {ref.hasImage ? (
                <img src={ref.path} alt={ref.class} />
              ) : (
                <div className="placeholder-image">
                  <span className="placeholder-icon">📷</span>
                  <span className="placeholder-text">No reference image</span>
                  <span className="placeholder-hint">Upload in References page</span>
                </div>
              )}
              <div className="reference-label">
                <h3>{ref.class.replace(/_/g, ' ')}</h3>
                <button className={selectedGoodClass === ref.class ? 'selected' : ''}>
                  {selectedGoodClass === ref.class ? '✓ Selected as GOOD' : 'Select as GOOD'}
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {references.length === 0 && (
          <div className="empty-state">
            <p>⚠️ No model classes found.</p>
            <p>Make sure the YOLO inference service is running:</p>
            <code>cd inference-service && python http_server.py</code>
          </div>
        )}
        
        {selectedGoodClass && (
          <div className="confirm-selection">
            <button onClick={handleConfirmSelection} className="btn-confirm">
              ✓ Confirm Selection & Start Inspection
            </button>
            <p className="selection-info">
              Selected: <strong>{selectedGoodClass.replace(/_/g, ' ')}</strong> as GOOD
            </p>
          </div>
        )}
      </div>
    );
  }

  // Step 2: Camera or Upload mode
  return (
    <div className="inspection-page">
      <div className="inspection-header">
        <div>
          <h1>Cone Tip Inspection</h1>
          <p>
            Selected GOOD class: <strong>{selectedGoodClass?.replace(/_/g, ' ')}</strong>
            <button onClick={changeGoodClass} className="btn-secondary">Change</button>
          </p>
          <p>Inspected: {batchResults.length} | Good: {batchResults.filter(r => r.classification === 'good').length} | Reject: {batchResults.filter(r => r.classification === 'reject').length}</p>
        </div>
        
        <div className="mode-toggle">
          <button 
            onClick={() => { setMode('camera'); startCamera(); }}
            className={mode === 'camera' ? 'active' : ''}
          >
            📷 Camera
          </button>
          <button 
            onClick={() => { setMode('upload'); stopCamera(); }}
            className={mode === 'upload' ? 'active' : ''}
          >
            📁 Upload
          </button>
        </div>
      </div>

      <div className="inspection-content">
        {mode === 'camera' && (
          <div className="camera-section">
            {!stream && (
              <button onClick={startCamera} className="btn-large">
                Start Camera
              </button>
            )}
            
            {stream && (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline
                  className="camera-preview"
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                
                {!capturedImage && (
                  <button onClick={captureImage} className="btn-capture">
                    📸 Capture
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {mode === 'upload' && !capturedImage && (
          <div className="upload-section">
            <label htmlFor="imageUpload" className="upload-label">
              <div className="upload-box">
                <p>📁 Click to upload image</p>
                <p className="upload-hint">or drag and drop</p>
              </div>
            </label>
            <input
              id="imageUpload"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {capturedImage && (
          <div className="result-section">
            <div className="captured-preview">
              <img src={URL.createObjectURL(capturedImage)} alt="Captured" />
            </div>
            
            {classifying && (
              <div className="classifying">
                <div className="spinner"></div>
                <p>Classifying...</p>
              </div>
            )}
            
            {result && (
              <div className={`result-card ${result.classification}`}>
                <h2>{result.classification.toUpperCase()}</h2>
                <div className="result-details">
                  <p><strong>Detected:</strong> {result.predicted_class?.replace(/_/g, ' ')}</p>
                  <p><strong>Confidence:</strong> {(result.confidence * 100).toFixed(1)}%</p>
                  <p><strong>Time:</strong> {result.inference_time_ms}ms</p>
                </div>
                
                <div className="result-actions">
                  <button onClick={resetCapture} className="btn-secondary">
                    {mode === 'camera' ? 'Capture Next' : 'Upload Next'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {batchResults.length > 0 && (
        <div className="batch-summary-bottom">
          <h3>Summary</h3>
          <div className="summary-stats-horizontal">
            <div className="stat-item">
              <span className="stat-value">{batchResults.length}</span>
              <span className="stat-label">TOTAL</span>
            </div>
            <div className="stat-item good">
              <span className="stat-value">{batchResults.filter(r => r.classification === 'good').length}</span>
              <span className="stat-label">GOOD</span>
            </div>
            <div className="stat-item reject">
              <span className="stat-value">{batchResults.filter(r => r.classification === 'reject').length}</span>
              <span className="stat-label">REJECT</span>
            </div>
          </div>
          <button onClick={viewBatch} className="btn-view-results-bottom">
            View Full Results
          </button>
        </div>
      )}
    </div>
  );
};

export default InspectionPage;
