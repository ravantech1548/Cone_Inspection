# Textile Cone Inspector - Inference Service

FastMCP-based inference service using custom YOLO best.pt model.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Place your `best.pt` model in the `models/` directory:
```bash
mkdir models
# Copy your best.pt file here
```

3. Create reference images directory structure:
```bash
mkdir -p reference_images/green
mkdir -p reference_images/brown
mkdir -p reference_images/striped
# Add your reference images to appropriate class folders
```

4. Configure environment:
```bash
cp .env.example .env
# Edit .env if needed
```

## Running the Service

### As MCP Server (for Kiro IDE integration)

Add to your Kiro MCP config (`.kiro/settings/mcp.json`):

```json
{
  "mcpServers": {
    "textile-inspector": {
      "command": "python",
      "args": ["-m", "mcp_server"],
      "cwd": "./inference-service",
      "env": {
        "MODEL_PATH": "./models/best.pt",
        "REFERENCE_IMAGES_DIR": "./reference_images"
      }
    }
  }
}
```

### As Standalone HTTP Service

```bash
python http_server.py
```

This starts an HTTP server on port 8000 that the Node.js backend can call.

## Available Tools

### classify_cone_tip
Classify a cone tip image from file path.

### classify_cone_tip_base64
Classify from base64 encoded image.

### list_reference_images
Get all reference images organized by class.

### match_against_references
Classify and find matching reference images.

### get_model_info
Get model metadata and available classes.

## Reference Images Structure

```
reference_images/
├── green/
│   ├── green_cone_1.jpg
│   ├── green_cone_2.jpg
│   └── ...
├── brown/
│   ├── brown_cone_1.jpg
│   └── ...
└── striped/
    ├── striped_cone_1.jpg
    └── ...
```

## Integration with Main App

The Node.js backend calls this service via HTTP or MCP protocol for inference.
