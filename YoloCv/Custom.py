from ultralytics import YOLO
import cv2

# -------------------------------
# 1. LOAD ALL MODELS
# -------------------------------
models = {
    "wood": YOLO("bestWood.pt"),
    "plastic": YOLO("bestPlastic.pt"),
    "electronics": YOLO("bestElectronics.pt"),
    "ppe": YOLO("bestProtection.pt"),
    "MetalScrap": YOLO("best2.pt"),
    "Barrel": YOLO("best1.pt")

}

# -------------------------------
# 2. INPUT IMAGE
# -------------------------------
image_path = "s2.jpg"   # change this
image = cv2.imread(image_path)

# -------------------------------
# 3. RUN ALL MODELS
# -------------------------------
results_summary = {}

CONF_THRESHOLD = 0.5

for name, model in models.items():
    results = model(image)

    detections = 0
    max_conf = 0

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
        "max_confidence": round(max_conf, 3)
    }

# -------------------------------
# 4. PRINT RESULTS
# -------------------------------
print("\n--- MODEL RESULTS ---")
for model_name, data in results_summary.items():
    print(f"{model_name.upper()} -> Detections: {data['detections']}, Max Conf: {data['max_confidence']}")

# -------------------------------
# 5. BEST MODEL (Hybrid Logic)
# -------------------------------
best_model = max(
    results_summary,
    key=lambda x: (
        results_summary[x]["detections"],
        results_summary[x]["max_confidence"]
    )
)

print("\n🏆 BEST MATCH:", best_model.upper())

# -------------------------------
# 6. MULTI-LABEL OUTPUT
# -------------------------------
multi_labels = [
    name for name, data in results_summary.items()
    if data["max_confidence"] > 0.6
]

print("\n📌 MULTI-LABEL DETECTION:", multi_labels)

# -------------------------------
# 7. (OPTIONAL) SHOW BEST MODEL OUTPUT
# -------------------------------
best_results = models[best_model](image)

annotated = best_results[0].plot()

cv2.imshow("Best Model Detection", annotated)
cv2.waitKey(0)
cv2.destroyAllWindows()