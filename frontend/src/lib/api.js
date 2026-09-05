const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

//hi

export async function fetchStudents() {
  const res = await fetch(`${BASE_URL}/students`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load students");
  return res.json();
}

export async function fetchEligibleStudents() {
  const res = await fetch(`${BASE_URL}/students/eligible-for-audit`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load audit-eligible students");
  return res.json();
}

export async function createStudent({ name, roll_no, email }) {
  const res = await fetch(`${BASE_URL}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, roll_no, email }),
  });
  if (!res.ok) throw new Error("Failed to register student");
  return res.json();
}

export async function uploadBaseline({ studentId, title, text }) {
  const res = await fetch(`${BASE_URL}/baselines/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ student_id: studentId, title, text }),
  });
  if (!res.ok) throw new Error("Failed to ingest baseline");
  return res.json();
}

export async function analyzeSubmission({ studentId, title, text }) {
  const res = await fetch(`${BASE_URL}/submissions/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ student_id: studentId, title, text }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Analysis failed");
  }
  return res.json();
}

export async function sendInterviewResponse({ sessionToken, message }) {
  const res = await fetch(`${BASE_URL}/interviews/${sessionToken}/respond`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Interview response failed");
  }
  return res.json();
}