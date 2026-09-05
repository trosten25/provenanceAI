"use client";
import React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function AnomalyCard({ isFlagged, deviationScore, threshold, studentName }) {
  return (
    <div
      className={`p-5 rounded-xl border flex items-start gap-4 transition shadow-sm ${
        isFlagged
          ? "bg-amber-50/60 border-accent text-primary"
          : "bg-emerald-50/50 border-emerald-300 text-emerald-950"
      }`}
    >
      <div className="shrink-0 mt-0.5">
        {isFlagged ? (
          <AlertCircle size={24} className="text-primary" />
        ) : (
          <CheckCircle2 size={24} className="text-emerald-600" />
        )}
      </div>
      <div>
        <h4 className="font-bold text-base tracking-tight">
          {isFlagged
            ? `Stylometric Delta Breach Detected: ${studentName}`
            : `Verified Cognitive Match: ${studentName}`}
        </h4>
        <p className="text-sm mt-1 text-slate-600 leading-relaxed">
          Vector divergence: <strong>{deviationScore.toFixed(2)}</strong> (System Threshold:{" "}
          <strong>{threshold.toFixed(2)}</strong>).{" "}
          {isFlagged
            ? "Lexical and syntax complexity deviate drastically from historical class essays."
            : "The cadence, vocabulary entropy, and parse tree depth match authenticated samples."}
        </p>
      </div>
    </div>
  );
}