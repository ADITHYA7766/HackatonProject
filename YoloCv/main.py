from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2
import numpy as np
import base64
from typing import Dict, List

# -------------------------------
# 1. SETUP FASTAPI
# -------------------------------
app = FastAPI(title="YOLO Waste Detection API")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=False,  # must be False when using wildcard origin (browser CORS rules)
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# 2. LOAD ALL MODELS
# -------------------------------
MODELS_PATH = "./YOLO_Models"

models = {
    "wood": YOLO("bestWood.pt"),
    "plastic": YOLO("bestPlastic.pt"),
    "electronics": YOLO("bestElectronics.pt"),
    "ppe": YOLO("bestProtection.pt"),
    "MetalScrap": YOLO("best2.pt"),
    "Barrel": YOLO("best1.pt"),
}

# Map model names to frontend categories
MODEL_TO_CATEGORY = {
    "wood": "organic",
    "plastic": "plastic",
    "electronics": "electronic",
    "ppe": "other",
    "MetalScrap": "metal",
    "Barrel": "chemical",
}

# Map model names to suggested titles
MODEL_TO_TITLE = {
    "wood": "Wood/Waste Material",
    "plastic": "Plastic Waste Material",
    "electronics": "Electronic Waste/Components",
    "ppe": "Personal Protective Equipment",
    "MetalScrap": "Metal Scrap Material",
    "Barrel": "Barrel/Container",
}

CONF_THRESHOLD = 0.5


# -------------------------------
# 3. HELPER FUNCTIONS
# -------------------------------
def decode_image(image_bytes: bytes) -> np.ndarray:
    """Decode image bytes to OpenCV format"""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img


# -------------------------------
# 4. API ENDPOINTS
# -------------------------------
@app.get("/")
def read_root():
    return {"message": "YOLO Waste Detection API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "models_loaded": len(models)}


@app.post("/detect")
async def detect_waste(image: UploadFile = File(...)):
    """
    Detect waste type from uploaded image using all YOLO models.
    Returns the best matching category with confidence score.
    """
    try:
        # Read and decode image
        contents = await image.read()
        image_np = decode_image(contents)

        if image_np is None:
            raise HTTPException(status_code=400, detail="Invalid image file")

        # Run all models
        results_summary = {}

        for name, model in models.items():
            results = model(image_np)
            detections = 0
            max_conf = 0.0

            for r in results:
                if r.boxes is None:
                    continue
                for box in r.boxes:
                    conf = float(box.conf[0])
                    if conf > CONF_THRESHOLD:
                        detections += 1
                        max_conf = max(max_conf, conf)

            results_summary[name] = {
                "detections": detections,
                "max_confidence": round(max_conf, 3),
            }

        # Find best model using hybrid logic (detections + confidence)
        best_model = max(
            results_summary,
            key=lambda x: (
                results_summary[x]["detections"],
                results_summary[x]["max_confidence"],
            ),
        )

        best_confidence = results_summary[best_model]["max_confidence"]

        # Get multi-label detection (all models with confidence > 0.6)
        multi_labels = [
            name for name, data in results_summary.items()
            if data["max_confidence"] > 0.6
        ]

        # Map to frontend categories
        detected_category = MODEL_TO_CATEGORY.get(best_model, "other")
        suggested_title = MODEL_TO_TITLE.get(best_model, "Waste Material")

        # Determine hazard level based on category
        hazard_mapping = {
            "electronic": "medium",
            "chemical": "high",
            "metal": "low",
            "plastic": "low",
            "organic": "low",
            "other": "none",
        }
        suggested_hazard = hazard_mapping.get(detected_category, "none")

        return {
            "success": True,
            "best_match": best_model,
            "category": detected_category,
            "suggested_title": suggested_title,
            "hazard_level": suggested_hazard,
            "confidence": best_confidence,
            "all_detections": results_summary,
            "multi_labels": multi_labels,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/detect-base64")
async def detect_waste_base64(image_data: Dict[str, str]):
    """
    Detect waste type from base64 encoded image.
    Useful for direct frontend integration without file upload.
    """
    try:
        # Decode base64
        base64_str = image_data.get("image", "")
        if base64_str.startswith("data:image"):
            base64_str = base64_str.split(",")[1]

        image_bytes = base64.b64decode(base64_str)
        image_np = decode_image(image_bytes)

        if image_np is None:
            raise HTTPException(status_code=400, detail="Invalid image data")

        # Run all models
        results_summary = {}

        for name, model in models.items():
            results = model(image_np)
            detections = 0
            max_conf = 0.0

            for r in results:
                if r.boxes is None:
                    continue
                for box in r.boxes:
                    conf = float(box.conf[0])
                    if conf > CONF_THRESHOLD:
                        detections += 1
                        max_conf = max(max_conf, conf)

            results_summary[name] = {
                "detections": detections,
                "max_confidence": round(max_conf, 3),
            }

        # Find best model
        best_model = max(
            results_summary,
            key=lambda x: (
                results_summary[x]["detections"],
                results_summary[x]["max_confidence"],
            ),
        )

        best_confidence = results_summary[best_model]["max_confidence"]

        # Map to frontend categories
        detected_category = MODEL_TO_CATEGORY.get(best_model, "other")
        suggested_title = MODEL_TO_TITLE.get(best_model, "Waste Material")

        # Determine hazard level
        hazard_mapping = {
            "electronic": "medium",
            "chemical": "high",
            "metal": "low",
            "plastic": "low",
            "organic": "low",
            "other": "none",
        }
        suggested_hazard = hazard_mapping.get(detected_category, "none")

        return {
            "success": True,
            "best_match": best_model,
            "category": detected_category,
            "suggested_title": suggested_title,
            "hazard_level": suggested_hazard,
            "confidence": best_confidence,
            "all_detections": results_summary,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
