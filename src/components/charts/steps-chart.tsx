"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = {
  x: string;
  steps: number;
  ma7: number | null;
};

export default function StepsChart({ data }: { data: Point[] }) {
  return (
    <div className="h-64 rounded-[22px] bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(239,246,255,0.5))] p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" vertical={false} />
          <XAxis dataKey="x" tick={{ fontSize: 12, fill: "#94a3b8" }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={40} />
          <Tooltip
            contentStyle={{
              borderRadius: 16,
              border: "1px solid #bfdbfe",
              background: "rgba(255,255,255,0.95)",
              boxShadow: "0 16px 40px rgba(125, 211, 252, 0.14)",
            }}
          />
          <Bar dataKey="steps" name="歩数" fill="#7dd3fc" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-2 h-20">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="x" hide />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                borderRadius: 16,
                border: "1px solid #c7d2fe",
                background: "rgba(255,255,255,0.95)",
              }}
            />
            <Line
              type="monotone"
              dataKey="ma7"
              name="7日移動平均"
              stroke="#a78bfa"
              dot={false}
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
