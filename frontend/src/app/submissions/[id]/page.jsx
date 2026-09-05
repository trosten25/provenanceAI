"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AnomalyCard from "@/components/AnomalyCard";
import StylometricRadar from "@/components/StylometricRadar";
import { ShieldAlert, ArrowRight, Loader2, ArrowLeft } from "lucide-react";

export default function SubmissionDetailsPage() {
  const params = useParams();
  const id = params?.id;

  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAudit() {
      if (!id) return;
      try {
        const res = await fetch(`http://localhost:8000/api/v1/submissions/${id}`);
        if (!res.ok) throw new Error("Could not load submission audit record.");
        const data = await res.json();
        setAudit(data);
      } catch (err) {
        setError(err.message || "Failed to fetch audit data.");
      } finally {
        setLoading(false);
      }
    }
    fetchAudit();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="animate-spin text-secondary" size={32} />
        <p className="text-xs text-slate-500 font-semibold">Loading forensic audit record...</p>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-semibold">
          {error || "Submission record not found."}
        </div>
        <Link href="/verify" className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline">
          <ArrowLeft size={14} /> Return to Verification Audits
        </Link>
      </div>
    );
  }

  const { is_flagged, deviation_score, student_name, current_metrics, baseline_metrics, extracted_claims, session_token } = audit;

  // Normalize metrics to 0-100 scale for the radar chart
  const radarMetrics = [
    {
      feature: "Lexical Entropy",
      baseline: Math.min(100, Math.round((baseline_metrics?.entropy || 0) * 12)),
      current: Math.min(100, Math.round((current_metrics?.entropy || 0) * 12)),
    },
    {
      feature: "Vocabulary (TTR)",
      baseline: Math.min(100, Math.round(baseline_metrics?.ttr || 0)),
      current: Math.min(100, Math.round(current_metrics?.ttr || 0)),
    },
    {
      feature: "Avg Sentence Len",
      baseline: Math.min(100, Math.round((baseline_metrics?.avg_sentence_len || 0) * 2.5)),
      current: Math.min(100, Math.round((current_metrics?.avg_sentence_len || 0) * 2.5)),
    },
    {
      feature: "Sentence Var",
      baseline: Math.min(100, Math.round((baseline_metrics?.sentence_len_var || 0) * 1.5)),
      current: Math.min(100, Math.round((current_metrics?.sentence_len_var || 0) * 1.5)),
    },
    {
      feature: "Punctuation Rate",
      baseline: Math.min(100, Math.round(baseline_metrics?.punctuation_rate || 0)),
      current: Math.min(100, Math.round(current_metrics?.punctuation_rate || 0)),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <span className="text-xs font-bold text-secondary uppercase tracking-widest">
            Forensic Audit Record
          </span>
          <h1 className="text-2xl font-black text-primary">Assignment Stylometric Comparison</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Assignment: <span className="font-semibold text-slate-700">{audit.title}</span> • Roll No: {audit.roll_no}
          </p>
        </div>
        <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-mono">
          Ref ID: {String(id).slice(0, 8)}...
        </span>
      </div>

      <AnomalyCard
        isFlagged={is_flagged}
        deviationScore={deviation_score}
        threshold={0.35}
        studentName={student_name}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StylometricRadar metrics={radarMetrics} />

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-primary mb-2">
              Autonomous Claim Extraction
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              {is_flagged
                ? `The Forensic Stylometry Agent flagged anomalous claims exceeding ${student_name}'s historical lexical capability:`
                : `No stylometric divergence detected. The submission aligns with ${student_name}'s authenticated baseline.`}
            </p>

            {is_flagged && extracted_claims && extracted_claims.length > 0 ? (
              <div className="space-y-3">
                {extracted_claims.map((claim, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs italic text-slate-700">
                    &ldquo;{claim}&rdquo;
                  </div>
                ))}
              </div>
            ) : is_flagged ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs italic text-slate-700">
                &ldquo;Significant syntactical and entropy distribution breach relative to registered baseline samples.&rdquo;
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium">
                Document stylometry conforms to authenticated in-class writing fingerprints.
              </div>
            )}
          </div>

          {is_flagged && session_token && (
            <Link
              href={`/interview/${session_token}`}
              className="mt-6 w-full bg-primary hover:bg-slate-800 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition"
            >
              <ShieldAlert size={16} className="text-accent" />
              <span>Launch Socratic Comprehension Room</span>
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}