"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StudentCombobox from "@/components/StudentCombobox";
import FileUploadZone from "@/components/FileUploadZone";
import { fetchStudents, fetchEligibleStudents, analyzeSubmission } from "@/lib/api";
import { Search, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";

export default function VerifyPage() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // 1. First try to load eligible students (>= 1 baseline)
        let data = await fetchEligibleStudents().catch(() => []);

        // 2. If none have baselines yet, load all registered students so professor can see them
        if (!data || data.length === 0) {
          data = await fetchStudents().catch(() => []);
        }

        setStudents(data || []);
        if (data && data.length > 0) {
          setSelectedStudentId(data[0].id);
        }
      } catch (err) {
        setErrorMsg("Failed to connect to backend server.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const hasNoBaseline = selectedStudent && (selectedStudent.baseline_count === 0 || selectedStudent.status === "Baseline Needed");

  const handleAudit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !text.trim() || hasNoBaseline) return;

    setIsEvaluating(true);
    setErrorMsg("");

    try {
      const data = await analyzeSubmission({
        studentId: selectedStudentId,
        title: title || "Term Paper Submission",
        text,
      });

      router.push(`/submissions/${data.submission_id}`);
    } catch (err) {
      setErrorMsg(err.message || "Stylometric evaluation failed.");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-primary">Assignment Authorship Verification</h1>
        <p className="text-sm text-slate-500 mt-1">
          Evaluate submitted assignments against authenticated longitudinal writing baselines.
        </p>
      </div>

      {isLoading ? (
        <div className="p-8 text-center flex flex-col items-center justify-center space-y-2">
          <Loader2 className="animate-spin text-secondary" size={24} />
          <span className="text-xs text-slate-400">Loading student roster...</span>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-amber-50 border border-accent p-6 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-primary font-bold">
            <AlertTriangle size={20} className="text-amber-600" />
            <span>No Registered Students</span>
          </div>
          <p className="text-sm text-slate-700">
            No students found in the database. Enroll students and ingest baselines first.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-bold text-primary bg-accent px-4 py-2 rounded-lg hover:opacity-90 transition"
          >
            <span>Go to Dashboard</span>
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

          {hasNoBaseline && (
            <div className="p-3.5 bg-amber-50 border border-accent rounded-lg flex items-center justify-between text-xs text-primary font-medium">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                <span>
                  <strong>{selectedStudent?.name}</strong> has no historical baseline uploaded.
                </span>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 text-primary font-bold underline hover:opacity-80 ml-2"
              >
                <span>Ingest Now</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          )}

          <StudentCombobox
            students={students}
            selectedId={selectedStudentId}
            onSelect={setSelectedStudentId}
          />

          <div>
            <label className="block text-sm font-semibold text-primary mb-1">Assignment Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Final Term Paper: Urban Geography"
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
            disabled={isEvaluating || !selectedStudentId || !text || hasNoBaseline}
            className="w-full bg-accent hover:opacity-90 text-primary font-extrabold py-3.5 rounded-lg flex items-center justify-center gap-2 shadow transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <Search size={18} />
            <span>{isEvaluating ? "Calculating Statistical Delta..." : "Scan for Ghostwriting / AI"}</span>
          </button>
        </form>
      )}
    </div>
  );
}