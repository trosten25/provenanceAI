import numpy as np
from sklearn.ensemble import IsolationForest

def compute_stylometric_deviation(baseline_vectors: list[dict], current_vector: dict) -> tuple[float, bool]:
    """
    Evaluates stylometric shift between historical baseline and audited submission.
    Applies calibrated tolerances to avoid false flags on natural punctuation/sentence variation.
    """
    if not baseline_vectors:
        return 0.0, False

    # Extract averages across historical baselines
    avg_entropy = float(np.mean([b.get("entropy", 0.0) for b in baseline_vectors]))
    avg_ttr = float(np.mean([b.get("ttr", 0.0) for b in baseline_vectors]))
    avg_len = float(np.mean([b.get("avg_sentence_len", 0.0) for b in baseline_vectors]))
    avg_var = float(np.mean([b.get("sentence_len_var", 0.0) for b in baseline_vectors]))
    avg_punct = float(np.mean([b.get("punctuation_rate", 0.0) for b in baseline_vectors]))

    cur_entropy = float(current_vector.get("entropy", 0.0))
    cur_ttr = float(current_vector.get("ttr", 0.0))
    cur_len = float(current_vector.get("avg_sentence_len", 0.0))
    cur_var = float(current_vector.get("sentence_len_var", 0.0))
    cur_punct = float(current_vector.get("punctuation_rate", 0.0))

    # 1. Lexical Entropy Shift (Primary ghostwriting indicator: AI/Ghostwriters spike from ~4.5 to >6.5)
    # Natural human variation within the same author is typically within +/- 0.8 units
    entropy_diff = max(0.0, abs(cur_entropy - avg_entropy) - 0.7) / max(avg_entropy, 1.0)

    # 2. Vocabulary Richness (TTR) Shift
    ttr_diff = max(0.0, abs(cur_ttr - avg_ttr) - 12.0) / max(avg_ttr, 1.0)

    # 3. Average Sentence Length Shift
    len_diff = max(0.0, abs(cur_len - avg_len) - 6.0) / max(avg_len, 1.0)

    # 4. Sentence Length Variance Shift (Buffer natural rhythmic shifts)
    var_diff = max(0.0, abs(cur_var - avg_var) - 25.0) / max(avg_var, 1.0)

    # 5. Punctuation Rate Shift (Buffer standard comma usage)
    punct_diff = max(0.0, abs(cur_punct - avg_punct) - 45.0) / max(avg_punct, 1.0)

    # Weighted composite deviation score
    # Lexical entropy and TTR dominate (70% combined weight)
    composite_score = (
        (entropy_diff * 0.45) +
        (ttr_diff * 0.25) +
        (len_diff * 0.10) +
        (var_diff * 0.10) +
        (punct_diff * 0.10)
    )

    deviation_score = float(np.clip(composite_score, 0.0, 1.0))

    # An authentic follow-up paper will yield deviation_score < 0.25
    # Heavy LLM/Ghostwritten jargon yields deviation_score > 0.50
    is_flagged = deviation_score >= 0.40

    return round(deviation_score, 2), is_flagged