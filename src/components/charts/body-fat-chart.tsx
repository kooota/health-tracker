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
  x: string;
  y: number;
};

export default function BodyFatChart({ data }: { data: Point[] }) {
  const values = data
    .map((p) => p.y)
    .filter((v) => typeof v === "number" && Number.isFinite(v));
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const range = max - min;
  const pad = Math.max(range * 0.12, 0.5);
  const domain: [number, number] = [min - pad, max + pad];

  return (
    <div className="h-64 rounded-[22px] bg-[linear-gradient(180deg,rgba(255,255,255,0.7),rgba(236,253,245,0.45))] p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#bbf7d0" vertical={false} />
          <XAxis
            dataKey="x"
            tick={{ fontSize: 12, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            domain={domain}
            tick={{ fontSize: 12, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(v) => `${Number(v).toFixed(1)}`}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 16,
              border: "1px solid #86efac",
              background: "rgba(255,255,255,0.95)",
              boxShadow: "0 16px 40px rgba(34, 197, 94, 0.10)",
            }}
          />
          <Line
            type="monotone"
            dataKey="y"
            name="体脂肪率(%)"
            stroke="#10b981"
            dot={{ r: 2, fill: "#ecfdf5", stroke: "#10b981", strokeWidth: 1.5 }}
            activeDot={{ r: 5, fill: "#10b981", stroke: "#ffffff", strokeWidth: 2 }}
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

