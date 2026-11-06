import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function AgeDistributionChart({ dentalAges, dentalTotal }) {
  return (
    <div
      role="img"
      aria-label={`Dental age distribution: ${dentalTotal} queues`}
      className="aspect-square w-full max-w-40 justify-self-center"
    >
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 160, height: 160 }}>
        <PieChart>
          <Pie
            data={dentalAges}
            cx="50%"
            cy="50%"
            innerRadius="58%"
            outerRadius="90%"
            paddingAngle={2}
            dataKey="value"
            isAnimationActive={false}
          >
            {dentalAges.map((row) => (
              <Cell key={row.name} fill={row.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(count) => [
              `${Number(count).toLocaleString()} queues`,
              "Count",
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PatientVolumeChart({ volumeTab, volumeData }) {
  return (
    <div
      role="img"
      aria-label={`${volumeTab} patient volume: ${volumeData.map((row) => `${row.label}: ${row.count}`).join(", ")}`}
      className="h-full min-w-0"
    >
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 250 }}>
        <BarChart
          data={volumeData}
          margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
        >
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            minTickGap={18}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#64748b" }}
            width={30}
          />
          <Tooltip
            cursor={{ fill: "#f1f5f9" }}
            contentStyle={{ fontSize: "12px", borderRadius: "8px" }}
            formatter={(count) => [
              `${Number(count).toLocaleString()} queues`,
              "Patient volume",
            ]}
          />
          <Bar
            dataKey="count"
            fill="#1e4db7"
            radius={[4, 4, 0, 0]}
            maxBarSize={54}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
