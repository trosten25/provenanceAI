"use client";
import React, { useState } from "react";
import { UploadCloud, FileText } from "lucide-react";

export default function FileUploadZone({ onTextChange, textValue, placeholder }) {
  const [fileName, setFileName] = useState("");

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      onTextChange(event.target.result);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-3">
      <label className="border-2 border-dashed border-secondary/40 hover:border-secondary bg-slate-50 hover:bg-white rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition">
        <UploadCloud size={28} className="text-secondary mb-1" />
        <span className="text-xs font-semibold text-primary">
          {fileName ? fileName : "Upload .txt / .md draft or drop file here"}
        </span>
        <input
          type="file"
          accept=".txt,.md"
          className="hidden"
          onChange={handleFileUpload}
        />
      </label>

      <div className="relative">
        <div className="absolute top-2.5 right-3 text-slate-400">
          <FileText size={16} />
        </div>
        <textarea
          rows={7}
          value={textValue}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={placeholder || "Paste raw transcribed essay text here..."}
          className="w-full border border-slate-300 rounded-lg p-3 text-sm font-mono text-slate-800 bg-white focus:ring-2 focus:ring-secondary focus:outline-none transition"
        />
      </div>
    </div>
  );
}