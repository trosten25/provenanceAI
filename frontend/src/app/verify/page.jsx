"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StudentCombobox from "@/components/StudentCombobox";
import FileUploadZone from "@/components/FileUploadZone";
import { fetchEligibleStudents, analyzeSubmission } from "@/lib/api";
import { Search, AlertCircle, ArrowRight } from "lucide-react";

export default function VerifyPage() {
  const router = useRouter();
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadEligible() {
      try {
        const data = await fetchEligibleStudents();
        setEligibleStudents(data);
        if (data.length > 0) {
          setSelectedStudentId(data[0].id);
        }
      } catch (err) {
        setErrorMsg("Unable to retrieve eligible student roster from backend.");
      }
    }
    loadEligible();
  }, []);

  const handleAudit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !text.trim()) return;
    setIsEvaluating(true);
    setErrorMsg("");

    try {
      const data = await analyzeSubmission({
        studentId: selectedStudentId,
        title: title || "Final Term Submission",
        text,
      });

      router.push(`/submissions/${data.submission_id}`);
    } catch (err) {
      setErrorMsg(err.message || "Failed to complete stylometric audit.");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-primary">Assignment Authorship Verification</h1>
        <p className="text-sm text-slate-500 mt-1">
          Only students with at least 1 ingested baseline can be evaluated for stylometric divergence[cite: 1].
        </p>
      </div>

      {eligibleStudents.length === 0 ? (
        <div className="bg-amber-50 border border-accent p-6 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-primary font-bold">
            <AlertCircle size={20} className="text-amber-600" />
            <span>No Eligible Students Found</span>
          </div>
          <p className="text-sm text-slate-700">
            No students currently have an authenticated baseline in the database. You must ingest at least one in-class draft before auditing assignments[cite: 1].
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-bold text-primary bg-accent px-4 py-2 rounded-lg hover:opacity-90 transition"
          >
            <span>Go to Dashboard & Ingest Baseline</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleAudit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {errorMsg}
            </div>
          )}

          <StudentCombobox
            students={eligibleStudents}
            selectedId={selectedStudentId}
            onSelect={setSelectedStudentId}
          />

          <div>
            <label className="block text-sm font-semibold text-primary mb-1">Assignment Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Final Paper: Quantum Computing"
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-secondary focus:outline-none"
            />
          </div>

          <FileUploadZone
            textValue={text}
            onTextChange={setText}
            placeholder="Paste student's final submitted document text..."
          />

          <button
            type="submit"
            disabled={isEvaluating || !selectedStudentId || !text}
            className="w-full bg-accent hover:opacity-90 text-primary font-extrabold py-3.5 rounded-lg flex items-center justify-center gap-2 shadow transition disabled:opacity-40"
          >
            <Search size={18} />
            <span>{isEvaluating ? "Calculating Statistical Delta..." : "Scan for Ghostwriting / AI"}</span>
          </button>
        </form>
      )}
    </div>
  );
}