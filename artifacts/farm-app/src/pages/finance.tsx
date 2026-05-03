import { useFarmData } from "@/lib/farm-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { ArrowDownRight, ArrowUpRight, PlusCircle, Calculator, LogIn } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";

const DUMMY_TODAY = "2023-10-07";

export default function Finance() {
  const { transactions, addTransaction, eggRecords } = useFarmData();
  const [isOpen, setIsOpen] = useState(false);
  const [txType, setTxType] = useState<"income" | "expense">("income");

  // ── Price calculator state ──
  const [pricePerTray, setPricePerTray] = useState("450");
  const [calcTrays, setCalcTrays] = useState("");
  const [calcDate, setCalcDate] = useState(DUMMY_TODAY);

  const latestRecord = eggRecords[eggRecords.length - 1];
  const todayRecord = eggRecords.find((r) => r.date === DUMMY_TODAY) ?? latestRecord;

  const resolvedTrays = parseInt(calcTrays) || todayRecord?.traysPacked || 0;
  const resolvedPrice = parseFloat(pricePerTray) || 0;
  const estimatedRevenue = resolvedTrays * resolvedPrice;

  const handleLogRevenue = () => {
    if (estimatedRevenue > 0) {
      addTransaction({
        id: Math.random().toString(),
        type: "income",
        category: "Egg Sales",
        amount: estimatedRevenue,
        date: calcDate,
        notes: `${resolvedTrays} trays × PKR ${resolvedPrice.toLocaleString()} / tray`,
      });
    }
  };

  // ── Transaction form ──
  const handleAddTx = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addTransaction({
      id: Math.random().toString(),
      type: txType,
      category: formData.get("category") as string,
      amount: parseFloat(formData.get("amount") as string),
      date: formData.get("date") as string,
      notes: formData.get("notes") as string,
    });
    setIsOpen(false);
  };

  const totalIncome = useMemo(
    () => transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [transactions]
  );
  const totalExpense = useMemo(
    () => transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    [transactions]
  );
  const netProfit = totalIncome - totalExpense;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Finance</h2>
          <p className="text-muted-foreground mt-1">Track income, expenses, and profitability.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="btn-add-transaction">
              <PlusCircle className="w-4 h-4" /> Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Transaction</DialogTitle>
              <DialogDescription>Record an income or expense entry for the farm.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddTx} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 bg-muted p-1 rounded-md mb-4">
                <Button type="button" variant={txType === "income" ? "default" : "ghost"} onClick={() => setTxType("income")} className="w-full">Income</Button>
                <Button type="button" variant={txType === "expense" ? "default" : "ghost"} onClick={() => setTxType("expense")} className="w-full">Expense</Button>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select name="category" required defaultValue={txType === "income" ? "Egg Sales" : "Feed"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {txType === "income" ? (
                      <>
                        <SelectItem value="Egg Sales">Egg Sales</SelectItem>
                        <SelectItem value="Bird Sales">Bird Sales (Culls)</SelectItem>
                        <SelectItem value="Manure Sales">Manure Sales</SelectItem>
                        <SelectItem value="Other Income">Other</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="Feed">Feed</SelectItem>
                        <SelectItem value="Medicine">Medicine & Vaccines</SelectItem>
                        <SelectItem value="Labor">Labor</SelectItem>
                        <SelectItem value="Utilities">Utilities</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Other Expense">Other</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount (PKR)</Label>
                  <Input type="number" name="amount" required placeholder="0.00" min="0" step="0.01" data-testid="input-tx-amount" />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" name="date" required defaultValue={new Date().toISOString().split("T")[0]} data-testid="input-tx-date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input name="notes" placeholder="Optional details..." data-testid="input-tx-notes" />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full" data-testid="btn-save-transaction">Save Transaction</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Summary cards */}
      <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Total Income
              <ArrowUpRight className="w-4 h-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary" data-testid="stat-total-income">
              PKR {totalIncome.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Total Expenses
              <ArrowDownRight className="w-4 h-4 text-destructive" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="stat-total-expense">
              PKR {totalExpense.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className={`shadow-sm border-l-4 ${netProfit >= 0 ? "border-l-primary" : "border-l-destructive"}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit / Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? "text-primary" : "text-destructive"}`} data-testid="stat-net-profit">
              {netProfit >= 0 ? "+" : ""}PKR {netProfit.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Egg Sales Price Calculator ── */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-sm border-t-4 border-t-accent overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Calculator className="w-5 h-5 text-accent" />
              </div>
              <div>
                <CardTitle>Egg Sales Calculator</CardTitle>
                <CardDescription>Set your tray price and estimate daily egg revenue instantly.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              {/* Inputs */}
              <div className="space-y-2">
                <Label htmlFor="price-per-tray">Price per Tray (PKR)</Label>
                <Input
                  id="price-per-tray"
                  type="number"
                  min="0"
                  step="1"
                  value={pricePerTray}
                  onChange={(e) => setPricePerTray(e.target.value)}
                  placeholder="e.g. 450"
                  className="text-lg font-semibold"
                  data-testid="input-price-per-tray"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="calc-trays">
                  Trays to Sell
                  {todayRecord && (
                    <button
                      type="button"
                      onClick={() => setCalcTrays(String(todayRecord.traysPacked))}
                      className="ml-2 text-xs text-accent underline underline-offset-2 hover:text-accent/80 transition-colors"
                      data-testid="btn-use-todays-trays"
                    >
                      Use today's {todayRecord.traysPacked} trays
                    </button>
                  )}
                </Label>
                <Input
                  id="calc-trays"
                  type="number"
                  min="0"
                  value={calcTrays}
                  onChange={(e) => setCalcTrays(e.target.value)}
                  placeholder={todayRecord ? `Today: ${todayRecord.traysPacked} trays` : "Enter trays"}
                  className="text-lg font-semibold"
                  data-testid="input-calc-trays"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="calc-date">Sale Date</Label>
                <Input
                  id="calc-date"
                  type="date"
                  value={calcDate}
                  onChange={(e) => setCalcDate(e.target.value)}
                  data-testid="input-calc-date"
                />
              </div>
            </div>

            {/* Result display */}
            <div className="mt-6 p-5 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-xl border border-accent/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Estimated Revenue</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-foreground" data-testid="stat-estimated-revenue">
                    PKR {estimatedRevenue.toLocaleString()}
                  </span>
                </div>
                {resolvedTrays > 0 && resolvedPrice > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {resolvedTrays} trays × PKR {resolvedPrice.toLocaleString()} / tray
                  </p>
                )}
                {resolvedTrays === 0 && (
                  <p className="text-sm text-muted-foreground italic">Enter trays and price to calculate.</p>
                )}
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                {estimatedRevenue > 0 && (
                  <Badge className="bg-accent/15 text-accent border-accent/25 text-xs px-2 py-0.5">
                    Ready to log
                  </Badge>
                )}
                <Button
                  onClick={handleLogRevenue}
                  disabled={estimatedRevenue <= 0}
                  className="gap-2 shadow-sm"
                  data-testid="btn-log-revenue"
                >
                  <LogIn className="w-4 h-4" />
                  Log as Egg Sales Income
                </Button>
              </div>
            </div>

            {/* Quick price reference row */}
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Quick price:</span>
              {[350, 400, 450, 500, 550].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPricePerTray(String(p))}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${
                    pricePerTray === String(p)
                      ? "bg-accent text-white border-accent font-semibold"
                      : "border-border text-muted-foreground hover:border-accent hover:text-accent"
                  }`}
                  data-testid={`btn-quick-price-${p}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent transactions table */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.slice(0, 10).map((tx) => (
                  <TableRow key={tx.id} data-testid={`row-transaction-${tx.id}`}>
                    <TableCell className="font-medium whitespace-nowrap">{tx.date}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          tx.type === "income"
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-destructive/10 text-destructive border-destructive/20"
                        }`}
                      >
                        {tx.type === "income" ? "Income" : "Expense"}
                      </Badge>
                    </TableCell>
                    <TableCell>{tx.category}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[180px] truncate">
                      {tx.notes || "—"}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold whitespace-nowrap ${
                        tx.type === "income" ? "text-primary" : "text-destructive"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "−"} PKR {tx.amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No transactions recorded.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
