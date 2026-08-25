"""Cast / Sight FastAPI inference service: real MobileNetV2 checkpoint and Grad-CAM evidence."""
from io import BytesIO
from pathlib import Path
import base64
import json
import numpy as np
import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from torchvision import models, transforms
from torch import nn

ROOT = Path(__file__).resolve().parent.parent.parent.parent
MODEL_PATH = ROOT / "models" / "phase6_selected_model.pt"
METRICS = json.loads((ROOT / "results" / "phase4_complete_metrics.json").read_text())
app = FastAPI(title="Cast / Sight Inference API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
model = models.mobilenet_v2(weights=None)
model.classifier[1] = nn.Linear(model.last_channel, 2)
model.load_state_dict(torch.load(MODEL_PATH, map_location="cpu"))
model.eval()
transform = transforms.Compose([transforms.Resize((224, 224)), transforms.ToTensor(), transforms.Normalize([.485,.456,.406],[.229,.224,.225])])
activations, gradients = {}, {}
layer = model.features[-1]
layer.register_forward_hook(lambda _m, _i, o: activations.update(value=o))
layer.register_full_backward_hook(lambda _m, _gi, go: gradients.update(value=go[0]))


def make_gradcam(image: Image.Image, cls: int) -> str:
    model.zero_grad(); x = transform(image).unsqueeze(0); x.requires_grad_()
    output = model(x); output[0, cls].backward()
    a, g = activations["value"][0], gradients["value"][0]
    cam = torch.relu((g.mean((1, 2), keepdim=True) * a).sum(0)).detach().numpy()
    cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)
    heat = np.uint8(cam * 255); heat = Image.fromarray(heat).resize(image.size)
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(figsize=(4, 4), dpi=120); ax.imshow(image); ax.imshow(heat, cmap="jet", alpha=.45); ax.axis("off")
    buf = BytesIO(); fig.savefig(buf, format="jpeg", bbox_inches="tight", pad_inches=0); plt.close(fig)
    return base64.b64encode(buf.getvalue()).decode("ascii")


@app.get("/health")
def health():
    return {"status": "ok", "model": "MobileNetV2", "input_size": 224}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Upload a JPG, JPEG, or PNG image.")
    payload = await file.read()
    if len(payload) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image must be under 10 MB.")
    try:
        image = Image.open(BytesIO(payload)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=415, detail="The uploaded file is not a readable image.") from exc
    model.zero_grad(); output = model(transform(image).unsqueeze(0)); probs = output.softmax(1)[0]
    cls = int(output.argmax(1)); prediction = "Defective" if cls == 1 else "OK"
    return {"prediction": prediction, "confidence": float(probs[cls]), "defective_probability": float(probs[1]), "heatmap_base64": make_gradcam(image, cls), "model": {"name": "MobileNetV2 transfer-learning baseline", "input_size": 224, "roc_auc": METRICS["roc_auc"], "f1": METRICS["f1"]}}
