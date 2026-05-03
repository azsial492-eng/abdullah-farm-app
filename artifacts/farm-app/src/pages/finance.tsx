import { useFarmData } from "@/lib/farm-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export default function Finance() {
  const { transactions, addTransaction } = useFarmData();
  const [isOpen, setIsOpen] = useState(false);
  const [txType, setTxType] = useState<"income" | "expense">("income");

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

  const totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Finance</h2>
          <p className="text-muted-foreground mt-1">Track income, expenses, and profitability.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusCircle className="w-4 h-4" /> Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Transaction</DialogTitle>
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
                  <Input type="number" name="amount" required placeholder="0.00" min="0" step="0.01" />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Input name="notes" placeholder="Optional details..." />
              </div>

              <DialogFooter>
                <Button type="submit" className="w-full">Save Transaction</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Total Income
              <ArrowUpRight className="w-4 h-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">PKR {totalIncome.toLocaleString()}</div>
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
            <div className="text-2xl font-bold text-destructive">PKR {totalExpense.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className={`shadow-sm border-l-4 ${netProfit >= 0 ? "border-l-primary" : "border-l-destructive"}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? "text-primary" : "text-destructive"}`}>
              PKR {netProfit.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.slice(0, 10).map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium whitespace-nowrap">{tx.date}</TableCell>
                  <TableCell>{tx.category}</TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{tx.notes}</TableCell>
                  <TableCell className={`text-right font-medium whitespace-nowrap ${tx.type === 'income' ? 'text-primary' : 'text-destructive'}`}>
                    {tx.type === 'income' ? '+' : '-'} PKR {tx.amount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No transactions recorded.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
