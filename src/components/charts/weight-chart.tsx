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
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
          <XAxis dataKey="x" tick={{ fontSize: 12 }} minTickGap={24} />
          <YAxis tick={{ fontSize: 12 }} width={40} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="y"
            name="体重(kg)"
            stroke="#0f766e"
            dot={false}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="goal"
            name="目標(kg)"
            stroke="#f97316"
            dot={false}
            strokeWidth={2}
            strokeDasharray="6 6"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

