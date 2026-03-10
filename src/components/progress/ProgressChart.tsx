"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>[];
  dataKey: string;
  label: string;
  color: string;
  unit: string;
  emptyMessage?: string;
  chartKey?: string;
};

type TooltipProps = {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
  label?: string;
  unit: string;
};

function ChartTooltip({ active, payload, label, unit }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-elevated border border-border-subtle rounded-lg shadow-md px-3 py-2 text-sm">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className="font-medium text-primary">
        {payload[0].value.toLocaleString()} {unit}
      </p>
    </div>
  );
}

// Muted tick color that works in both light and dark SVG context
const TICK_COLOR = "#9CA3AF";

export function ProgressChart({ data, dataKey, label, color, unit, emptyMessage, chartKey }: Props) {
  const isEmpty = data.length < 2;

  return (
    <div className="bg-surface border border-border-subtle rounded-xl p-4 sm:p-6">
      <p className="text-xs uppercase tracking-widest text-muted mb-4">{label}</p>

      {isEmpty ? (
        <div className="flex items-center justify-center h-[220px] sm:h-[280px]">
          <p className="text-sm text-muted text-center">
            {emptyMessage ?? "Log more sessions to see trends"}
          </p>
        </div>
      ) : (
        <div className="h-[220px] sm:h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart key={chartKey} data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid
              stroke="var(--c-border-subtle)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: TICK_COLOR, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: TICK_COLOR, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              content={(props) => (
                <ChartTooltip
                  active={props.active}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  payload={props.payload as any}
                  label={props.label as string | undefined}
                  unit={unit}
                />
              )}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: color }}
            />
          </LineChart>
        </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
