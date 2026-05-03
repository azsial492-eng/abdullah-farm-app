import { useFarmData } from "@/lib/farm-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bird, Egg, Package, CircleDollarSign, AlertTriangle, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function Dashboard() {
  const { batches, eggRecords, feedStock, transactions, healthEvents } = useFarmData();

  const totalBirds = batches.reduce((sum, b) => sum + b.activeBirds, 0);
  const todaysEggs = eggRecords[eggRecords.length - 1]?.totalCollected || 0;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayExpenses = transactions
    .filter(t => t.type === "expense" && t.date.startsWith("2023-10-07")) // dummy today
    .reduce((sum, t) => sum + t.amount, 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
          <p className="text-muted-foreground mt-1">Welcome back to Abdullah Protien Farm.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="transition-transform">
          <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Active Birds</CardTitle>
              <div className="p-2 bg-primary/10 rounded-full">
                <Bird className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalBirds.toLocaleString()}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="transition-transform">
          <Card className="border-l-4 border-l-accent shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today's Production</CardTitle>
              <div className="p-2 bg-accent/10 rounded-full">
                <Egg className="h-4 w-4 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{todaysEggs.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Eggs collected today</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="transition-transform">
          <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Remaining Feed</CardTitle>
              <div className="p-2 bg-amber-500/10 rounded-full">
                <Package className="h-4 w-4 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{feedStock} bags</div>
              {feedStock < 50 && <p className="text-xs text-destructive mt-1 font-medium">Low stock warning</p>}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="transition-transform">
          <Card className="border-l-4 border-l-destructive shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today's Expenses</CardTitle>
              <div className="p-2 bg-destructive/10 rounded-full">
                <CircleDollarSign className="h-4 w-4 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">PKR {todayExpenses.toLocaleString()}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <motion.div variants={itemVariants} className="md:col-span-4 lg:col-span-5">
          <Card className="h-full shadow-sm">
            <CardHeader>
              <CardTitle>7-Day Production Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eggRecords.slice(-7)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" tickFormatter={(val) => val.split('-').slice(1).join('/')} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="goodEggs" name="Good Eggs" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="damagedEggs" name="Damaged" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="md:col-span-3 lg:col-span-2">
          <Card className="h-full shadow-sm bg-muted/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Quick Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {feedStock < 50 && (
                <div className="flex items-start gap-3 p-3 bg-white dark:bg-card rounded-lg border border-amber-200 dark:border-amber-900 shadow-sm">
                  <Package className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-400">Low Feed Stock</h4>
                    <p className="text-xs text-muted-foreground mt-1">Only {feedStock} bags remaining. Restock soon.</p>
                  </div>
                </div>
              )}
              {healthEvents.filter(e => e.status === "Overdue" || e.status === "Upcoming").map(event => (
                <div key={event.id} className={`flex items-start gap-3 p-3 bg-white dark:bg-card rounded-lg border shadow-sm ${event.status === 'Overdue' ? 'border-destructive/30' : 'border-border'}`}>
                  <CalendarDays className={`w-5 h-5 mt-0.5 shrink-0 ${event.status === 'Overdue' ? 'text-destructive' : 'text-primary'}`} />
                  <div>
                    <h4 className={`text-sm font-semibold ${event.status === 'Overdue' ? 'text-destructive' : 'text-foreground'}`}>
                      Vaccination {event.status}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">Batch {batches.find(b=>b.id===event.batchId)?.name} - {event.vaccineName} ({event.date})</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
