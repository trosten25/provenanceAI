import numpy as np
from sklearn.ensemble import IsolationForest

FEATURE_KEYS = ["entropy", "ttr", "avg_sentence_len", "sentence_len_var", "punctuation_rate"]

def compute_stylometric_deviation(baseline_vectors: list[dict], current_vector: dict) -> tuple[float, bool]:
    """
    Compares current 5D vector against historical baselines.
    Returns: (anomaly_score [0.0 - 1.0], is_flagged)
    """
    if not baseline_vectors:
        return 0.0, False

    X_train = np.array([[float(b.get(k, 0.0)) for k in FEATURE_KEYS] for b in baseline_vectors])
    x_test = np.array([float(current_vector.get(k, 0.0)) for k in FEATURE_KEYS])

    # Case 1: >= 3 samples -> Isolation Forest
    if len(baseline_vectors) >= 3:
        iso = IsolationForest(contamination=0.1, random_state=42)
        iso.fit(X_train)
        raw_score = iso.decision_function([x_test])[0]
        deviation_score = float(np.clip(0.5 - raw_score, 0.0, 1.0))
        is_flagged = bool(iso.predict([x_test])[0] == -1)
        return round(deviation_score, 2), is_flagged

    # Case 2: 1 or 2 baseline samples -> Calibrated Relative Shift
    mean_vec = np.mean(X_train, axis=0)

    # Relative percentage changes across the 5 dimensions
    rel_diffs = np.abs(x_test - mean_vec) / (np.maximum(mean_vec, 1.0))

    # Metric weights: Entropy (35%), Variance (25%), TTR (20%), Avg Len (10%), Punctuation (10%)
    weights = np.array([0.35, 0.20, 0.10, 0.25, 0.10])
    weighted_diff = float(np.dot(rel_diffs, weights))

    # Normalized deviation score: 0.0 means identical, 1.0 means extreme divergence
    deviation_score = float(np.clip(weighted_diff, 0.0, 1.0))
    is_flagged = deviation_score > 0.35

    return round(deviation_score, 2), is_flagged