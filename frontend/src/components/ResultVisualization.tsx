import { BarChart3, LineChart as LineChartIcon, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getResultVisualization } from '../lib/resultVisualization';
import type { AssistantQueryResult } from '../types/assistant';

export function ResultVisualization({ result }: { result: AssistantQueryResult }) {
  const visualization = getResultVisualization(result);
  if (visualization.kind === 'none') return null;

  if (visualization.kind === 'kpi') {
    return (
      <section className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
          <TrendingUp size={18} className="text-blue-600" />
          <span>Result metric</span>
        </div>
        <p className="mt-4 text-4xl font-semibold tracking-tight text-blue-700">
          {formatMetric(visualization.value)}
        </p>
        <p className="mt-2 text-sm text-gray-500">
          {humanize(visualization.valueColumn)}
        </p>
      </section>
    );
  }

  const title = visualization.kind === 'line' ? 'Trend visualization' : 'Result visualization';
  const Icon = visualization.kind === 'line' ? LineChartIcon : BarChart3;
  const Chart = visualization.kind === 'line' ? LineChart : BarChart;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2">
        <Icon size={18} className="text-blue-600" />
        <h2 className="font-semibold text-gray-800">{title}</h2>
      </div>
      <p className="mt-2 text-sm text-gray-500">
        {humanize(visualization.valueColumn)} by {humanize(visualization.categoryColumn)}
      </p>
      <div className="mt-5 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <Chart data={visualization.data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
            <XAxis
              dataKey={visualization.categoryColumn}
              stroke="#9ca3af"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              allowDecimals
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              }}
              labelStyle={{ color: '#1f2937', fontWeight: 600 }}
              itemStyle={{ color: '#2563eb' }}
              formatter={(value) => [formatMetric(Number(value)), humanize(visualization.valueColumn)]}
            />
            {visualization.kind === 'line' ? (
              <Line
                type="monotone"
                dataKey={visualization.valueColumn}
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#3b82f6' }}
                activeDot={{ r: 5 }}
              />
            ) : (
              <Bar
                dataKey={visualization.valueColumn}
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            )}
          </Chart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function humanize(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatMetric(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}
