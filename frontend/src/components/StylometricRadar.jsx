"use client";
import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

export default function StylometricRadar({ metrics }) {
  return (
    <div className="w-full bg-white p-4 rounded-xl border border-slate-200">
      <h3 className="text-sm font-bold text-primary mb-2">
        Stylometric Metric Divergence
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={metrics}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis
              dataKey="feature"
              tick={{ fill: "#0D173B", fontSize: 11, fontWeight: 500 }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar
              name="Historical Baseline"
              dataKey="baseline"
              stroke="#0D173B"
              fill="#0D173B"
              fillOpacity={0.25}
            />
            <Radar
              name="Target Paper"
              dataKey="current"
              stroke="#4AB7E0"
              fill="#4AB7E0"
              fillOpacity={0.4}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-6 mt-2 text-xs font-semibold">
        <div className="flex items-center gap-2 text-primary">
          <span className="w-3 h-3 rounded-full bg-primary inline-block"></span> Baseline Memory
        </div>
        <div className="flex items-center gap-2 text-secondary">
          <span className="w-3 h-3 rounded-full bg-secondary inline-block"></span> Assignment Vector
        </div>
      </div>
    </div>
  );
}