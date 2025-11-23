"""
Test script to verify YOLO inference is working correctly.
Tests the model with a sample image and displays results.
"""

import os
import sys
from ultralytics import YOLO
from PIL import Image

def test_inference(model_path='./models/best.pt', image_path=None):
    """
    Test YOLO inference with a sample image.
    """
    print("=" * 60)
    print("YOLO Inference Test")
    print("=" * 60)
    
    # Check if model exists
    if not os.path.exists(model_path):
        print(f"\n❌ ERROR: Model not found at {model_path}")
        return
    
    # Check if image provided
    if not image_path:
        print("\n⚠ No test image provided")
        print("\nUsage: python test_inference.py <path_to_test_image>")
        print("Example: python test_inference.py ../uploads/test_cone.jpg")
        return
    
    if not os.path.exists(image_path):
        print(f"\n❌ ERROR: Image not found at {image_path}")
        return
    
    try:
        # Load model
        print(f"\n📦 Loading model: {model_path}")
        model = YOLO(model_path)
        print("✓ Model loaded\n")
        
        # Display model classes
        print("Model Classes:")
        for class_id, class_name in model.names.items():
            print(f"  {class_id}: {class_name}")
        print()
        
        # Load and display image info
        print(f"📷 Loading image: {image_path}")
        img = Image.open(image_path)
        print(f"✓ Image loaded: {img.size[0]}x{img.size[1]} pixels\n")
        
        # Run inference
        print("🔍 Running inference...")
        import time
        start_time = time.time()
        
        results = model.predict(source=image_path, conf=0.7, verbose=False)
        
        end_time = time.time()
        inference_time = (end_time - start_time) * 1000  # ms
        
        print(f"✓ Inference complete in {inference_time:.0f}ms\n")
        
        # Display results
        print("-" * 60)
        print("CLASSIFICATION RESULTS")
        print("-" * 60)
        
        if results and results[0].probs is not None:
            result = results[0]
            probs = result.probs
            
            # Top prediction
            top1_index = probs.top1
            top1_conf = probs.top1conf.item()
            predicted_class = model.names[top1_index]
            
            print(f"\n🎯 Predicted Class: {predicted_class}")
            print(f"   Confidence: {top1_conf*100:.2f}%")
            print(f"   Inference Time: {inference_time:.0f}ms")
            
            # All class probabilities
            print("\n📊 All Class Probabilities:")
            print("-" * 60)
            
            # Sort by confidence
            class_probs = []
            for i, prob in enumerate(probs.data):
                class_probs.append((model.names[i], prob.item()))
            
            class_probs.sort(key=lambda x: x[1], reverse=True)
            
            for class_name, prob in class_probs:
                bar_length = int(prob * 40)
                bar = "█" * bar_length + "░" * (40 - bar_length)
                print(f"  {class_name:20s} {bar} {prob*100:5.2f}%")
            
            print("-" * 60)
            
            # JSON output for API
            print("\n📋 JSON Response (API Format):")
            print("-" * 60)
            import json
            response = {
                "predicted_class": predicted_class,
                "confidence": top1_conf,
                "inference_time_ms": int(inference_time),
                "model_version": "best.pt",
                "all_classes": {name: prob for name, prob in class_probs}
            }
            print(json.dumps(response, indent=2))
            print("-" * 60)
            
        else:
            print("\n❌ No classification results returned")
            print("This might not be a classification model")
        
        print("\n" + "=" * 60)
        print("✓ Test Complete!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    model_path = './models/best.pt'
    image_path = None
    
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
    
    if len(sys.argv) > 2:
        model_path = sys.argv[2]
    
    test_inference(model_path, image_path)
