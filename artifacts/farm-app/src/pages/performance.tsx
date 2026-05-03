import { useFarmData } from "@/lib/farm-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  Legend, Cell,
} from "recharts";
import { Badge } from "@/components/ui/badge";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(151 46% 42%)"];

function rate(v: number, total: number) {
  return total > 0 ? ((v / total) * 100).toFixed(1) : "0.0";
}

export default function Performance() {
  const { batches, eggRecords } = useFarmData();

  const totalBirds = batches.reduce((s, b) => s + b.activeBirds, 0);

  const batchStats = batches.map((b) => {
    const mortalityRate = (((b.initialBirds - b.activeBirds) / b.initialBirds) * 100).toFixed(2);
    const eggRate = totalBirds > 0
      ? ((b.activeBirds / totalBirds) * (eggRecords[eggRecords.length - 1]?.goodEggs ?? 0) / b.activeBirds * 100).toFixed(1)
      : "0.0";
    return {
      ...b,
      mortalityRate: parseFloat(mortalityRate),
      eggProductionRate: parseFloat(eggRate),
      totalMortality: b.initialBirds - b.activeBirds,
    };
  });

  const last7 = eggRecords.slice(-7);
  const avgGood = last7.length > 0 ? Math.round(last7.reduce((s, r) => s + r.goodEggs, 0) / last7.length) : 0;
  const avgDamaged = last7.length > 0 ? Math.round(last7.reduce((s, r) => s + r.damagedEggs, 0) / last7.length) : 0;
  const avgTrays = last7.length > 0 ? Math.round(last7.reduce((s, r) => s + r.traysPacked, 0) / last7.length) : 0;
  const damageRate = last7.length > 0
    ? rate(last7.reduce((s, r) => s + r.damagedEggs, 0), last7.reduce((s, r) => s + r.totalCollected, 0))
    : "0.0";

  const radarData = batchStats.map((b) => ({
    batch: b.name,
    "Egg Rate (%)": b.eggProductionRate,
    "Survival (%)": parseFloat(((b.activeBirds / b.initialBirds) * 100).toFixed(1)),
    "Age Score": Math.min(100, b.ageWeeks * 2),
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 24 } },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Batch Performance</h2>
          <p className="text-muted-foreground mt-1">Egg rate, mortality, and efficiency across all batches.</p>
        </div>
      </div>

      {/* KPI summary chips */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Avg Daily Good Eggs", value: avgGood.toLocaleString(), sub: "7-day average" },
          { label: "Avg Trays / Day", value: String(avgTrays), sub: "7-day average" },
          { label: "Avg Damaged Eggs", value: avgDamaged.toLocaleString(), sub: "7-day average" },
          { label: "Damage Rate", value: `${damageRate}%`, sub: "of total collected" },
        ].map((kpi) => (
          <Card key={kpi.label} className="shadow-sm border-t-2 border-t-primary">
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Per-batch comparison bar chart */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Mortality Rate by Batch
            </CardTitle>
            <CardDescription>Percentage of initial birds lost per batch since placement.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={batchStats} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} unit="%" />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  formatter={(val: number) => [`${val}%`, "Mortality Rate"]}
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                />
                <Bar dataKey="mortalityRate" name="Mortality Rate" radius={[6, 6, 0, 0]}>
                  {batchStats.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Radar comparison */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-sm h-full">
            <CardHeader>
              <CardTitle>Batch Radar Comparison</CardTitle>
              <CardDescription>Egg rate, survival %, and relative age score per batch.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="batch" tick={{ fontSize: 12 }} />
                  {["Egg Rate (%)", "Survival (%)", "Age Score"].map((key, i) => (
                    <Radar
                      key={key}
                      name={key}
                      dataKey={key}
                      stroke={COLORS[i % COLORS.length]}
                      fill={COLORS[i % COLORS.length]}
                      fillOpacity={0.18}
                    />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detailed stats table */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-sm h-full">
            <CardHeader>
              <CardTitle>Batch Scorecard</CardTitle>
              <CardDescription>Key efficiency metrics for each active batch.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {batchStats.map((b, i) => (
                <div key={b.id} className="p-4 rounded-xl border bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="font-semibold text-sm">{b.name}</span>
                      <span className="text-xs text-muted-foreground">— {b.breed}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {b.ageWeeks} wks old
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-white rounded-lg p-2 border">
                      <p className="text-lg font-bold text-foreground">{b.activeBirds.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Active Birds</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border">
                      <p className="text-lg font-bold text-destructive">{b.totalMortality}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Deaths</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border">
                      <p className={`text-lg font-bold ${b.mortalityRate > 3 ? "text-destructive" : "text-primary"}`}>
                        {b.mortalityRate}%
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Mortality Rate</p>
                    </div>
                  </div>
                  {/* Survival bar */}
                  <div>
                    <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                      <span>Survival rate</span>
                      <span className="font-semibold text-foreground">
                        {((b.activeBirds / b.initialBirds) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(b.activeBirds / b.initialBirds) * 100}%`,
                          backgroundColor: COLORS[i % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 7-day production detail */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>7-Day Egg Quality Breakdown</CardTitle>
            <CardDescription>Good vs damaged eggs for each of the last 7 recorded days.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => v.split("-").slice(1).join("/")}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="goodEggs" name="Good Eggs" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="damagedEggs" name="Damaged" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
