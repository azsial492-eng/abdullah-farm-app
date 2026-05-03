// @refresh reset
import React, { createContext, useContext, useState } from "react";

type Batch = {
  id: string;
  name: string;
  dateAdded: string;
  initialBirds: number;
  activeBirds: number;
  breed: string;
  ageWeeks: number;
};

type EggProduction = {
  id: string;
  date: string;
  totalCollected: number;
  goodEggs: number;
  damagedEggs: number;
  traysPacked: number;
};

type Transaction = {
  id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  date: string;
  notes: string;
};

type HealthEvent = {
  id: string;
  batchId: string;
  vaccineName: string;
  date: string;
  status: "Completed" | "Upcoming" | "Overdue";
};

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  notes: string;
};

export type Worker = {
  id: string;
  name: string;
  role: string;
  dailyWage: number;
};

// key: "workerId::date" → "present" | "absent" | "half"
export type AttendanceMap = Record<string, "present" | "absent" | "half">;

type FarmContextType = {
  batches: Batch[];
  addBatch: (batch: Batch) => void;
  updateMortality: (batchId: string, deadBirds: number) => void;
  deleteBatch: (batchId: string) => void;

  eggRecords: EggProduction[];
  addEggRecord: (record: EggProduction) => void;

  feedStock: number;
  addFeed: (amount: number) => void;
  consumeFeed: (amount: number) => void;

  inventory: InventoryItem[];
  addInventoryItem: (item: InventoryItem) => void;

  healthEvents: HealthEvent[];
  addHealthEvent: (event: HealthEvent) => void;
  deleteHealthEvent: (id: string) => void;

  transactions: Transaction[];
  addTransaction: (tx: Transaction) => void;

  workers: Worker[];
  addWorker: (w: Worker) => void;
  deleteWorker: (id: string) => void;
  updateWorkerWage: (id: string, dailyWage: number) => void;
  attendance: AttendanceMap;
  setAttendance: (key: string, status: "present" | "absent" | "half") => void;
};

const FarmContext = createContext<FarmContextType | null>(null);

export function FarmProvider({ children }: { children: React.ReactNode }) {
  const [batches, setBatches] = useState<Batch[]>([
    { id: "1", name: "Batch A", dateAdded: "2023-01-15", initialBirds: 5000, activeBirds: 4850, breed: "Lohmann Brown", ageWeeks: 42 },
    { id: "2", name: "Batch B", dateAdded: "2023-05-20", initialBirds: 4000, activeBirds: 3910, breed: "Hy-Line Brown", ageWeeks: 24 },
    { id: "3", name: "Batch C", dateAdded: "2023-08-10", initialBirds: 3800, activeBirds: 3720, breed: "Lohmann Brown", ageWeeks: 12 },
  ]);

  const [eggRecords, setEggRecords] = useState<EggProduction[]>([
    { id: "1", date: "2023-10-01", totalCollected: 10800, goodEggs: 10650, damagedEggs: 150, traysPacked: 355 },
    { id: "2", date: "2023-10-02", totalCollected: 10850, goodEggs: 10710, damagedEggs: 140, traysPacked: 357 },
    { id: "3", date: "2023-10-03", totalCollected: 10920, goodEggs: 10800, damagedEggs: 120, traysPacked: 360 },
    { id: "4", date: "2023-10-04", totalCollected: 10780, goodEggs: 10620, damagedEggs: 160, traysPacked: 354 },
    { id: "5", date: "2023-10-05", totalCollected: 10890, goodEggs: 10740, damagedEggs: 150, traysPacked: 358 },
    { id: "6", date: "2023-10-06", totalCollected: 10950, goodEggs: 10830, damagedEggs: 120, traysPacked: 361 },
    { id: "7", date: "2023-10-07", totalCollected: 10850, goodEggs: 10700, damagedEggs: 150, traysPacked: 356 },
  ]);

  const [feedStock, setFeedStock] = useState<number>(48);

  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: "1", name: "Amoxicillin", quantity: 5, unit: "Bottles", expiryDate: "2024-06-15", notes: "Antibiotic" },
    { id: "2", name: "Multivitamin", quantity: 12, unit: "Packets", expiryDate: "2024-12-01", notes: "Daily supplement" },
  ]);

  const [healthEvents, setHealthEvents] = useState<HealthEvent[]>([
    { id: "1", batchId: "2", vaccineName: "Newcastle Disease", date: "2023-09-15", status: "Completed" },
    { id: "2", batchId: "3", vaccineName: "Fowl Pox", date: "2023-10-05", status: "Overdue" },
    { id: "3", batchId: "2", vaccineName: "Infectious Bronchitis", date: "2023-10-10", status: "Upcoming" },
  ]);

  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: "1", type: "income", category: "Egg Sales", amount: 150000, date: "2023-10-06", notes: "Wholesaler payment" },
    { id: "2", type: "expense", category: "Feed", amount: 45000, date: "2023-10-05", notes: "100 bags layer feed" },
    { id: "3", type: "expense", category: "Labor", amount: 24500, date: "2023-10-07", notes: "Weekly wages" },
  ]);

  const [workers, setWorkers] = useState<Worker[]>([
    { id: "w1", name: "Rashid Ali", role: "Egg Collector", dailyWage: 1200 },
    { id: "w2", name: "Imran Khan", role: "Feed Manager", dailyWage: 1500 },
    { id: "w3", name: "Saleem Akhtar", role: "Farm Guard", dailyWage: 1000 },
    { id: "w4", name: "Tariq Mehmood", role: "Cleaner", dailyWage: 900 },
  ]);

  // Pre-populate some attendance for dummy dates
  const [attendance, setAttendanceMap] = useState<AttendanceMap>({
    "w1::2023-10-07": "present",
    "w2::2023-10-07": "present",
    "w3::2023-10-07": "half",
    "w4::2023-10-07": "absent",
    "w1::2023-10-06": "present",
    "w2::2023-10-06": "present",
    "w3::2023-10-06": "present",
    "w4::2023-10-06": "present",
  });

  const addBatch = (batch: Batch) => setBatches(prev => [...prev, batch]);
  const updateMortality = (batchId: string, deadBirds: number) =>
    setBatches(prev => prev.map(b => b.id === batchId ? { ...b, activeBirds: b.activeBirds - deadBirds } : b));
  const deleteBatch = (batchId: string) => setBatches(prev => prev.filter(b => b.id !== batchId));

  const addEggRecord = (record: EggProduction) => setEggRecords(prev => [...prev, record]);

  const addFeed = (amount: number) => setFeedStock(prev => prev + amount);
  const consumeFeed = (amount: number) => setFeedStock(prev => prev - amount);

  const addInventoryItem = (item: InventoryItem) => setInventory(prev => [...prev, item]);

  const addHealthEvent = (event: HealthEvent) => setHealthEvents(prev => [...prev, event]);
  const deleteHealthEvent = (id: string) => setHealthEvents(prev => prev.filter(e => e.id !== id));

  const addTransaction = (tx: Transaction) => setTransactions(prev => [tx, ...prev]);

  const addWorker = (w: Worker) => setWorkers(prev => [...prev, w]);
  const deleteWorker = (id: string) => setWorkers(prev => prev.filter(w => w.id !== id));
  const updateWorkerWage = (id: string, dailyWage: number) =>
    setWorkers(prev => prev.map(w => w.id === id ? { ...w, dailyWage } : w));
  const setAttendance = (key: string, status: "present" | "absent" | "half") =>
    setAttendanceMap(prev => ({ ...prev, [key]: status }));

  return (
    <FarmContext.Provider value={{
      batches, addBatch, updateMortality, deleteBatch,
      eggRecords, addEggRecord,
      feedStock, addFeed, consumeFeed,
      inventory, addInventoryItem,
      healthEvents, addHealthEvent, deleteHealthEvent,
      transactions, addTransaction,
      workers, addWorker, deleteWorker, updateWorkerWage,
      attendance, setAttendance,
    }}>
      {children}
    </FarmContext.Provider>
  );
}

export function useFarmData() {
  const context = useContext(FarmContext);
  if (!context) throw new Error("useFarmData must be used within a FarmProvider");
  return context;
}
