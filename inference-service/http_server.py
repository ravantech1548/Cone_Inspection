"""
HTTP server wrapper for the inference service.
Allows the Node.js backend to call the inference service via REST API.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from ultralytics import YOLO

app = Flask(__name__)
CORS(app)

# Global model instance
MODEL = None
MODEL_PATH = os.getenv("MODEL_PATH", "./models/best.pt")

def load_model():
    """Load the YOLO model once at startup."""
    global MODEL
    if MODEL is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model not found at {MODEL_PATH}")
        MODEL = YOLO(MODEL_PATH)
        print(f"✓ Model loaded from {MODEL_PATH}")
        print(f"✓ Classes: {list(MODEL.names.values())}")
    return MODEL

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok", "service": "textile-cone-inspector"})

@app.route('/api/model-info', methods=['GET'])
def model_info():
    """Get model information including class names."""
    try:
        model = load_model()
        
        return jsonify({
            "model_path": MODEL_PATH,
            "model_type": "YOLOv8 Classification",
            "classes": list(model.names.values()),
            "num_classes": len(model.names),
            "class_mapping": {str(k): v for k, v in model.names.items()}
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/classify', methods=['POST'])
def classify():
    """Classify a cone tip image."""
    try:
        data = request.json
        
        if 'image_path' not in data:
            return jsonify({"error": "Missing image_path"}), 400
        
        image_path = data['image_path']
        confidence_threshold = data.get('confidence_threshold', 0.3)  # Lowered from 0.7
        
        print(f"[INFERENCE] Original path: {image_path}")
        
        # If path is already absolute and exists, use it
        if os.path.isabs(image_path) and os.path.exists(image_path):
            print(f"[INFERENCE] Using absolute path: {image_path}")
        else:
            # Path is relative or doesn't exist
            # The backend runs from project root, so we need to go up one level from inference-service
            script_dir = os.path.dirname(os.path.abspath(__file__))
            project_root = os.path.dirname(script_dir)  # Go up one level to project root
            
            if os.path.isabs(image_path):
                # Absolute path but doesn't exist - use as is and let it fail
                pass
            else:
                # Relative path - make it relative to project root
                image_path = os.path.join(project_root, image_path)
            
            print(f"[INFERENCE] Resolved path: {image_path}")
        
        print(f"[INFERENCE] Path exists: {os.path.exists(image_path)}")
        
        if not os.path.exists(image_path):
            return jsonify({"error": f"Image not found: {image_path}"}), 404
        
        model = load_model()
        
        # Run inference
        import time
        start_time = time.time()
        results = model.predict(source=image_path, conf=confidence_threshold, verbose=False)
        end_time = time.time()
        
        inference_time_ms = int((end_time - start_time) * 1000)
        
        print(f"[INFERENCE] Image: {image_path}")
        print(f"[INFERENCE] Confidence threshold: {confidence_threshold}")
        
        if not results or results[0].probs is None:
            print("[INFERENCE] ERROR: No classification results returned")
            return jsonify({
                "error": "No classification results returned",
                "predicted_class": None,
                "confidence": 0.0,
                "inference_time_ms": inference_time_ms
            })
        
        result = results[0]
        top1_index = result.probs.top1
        confidence = float(result.probs.top1conf.item())
        predicted_class = model.names[top1_index]
        
        print(f"[INFERENCE] Predicted: {predicted_class} (confidence: {confidence:.2%})")
        
        # Get all class probabilities
        all_classes = {}
        for i, prob in enumerate(result.probs.data):
            class_name = model.names[i]
            class_prob = float(prob.item())
            all_classes[class_name] = class_prob
            print(f"[INFERENCE]   {class_name}: {class_prob:.2%}")
        
        response = {
            "predicted_class": predicted_class,
            "confidence": confidence,
            "inference_time_ms": inference_time_ms,
            "model_version": "best.pt",
            "all_classes": all_classes
        }
        
        print(f"[INFERENCE] Response: {response}")
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    
    # Load model at startup
    try:
        load_model()
    except Exception as e:
        print(f"Warning: Could not load model at startup: {e}")
        print("Model will be loaded on first request")
    
    app.run(host='0.0.0.0', port=port, debug=False)
