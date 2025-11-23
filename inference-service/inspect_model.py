"""
Script to inspect the best.pt YOLO model and display its class names.
This helps verify what classes the model was trained on.
"""

import os
from ultralytics import YOLO

def inspect_model(model_path='./models/best.pt'):
    """
    Load and inspect the YOLO model to display class information.
    """
    print("=" * 60)
    print("YOLO Model Inspector")
    print("=" * 60)
    
    # Check if model exists
    if not os.path.exists(model_path):
        print(f"\n❌ ERROR: Model not found at {model_path}")
        print("\nPlease ensure your best.pt file is in the models/ directory")
        return
    
    try:
        # Load the model
        print(f"\n📦 Loading model from: {model_path}")
        model = YOLO(model_path)
        
        print("✓ Model loaded successfully!\n")
        
        # Display model information
        print("-" * 60)
        print("MODEL INFORMATION")
        print("-" * 60)
        
        # Get class names
        class_names = model.names
        num_classes = len(class_names)
        
        print(f"\nNumber of Classes: {num_classes}")
        print("\nClass Names (ID → Name):")
        print("-" * 60)
        
        for class_id, class_name in class_names.items():
            print(f"  {class_id:2d} → {class_name}")
        
        print("-" * 60)
        
        # Display as list for easy copying
        print("\nClass Names (List Format):")
        print("-" * 60)
        class_list = list(class_names.values())
        for i, name in enumerate(class_list, 1):
            print(f"  {i}. {name}")
        
        print("-" * 60)
        
        # Display for reference image setup
        print("\n📋 REFERENCE IMAGE SETUP")
        print("-" * 60)
        print("Create these folders in reference_images/:")
        print()
        for name in class_list:
            folder_name = name.replace(' ', '_').lower()
            print(f"  mkdir reference_images/{folder_name}")
        
        print("\n" + "-" * 60)
        
        # Display model metadata if available
        try:
            print("\n📊 MODEL METADATA")
            print("-" * 60)
            
            # Try to get model task
            if hasattr(model, 'task'):
                print(f"Task: {model.task}")
            
            # Try to get model type
            if hasattr(model, 'type'):
                print(f"Type: {model.type}")
                
            # Model file info
            file_size = os.path.getsize(model_path) / (1024 * 1024)  # MB
            print(f"File Size: {file_size:.2f} MB")
            
        except Exception as e:
            print(f"Could not retrieve metadata: {e}")
        
        print("-" * 60)
        
        # Export class names to JSON for easy integration
        import json
        output_file = 'model_classes.json'
        
        class_data = {
            'num_classes': num_classes,
            'class_names': class_list,
            'class_mapping': {str(k): v for k, v in class_names.items()}
        }
        
        with open(output_file, 'w') as f:
            json.dump(class_data, f, indent=2)
        
        print(f"\n✓ Class information exported to: {output_file}")
        
        print("\n" + "=" * 60)
        print("✓ Inspection Complete!")
        print("=" * 60)
        
        return class_names
        
    except Exception as e:
        print(f"\n❌ ERROR: Failed to load model")
        print(f"Error details: {str(e)}")
        print("\nPossible issues:")
        print("  1. Model file is corrupted")
        print("  2. Model is not a YOLO classification model")
        print("  3. Ultralytics version mismatch")
        return None

if __name__ == "__main__":
    # Check for model path argument
    import sys
    
    model_path = './models/best.pt'
    if len(sys.argv) > 1:
        model_path = sys.argv[1]
    
    inspect_model(model_path)
