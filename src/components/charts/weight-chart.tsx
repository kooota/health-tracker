"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = {
  x: string; // label
  y: number;
  goal?: number | null;
};

export default function WeightChart({
  data,
}: {
  data: Point[];
}) {
  return (
    <div className="h-64 rounded-[22px] bg-[linear-gradient(180deg,rgba(255,255,255,0.7),rgba(253,242,248,0.5))] p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5d0e6" vertical={false} />
          <XAxis dataKey="x" tick={{ fontSize: 12, fill: "#94a3b8" }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={40} />
          <Tooltip
            contentStyle={{
              borderRadius: 16,
              border: "1px solid #fbcfe8",
              background: "rgba(255,255,255,0.95)",
              boxShadow: "0 16px 40px rgba(244, 114, 182, 0.12)",
            }}
          />
          <Line
            type="monotone"
            dataKey="y"
            name="体重(kg)"
            stroke="#fb7185"
            dot={{ r: 2, fill: "#fff1f2", stroke: "#fb7185", strokeWidth: 1.5 }}
            activeDot={{ r: 5, fill: "#fb7185", stroke: "#ffffff", strokeWidth: 2 }}
            strokeWidth={3}
          />
          <Line
            type="monotone"
            dataKey="goal"
            name="目標(kg)"
            stroke="#818cf8"
            dot={false}
            strokeWidth={2}
            strokeDasharray="6 6"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
