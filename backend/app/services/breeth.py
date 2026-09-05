import os
import httpx

BREETH_BASE_URL = os.getenv("BREETH_BASE_URL", "https://api.thebreeth.com/v1")
BREETH_API_KEY = os.getenv("BREETH_API_KEY", "")

class BreethMemoryClient:
    def __init__(self):
        self.headers = {
            "Authorization": f"Bearer {BREETH_API_KEY}",
            "Content-Type": "application/json",
        }

    async def log_baseline_episode(self, student_id: str, student_name: str, metrics: dict, sample_title: str):
        """Pushes an authenticated writing sample's metrics into the student's cognitive graph."""
        payload = {
            "entity_id": student_id,
            "entity_type": "student",
            "narrative": (
                f"Writing style sample for {student_name} from '{sample_title}'. "
                f"Lexical Entropy: {metrics['entropy']}, Type-Token Ratio: {metrics['ttr']}%, "
                f"Average Sentence Length: {metrics['avg_sentence_len']} words, "
                f"Sentence Length Variance: {metrics['sentence_len_var']}, "
                f"Punctuation Cadence: {metrics['punctuation_rate']} per 1000 words."
            ),
            "attributes": metrics,
            "extract_intent": True
        }
        async with httpx.AsyncClient() as client:
            try:
                res = await client.post(f"{BREETH_BASE_URL}/episodes", json=payload, headers=self.headers)
                return res.json() if res.status_code in [200, 201] else None
            except Exception:
                return None

    async def get_cognitive_profile(self, student_id: str) -> dict:
        """Retrieves aggregated stylometric memory and baseline bounds for a student."""
        async with httpx.AsyncClient() as client:
            try:
                res = await client.get(f"{BREETH_BASE_URL}/entities/{student_id}/profile", headers=self.headers)
                if res.status_code == 200:
                    return res.json()
            except Exception:
                pass
        return {}