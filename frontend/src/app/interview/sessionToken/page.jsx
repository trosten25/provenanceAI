"use client";
import React from "react";
import { useParams } from "next/navigation";
import SocraticInterrogation from "@/components/SocraticInterrogation";
import { sendInterviewResponse } from "@/lib/api";

export default function InterviewSessionPage() {
  const params = useParams();
  const sessionToken = params?.sessionToken || "active-token";

  const initialPrompt =
    "In your submitted paper, you conclude that 'epigenetic methylation cascades act as irreducible informational bottlenecks.' Explain the mechanistic process supporting this conclusion without referencing external notes.";

  const handleSendReply = async (message) => {
    try {
      return await sendInterviewResponse({ sessionToken, message });
    } catch {
      // Mock continuation
      return {
        next_question:
          "Understood. How does this bottleneck interact with the subsequent neural morphogenesis claims made in section 3 of your assignment?",
      };
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="text-center mb-4">
        <h1 className="text-xl font-black text-primary">Student Verification Chamber</h1>
        <p className="text-xs text-slate-500">
          This session tests comprehension of anomalous statements to distinguish authentic authorship from ghostwritten submissions.
        </p>
      </div>

      <SocraticInterrogation
        initialPrompt={initialPrompt}
        onSendReply={handleSendReply}
      />
    </div>
  );
}