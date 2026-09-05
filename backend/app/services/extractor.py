import math
import re
from collections import Counter

def extract_stylometric_features(text: str) -> dict:
    words = re.findall(r"\b\w+\b", text.lower())
    sentences = [s.strip() for s in re.split(r"[.!?]+", text) if s.strip()]
    
    if not words or not sentences:
        return {
            "entropy": 0.0,
            "avg_sentence_len": 0.0,
            "sentence_len_var": 0.0,
            "punctuation_rate": 0.0,
            "ttr": 0.0,
        }

    # 1. Shannon Entropy of Lexicon: H(X) = -sum(p * log2(p))
    counts = Counter(words)
    total_words = len(words)
    entropy = -sum((cnt / total_words) * math.log2(cnt / total_words) for cnt in counts.values())

    # 2. Sentence Length Variance
    lengths = [len(re.findall(r"\b\w+\b", s)) for s in sentences]
    avg_len = sum(lengths) / len(lengths)
    var_len = sum((l - avg_len) ** 2 for l in lengths) / len(lengths)

    # 3. Punctuation Cadence per 1000 words
    puncts = re.findall(r"[,;:—\-\(\)]", text)
    punct_rate = (len(puncts) / total_words) * 1000

    # 4. Type-Token Ratio (TTR)
    ttr = (len(counts) / total_words) * 100

    return {
        "entropy": round(entropy, 3),
        "avg_sentence_len": round(avg_len, 2),
        "sentence_len_var": round(var_len, 2),
        "punctuation_rate": round(punct_rate, 2),
        "ttr": round(ttr, 2),
    }