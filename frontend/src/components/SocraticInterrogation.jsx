"use client";
import React, { useState } from "react";
import { Send, Bot, User } from "lucide-react";

export default function SocraticInterrogation({ initialPrompt, onSendReply }) {
  const [messages, setMessages] = useState([
    { role: "agent", text: initialPrompt },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const response = await onSendReply(userMsg);
      setMessages((prev) => [
        ...prev,
        { role: "agent", text: response.next_question || response.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "agent", text: "Error recording defense response. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl flex flex-col h-[520px] shadow-sm">
      <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot size={20} className="text-primary" />
          <span className="font-bold text-sm text-primary">
            Cognitive Comprehension Interrogator
          </span>
        </div>
        <span className="text-xs bg-accent text-primary px-2.5 py-1 rounded-full font-bold">
          Live Verification
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2 ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {m.role === "agent" && (
              <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs shrink-0 mt-0.5">
                AI
              </div>
            )}
            <div
              className={`max-w-[78%] p-3.5 rounded-xl text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-secondary text-primary font-medium rounded-br-none"
                  : "bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-none"
              }`}
            >
              {m.text}
            </div>
            {m.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-secondary text-primary flex items-center justify-center text-xs shrink-0 mt-0.5">
                <User size={14} />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <p className="text-xs text-slate-400 italic">Interviewer is formulating rebuttal...</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Defend your argument and logical deductions..."
          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-secondary focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-primary hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition"
        >
          <span>Respond</span>
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}