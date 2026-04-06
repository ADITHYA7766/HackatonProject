"""
FastAPI server for multi-model YOLO waste detection.
Runs all custom YOLO models sequentially and returns the best match.
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2
import numpy as np
from typing import Dict, List, Optional

app = FastAPI(title="Waste Detection API")

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# 1. LOAD ALL MODELS
# -------------------------------
MODELS_DIR = ""  # Same directory as server.py

models = {
    "best1": YOLO(MODELS_DIR + "best1.pt"),      # Barrel detection
    "best2": YOLO(MODELS_DIR + "best2.pt"),      # Metal scrap
    "bestElectronics": YOLO(MODELS_DIR + "bestElectronics.pt"),  # Electronics
    "bestProtection": YOLO(MODELS_DIR + "bestProtection.pt"),    # PPE/Protection
    "bestPlastic": YOLO(MODELS_DIR + "bestPlastic.pt"),          # Plastic
    "bestWood": YOLO(MODELS_DIR + "bestWood.pt"),                # Wood
}

# Model to waste category mapping
MODEL_MAPPING = {
    "best1": {"category": "plastic", "suggested_title": "Industrial barrels / containers", "hazard_level": "medium"},
    "best2": {"category": "metal", "suggested_title": "Metal scrap / industrial waste", "hazard_level": "low"},
    "bestElectronics": {"category": "electronic", "suggested_title": "Electronic waste / e-waste", "hazard_level": "medium"},
    "bestProtection": {"category": "other", "suggested_title": "Protective equipment / industrial gear", "hazard_level": "low"},
    "bestPlastic": {"category": "plastic", "suggested_title": "Plastic waste / materials", "hazard_level": "low"},
    "bestWood": {"category": "organic", "suggested_title": "Wood / timber waste", "hazard_level": "none"},
}

CONF_THRESHOLD = 0.5


def run_single_model(model: YOLO, image: np.ndarray) -> Dict:
    """Run a single YOLO model and return detection stats."""
    results = model(image)

    detections = 0
    max_conf = 0.0
    detected_classes: List[str] = []

    for r in results:
        if r.boxes is None:
            continue

        for box in r.boxes:
            conf = float(box.conf[0])
            class_id = int(box.cls[0])
            class_name = r.names[class_id] if hasattr(r, 'names') and class_id in r.names else str(class_id)

            if conf > CONF_THRESHOLD:
                detections += 1
                max_conf = max(max_conf, conf)
                detected_classes.append(class_name)

    return {
        "detections": detections,
        "max_confidence": round(max_conf, 3),
        "classes": detected_classes
    }


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "models_loaded": list(models.keys()),
        "message": "Waste Detection API is running"
    }


@app.post("/detect")
async def detect_all_models(image: UploadFile = File(...)):
    """
    Run ALL YOLO models on the uploaded image and return the best match.
    Mimics the logic from Custom.py - tests image against all models.
    """
    try:
        # Read and decode image
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image file")

        # Run all models
        results_summary: Dict[str, Dict] = {}

        for name, model in models.items():
            result = run_single_model(model, image)
            results_summary[name] = result

        # Find best model (same logic as Custom.py)
        best_model = max(
            results_summary,
            key=lambda x: (
                results_summary[x]["detections"],
                results_summary[x]["max_confidence"]
            )
        )

        # Get multi-label detections (confidence > 0.6)
        multi_labels = [
            name for name, data in results_summary.items()
            if data["max_confidence"] > 0.6
        ]

        # Get best model's waste mapping
        best_mapping = MODEL_MAPPING[best_model]
        best_result = results_summary[best_model]

        # Build suggested description
        hazard_display = best_mapping["hazard_level"].capitalize() if best_mapping["hazard_level"] != "none" else "None"

        suggested_description = f"Listing Type: {best_mapping['suggested_title']}\nCategory: {best_mapping['category']}\nHazard Level: {hazard_display}"

        return {
            "success": True,
            "best_model": best_model,
            "category": best_mapping["category"],
            "suggested_title": best_mapping["suggested_title"],
            "hazard_level": best_mapping["hazard_level"],
            "confidence": best_result["max_confidence"],
            "detections": best_result["detections"],
            "suggested_description": suggested_description,
            "multi_labels": multi_labels,
            "all_results": results_summary
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")


@app.post("/detect/{model_name}")
async def detect_single_model(model_name: str, image: UploadFile = File(...)):
    """
    Run a specific YOLO model on the uploaded image.
    Use this for individual model testing.
    """
    if model_name not in models:
        raise HTTPException(
            status_code=404,
            detail=f"Model '{model_name}' not found. Available: {list(models.keys())}"
        )

    try:
        # Read and decode image
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image file")

        # Run the specific model
        result = run_single_model(models[model_name], image)

        # Add waste mapping
        mapping = MODEL_MAPPING.get(model_name, MODEL_MAPPING["best1"])

        return {
            "success": True,
            "model": model_name,
            "category": mapping["category"],
            "suggested_title": mapping["suggested_title"],
            "hazard_level": mapping["hazard_level"],
            "detections": result["detections"],
            "max_confidence": result["max_confidence"],
            "detected_classes": result["classes"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
