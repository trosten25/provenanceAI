"use client";
import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AnomalyCard from "@/components/AnomalyCard";
import StylometricRadar from "@/components/StylometricRadar";
import { ShieldAlert, ArrowRight } from "lucide-react";

export default function SubmissionDetailsPage() {
  const params = useParams();
  const id = params?.id || "demo";
  
  // Demonstrates anomaly handling when analyzing Raju's submission
  const isFlagged = String(id).includes("raju") || true;

  const metrics = [
    { feature: "Lexical Entropy", baseline: 58, current: isFlagged ? 94 : 62 },
    { feature: "Tree Depth", baseline: 42, current: isFlagged ? 89 : 45 },
    { feature: "Punctuation Cadence", baseline: 75, current: isFlagged ? 25 : 73 },
    { feature: "Passive Voice %", baseline: 20, current: isFlagged ? 80 : 22 },
    { feature: "Sentence Var", baseline: 50, current: isFlagged ? 86 : 52 },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <span className="text-xs font-bold text-secondary uppercase tracking-widest">
            Forensic Audit Record
          </span>
          <h1 className="text-2xl font-black text-primary">Assignment Stylometric Comparison</h1>
        </div>
        <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-mono">
          Ref ID: {id}
        </span>
      </div>

      <AnomalyCard
        isFlagged={isFlagged}
        deviationScore={isFlagged ? 0.82 : 0.12}
        threshold={0.45}
        studentName={isFlagged ? "Raju" : "Tom"}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StylometricRadar metrics={metrics} />

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-primary mb-2">
              Autonomous Claim Extraction
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              The Forensic Stylometry Agent flagged 2 anomalous claims exceeding the student's historical lexical capability:
            </p>
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs italic text-slate-700">
                "The epigenetic methylation cascade acts as an irreducible informational bottleneck in neural morphogenesis."
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs italic text-slate-700">
                "Epistemic foundationalism collapses when quantum measurement postulates govern conscious decision-making."
              </div>
            </div>
          </div>

          {isFlagged && (
            <Link
              href={`/interview/${id}`}
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