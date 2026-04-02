import pickle
from pathlib import Path
from typing import Any


class InjuryMLPredictor:
    def __init__(self):
        self.model: Any | None = None
        self.model_path: Path | None = None

    def load_model(self, path: str | Path):
        model_path = Path(path)
        self.model_path = model_path
        if not model_path.exists():
            self.model = None
            return None
        if model_path.suffix.lower() == ".onnx":
            try:
                import onnxruntime as ort
            except ImportError:
                self.model = None
                return None
            self.model = ort.InferenceSession(str(model_path))
            return self.model

        with model_path.open("rb") as handle:
            self.model = pickle.load(handle)
        return self.model

    def predict(self, feature_vector: dict) -> float:
        fallback_score = float(feature_vector.get("_fallback_score", 0.0))
        if self.model is None:
            return fallback_score

        filtered = {
            key: value
            for key, value in feature_vector.items()
            if not key.startswith("_")
        }

        if hasattr(self.model, "predict_proba"):
            return float(self.model.predict_proba([filtered])[0][1])

        if hasattr(self.model, "predict"):
            prediction = self.model.predict([filtered])[0]
            return float(prediction)

        try:
            input_name = self.model.get_inputs()[0].name
            output = self.model.run(None, {input_name: [list(filtered.values())]})
            return float(output[0][0][0])
        except Exception:
            return fallback_score
