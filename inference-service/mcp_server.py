"""
FastMCP-based inference service for textile cone-tip classification using YOLO best.pt model.
This service provides MCP tools that can be called from the Node.js backend.
"""

from fastmcp import FastMCP
from ultralytics import YOLO
from PIL import Image
import base64
import io
import time
import os
from pathlib import Path

# Initialize FastMCP server
mcp = FastMCP("Textile Cone Inspector")

# Global model instance (loaded once)
MODEL = None
MODEL_PATH = os.getenv("MODEL_PATH", "./models/best.pt")
REFERENCE_IMAGES_DIR = os.getenv("REFERENCE_IMAGES_DIR", "./reference_images")

def load_model():
    """Load the YOLO model once at startup."""
    global MODEL
    if MODEL is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model not found at {MODEL_PATH}")
        MODEL = YOLO(MODEL_PATH)
        print(f"✓ Model loaded from {MODEL_PATH}")
    return MODEL

@mcp.tool()
def classify_cone_tip(image_path: str, confidence_threshold: float = 0.7) -> dict:
    """
    Classify a textile cone tip image using the custom YOLO model.
    
    Args:
        image_path: Path to the image file to classify
        confidence_threshold: Minimum confidence threshold (default: 0.7)
    
    Returns:
        Dictionary with predicted_class, confidence, inference_time_ms, and model_version
    """
    try:
        model = load_model()
        
        if not os.path.exists(image_path):
            return {
                "error": f"Image not found: {image_path}",
                "predicted_class": None,
                "confidence": 0.0,
                "inference_time_ms": 0
            }
        
        # Run inference with timing
        start_time = time.time()
        results = model.predict(source=image_path, conf=confidence_threshold, verbose=False)
        end_time = time.time()
        
        inference_time_ms = int((end_time - start_time) * 1000)
        
        if not results or results[0].probs is None:
            return {
                "error": "No classification results returned",
                "predicted_class": None,
                "confidence": 0.0,
                "inference_time_ms": inference_time_ms
            }
        
        result = results[0]
        top1_index = result.probs.top1
        confidence = float(result.probs.top1conf.item())
        predicted_class = model.names[top1_index]
        
        return {
            "predicted_class": predicted_class,
            "confidence": confidence,
            "inference_time_ms": inference_time_ms,
            "model_version": "best.pt",
            "all_classes": {model.names[i]: float(result.probs.data[i].item()) 
                           for i in range(len(model.names))}
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "predicted_class": None,
            "confidence": 0.0,
            "inference_time_ms": 0
        }

@mcp.tool()
def classify_cone_tip_base64(image_base64: str, confidence_threshold: float = 0.7) -> dict:
    """
    Classify a textile cone tip from base64 encoded image.
    
    Args:
        image_base64: Base64 encoded image data
        confidence_threshold: Minimum confidence threshold (default: 0.7)
    
    Returns:
        Dictionary with predicted_class, confidence, inference_time_ms
    """
    try:
        # Decode base64 to image
        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data))
        
        # Save temporarily
        temp_path = "/tmp/temp_cone_image.jpg"
        image.save(temp_path)
        
        # Classify
        result = classify_cone_tip(temp_path, confidence_threshold)
        
        # Cleanup
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return result
        
    except Exception as e:
        return {
            "error": str(e),
            "predicted_class": None,
            "confidence": 0.0,
            "inference_time_ms": 0
        }

@mcp.tool()
def list_reference_images() -> dict:
    """
    List all reference cone tip images available for comparison.
    
    Returns:
        Dictionary with list of reference images and their classes
    """
    try:
        if not os.path.exists(REFERENCE_IMAGES_DIR):
            os.makedirs(REFERENCE_IMAGES_DIR, exist_ok=True)
            return {"reference_images": [], "count": 0}
        
        reference_images = []
        for class_dir in Path(REFERENCE_IMAGES_DIR).iterdir():
            if class_dir.is_dir():
                class_name = class_dir.name
                images = list(class_dir.glob("*.jpg")) + list(class_dir.glob("*.png"))
                for img_path in images:
                    reference_images.append({
                        "class": class_name,
                        "filename": img_path.name,
                        "path": str(img_path)
                    })
        
        return {
            "reference_images": reference_images,
            "count": len(reference_images)
        }
        
    except Exception as e:
        return {"error": str(e), "reference_images": [], "count": 0}

@mcp.tool()
def match_against_references(image_path: str, top_k: int = 3) -> dict:
    """
    Classify an image and match it against reference images.
    
    Args:
        image_path: Path to the image to classify
        top_k: Number of top matching classes to return (default: 3)
    
    Returns:
        Dictionary with classification result and matching reference images
    """
    try:
        # First classify the image
        classification = classify_cone_tip(image_path)
        
        if classification.get("error"):
            return classification
        
        # Get reference images
        references = list_reference_images()
        
        # Find matching references for the predicted class
        predicted_class = classification["predicted_class"]
        matching_refs = [
            ref for ref in references["reference_images"] 
            if ref["class"] == predicted_class
        ]
        
        # Get top K classes
        all_classes = classification.get("all_classes", {})
        top_classes = sorted(all_classes.items(), key=lambda x: x[1], reverse=True)[:top_k]
        
        return {
            "classification": {
                "predicted_class": predicted_class,
                "confidence": classification["confidence"],
                "inference_time_ms": classification["inference_time_ms"]
            },
            "top_k_classes": [{"class": cls, "confidence": conf} for cls, conf in top_classes],
            "matching_references": matching_refs,
            "match_count": len(matching_refs)
        }
        
    except Exception as e:
        return {"error": str(e)}

@mcp.tool()
def get_model_info() -> dict:
    """
    Get information about the loaded YOLO model.
    
    Returns:
        Dictionary with model information
    """
    try:
        model = load_model()
        
        return {
            "model_path": MODEL_PATH,
            "model_type": "YOLOv8 Classification",
            "classes": list(model.names.values()),
            "num_classes": len(model.names),
            "reference_images_dir": REFERENCE_IMAGES_DIR
        }
        
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    # Run the MCP server
    mcp.run()
