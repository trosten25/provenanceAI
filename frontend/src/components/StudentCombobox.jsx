"use client";
import React from "react";

export default function StudentCombobox({ students, selectedId, onSelect }) {
  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-primary mb-1">
        Select Target Student
      </label>
      <select
        value={selectedId}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full border border-slate-300 rounded-lg p-3 bg-white text-primary text-sm focus:ring-2 focus:ring-secondary focus:outline-none transition shadow-sm"
      >
        <option value="">-- Choose an enrolled student --</option>
        {students.map((student) => (
          <option key={student.id} value={student.id}>
            {student.name} ({student.samplesCount || 0} Baselines Ingested)
          </option>
        ))}
      </select>
    </div>
  );
}