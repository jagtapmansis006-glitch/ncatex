import React from "react";
import { BarChart3, PieChart as PieChartIcon } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  PieChart,
  Pie,
} from "recharts";

export interface TrackChartItem {
  name: string;
  fullName: string;
  count: number;
  fill: string;
}

export interface StatusChartItem {
  name: string;
  value: number;
  color: string;
}

interface AdminChartsProps {
  trackChartData: TrackChartItem[];
  statusChartData: StatusChartItem[];
  papersCount: number;
  isMounted: boolean;
}

export function AdminCharts({
  trackChartData,
  statusChartData,
  papersCount,
  isMounted,
}: AdminChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 1. Track Distribution Bar Chart (Recharts) */}
      <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0c0e14] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 size={18} className="text-teal-500" />
              <span>Submissions by Research Track</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live submission volume per technical discipline from Supabase
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
            {papersCount} Papers
          </span>
        </div>

        <div className="h-64 w-full">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trackChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262d3d" opacity={0.3} />
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#333f52" }}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#333f52" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f1117",
                    borderColor: "#1f2430",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#fff",
                  }}
                  cursor={{ fill: "rgba(20, 184, 166, 0.08)" }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {trackChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full grid place-items-center text-xs text-slate-400">
              Loading live charts...
            </div>
          )}
        </div>
      </div>

      {/* 2. Student Status & Progress Donut Chart (Recharts) */}
      <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-[#1f2430] bg-white dark:bg-[#0c0e14] p-6 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 mb-1">
            <PieChartIcon size={18} className="text-teal-500" />
            <span>Review Status Breakdown</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Acceptance and triage workflow progress
          </p>

          <div className="h-44 w-full">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`donut-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f1117",
                      borderColor: "#1f2430",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full grid place-items-center text-xs text-slate-400">
                Loading breakdown...
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 dark:border-white/5">
          {statusChartData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                {item.name}: <strong className="text-slate-900 dark:text-white font-mono">{item.value}</strong>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminCharts;
