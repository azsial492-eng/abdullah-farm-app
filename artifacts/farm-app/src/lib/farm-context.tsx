// @refresh reset
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase, isConfigured } from "./supabase";

// ── Types ──────────────────────────────────────────────────────────────────────
export type Batch = {
  id: string;
  name: string;
  dateAdded: string;
  initialBirds: number;
  activeBirds: number;
  breed: string;
  ageWeeks: number;
};

export type EggProduction = {
  id: string;
  date: string;
  totalCollected: number;
  goodEggs: number;
  damagedEggs: number;
  traysPacked: number;
};

export type Transaction = {
  id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  date: string;
  notes: string;
};

export type HealthEvent = {
  id: string;
  batchId: string;
  vaccineName: string;
  date: string;
  status: "Completed" | "Upcoming" | "Overdue";
};

export type InventoryItem = {
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
  loading: boolean;
  dbError: string | null;
  configured: boolean;

  batches: Batch[];
  addBatch: (batch: Omit<Batch, "id">) => Promise<void>;
  updateMortality: (batchId: string, deadBirds: number) => Promise<void>;
  deleteBatch: (batchId: string) => Promise<void>;

  eggRecords: EggProduction[];
  addEggRecord: (record: Omit<EggProduction, "id">) => Promise<void>;

  feedStock: number;
  addFeed: (amount: number) => Promise<void>;
  consumeFeed: (amount: number) => Promise<void>;

  inventory: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, "id">) => Promise<void>;

  healthEvents: HealthEvent[];
  addHealthEvent: (event: Omit<HealthEvent, "id">) => Promise<void>;
  deleteHealthEvent: (id: string) => Promise<void>;

  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, "id">) => Promise<void>;

  workers: Worker[];
  addWorker: (w: Omit<Worker, "id">) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;
  updateWorkerWage: (id: string, dailyWage: number) => Promise<void>;
  attendance: AttendanceMap;
  setAttendance: (key: string, status: "present" | "absent" | "half") => Promise<void>;
};

// ── Row mappers ────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function mapBatch(r: Row): Batch {
  return {
    id: r.id,
    name: r.name,
    breed: r.breed,
    dateAdded: r.date_added,
    initialBirds: r.initial_birds,
    activeBirds: r.active_birds,
    ageWeeks: r.age_weeks ?? 0,
  };
}

function mapEgg(r: Row): EggProduction {
  const good = r.good_eggs ?? 0;
  const damaged = r.damaged_eggs ?? 0;
  return {
    id: r.id,
    date: r.date,
    goodEggs: good,
    damagedEggs: damaged,
    totalCollected: good + damaged,
    traysPacked: r.trays_packed ?? 0,
  };
}

function mapInventory(r: Row): InventoryItem {
  return {
    id: r.id,
    name: r.item_name,
    quantity: r.quantity,
    unit: r.unit ?? "Units",
    expiryDate: r.expiry_date ?? "",
    notes: r.notes ?? "",
  };
}

function mapHealth(r: Row): HealthEvent {
  return {
    id: r.id,
    batchId: r.batch_id,
    vaccineName: r.vaccine_name,
    date: r.scheduled_date,
    status: r.status as HealthEvent["status"],
  };
}

function mapTransaction(r: Row): Transaction {
  return {
    id: r.id,
    type: r.type as "income" | "expense",
    category: r.category,
    amount: Number(r.amount),
    date: r.date,
    notes: r.notes ?? "",
  };
}

function mapWorker(r: Row): Worker {
  return {
    id: r.id,
    name: r.name,
    role: r.role,
    dailyWage: Number(r.daily_wage),
  };
}

const WAGE_MULT: Record<"present" | "absent" | "half", number> = {
  present: 1, half: 0.5, absent: 0,
};

// ── Context ────────────────────────────────────────────────────────────────────
const FarmContext = createContext<FarmContextType | null>(null);

function getSupabase() {
  if (!supabase) throw new Error("Supabase client is not configured");
  return supabase;
}

const db = () => getSupabase();

export function FarmProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  const [batches, setBatches] = useState<Batch[]>([]);
  const [eggRecords, setEggRecords] = useState<EggProduction[]>([]);
  const [feedStock, setFeedStock] = useState<number>(0);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [healthEvents, setHealthEvents] = useState<HealthEvent[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendance, setAttendanceMap] = useState<AttendanceMap>({});

  // keep a ref so closures inside async functions always have fresh workers
  const workersRef = useRef<Worker[]>([]);
  workersRef.current = workers;

  // keep feedStock in a ref for the same reason
  const feedRef = useRef<number>(0);
  feedRef.current = feedStock;

  const reloadTimerRef = useRef<number | null>(null);

  const scheduleReload = () => {
    if (reloadTimerRef.current) window.clearTimeout(reloadTimerRef.current);
    reloadTimerRef.current = window.setTimeout(() => {
      loadAll();
    }, 250);
  };

  // ── Initial load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      setDbError("SETUP_REQUIRED");
      return;
    }
    loadAll();
  }, []);

  useEffect(() => {
    if (!isConfigured || !supabase) return;

    const channel = supabase
      .channel("farm-realtime-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "batches" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "egg_production" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "feed_stock" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "health_vaccination" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "finance_transactions" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "workers" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, scheduleReload)
      .subscribe();

    return () => {
      if (reloadTimerRef.current) {
        window.clearTimeout(reloadTimerRef.current);
        reloadTimerRef.current = null;
      }
      getSupabase().removeChannel(channel);
    };
  }, []);

  async function loadAll() {
    setLoading(true);
    setDbError(null);
    try {
      const [
        batchRes, eggRes, feedRes, invRes,
        healthRes, txRes, workerRes, attRes,
      ] = await Promise.all([
        db().from("batches").select("*").order("date_added"),
        db().from("egg_production").select("*").order("date", { ascending: false }),
        db().from("feed_stock").select("*").eq("id", 1).maybeSingle(),
        db().from("inventory").select("*").order("created_at"),
        db().from("health_vaccination").select("*").order("scheduled_date"),
        db().from("finance_transactions").select("*").order("date", { ascending: false }),
        db().from("workers").select("*").order("created_at"),
        db().from("attendance").select("*"),
      ]);

      if (batchRes.error) throw batchRes.error;
      if (eggRes.error) throw eggRes.error;
      if (invRes.error) throw invRes.error;
      if (healthRes.error) throw healthRes.error;
      if (txRes.error) throw txRes.error;
      if (workerRes.error) throw workerRes.error;
      if (attRes.error) throw attRes.error;

      setBatches((batchRes.data ?? []).map(mapBatch));
      setEggRecords((eggRes.data ?? []).map(mapEgg));
      setFeedStock(feedRes.data?.bags ?? 0);
      setInventory((invRes.data ?? []).map(mapInventory));
      setHealthEvents((healthRes.data ?? []).map(mapHealth));
      setTransactions((txRes.data ?? []).map(mapTransaction));
      setWorkers((workerRes.data ?? []).map(mapWorker));

      const attMap: AttendanceMap = {};
      (attRes.data ?? []).forEach((r: Row) => {
        attMap[`${r.worker_id}::${r.date}`] = r.status;
      });
      setAttendanceMap(attMap);
    } catch (err) {
      console.error("Supabase load error:", err);
      setDbError("Failed to load data. Please check your Supabase credentials.");
    } finally {
      setLoading(false);
    }
  }

  // ── Batches ───────────────────────────────────────────────────────────────────
  const addBatch = async (batch: Omit<Batch, "id">) => {
    const { data, error } = await db()
      .from("batches")
      .insert({
        name: batch.name,
        breed: batch.breed,
        initial_birds: batch.initialBirds,
        active_birds: batch.activeBirds,
        date_added: batch.dateAdded,
        age_weeks: batch.ageWeeks,
      })
      .select()
      .single();
    if (error) { console.error(error); return; }
    setBatches(prev => [...prev, mapBatch(data)]);
  };

  const updateMortality = async (batchId: string, deadBirds: number) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return;
    const newActive = batch.activeBirds - deadBirds;
    setBatches(prev => prev.map(b => b.id === batchId ? { ...b, activeBirds: newActive } : b));
    await db().from("batches").update({ active_birds: newActive }).eq("id", batchId);
  };

  const deleteBatch = async (batchId: string) => {
    setBatches(prev => prev.filter(b => b.id !== batchId));
    await db().from("batches").delete().eq("id", batchId);
  };

  // ── Egg Production ────────────────────────────────────────────────────────────
  const addEggRecord = async (record: Omit<EggProduction, "id">) => {
    const { data, error } = await db()
      .from("egg_production")
      .insert({
        date: record.date,
        good_eggs: record.goodEggs,
        damaged_eggs: record.damagedEggs,
        trays_packed: record.traysPacked,
      })
      .select()
      .single();
    if (error) { console.error(error); return; }
    setEggRecords(prev => [mapEgg(data), ...prev]);
  };

  // ── Feed ──────────────────────────────────────────────────────────────────────
  const addFeed = async (amount: number) => {
    const next = feedRef.current + amount;
    setFeedStock(next);
    await db().from("feed_stock").upsert({ id: 1, bags: next });
  };

  const consumeFeed = async (amount: number) => {
    const next = Math.max(0, feedRef.current - amount);
    setFeedStock(next);
    await db().from("feed_stock").upsert({ id: 1, bags: next });
  };

  // ── Inventory ─────────────────────────────────────────────────────────────────
  const addInventoryItem = async (item: Omit<InventoryItem, "id">) => {
    const { data, error } = await db()
      .from("inventory")
      .insert({
        item_name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        expiry_date: item.expiryDate || null,
        notes: item.notes,
      })
      .select()
      .single();
    if (error) { console.error(error); return; }
    setInventory(prev => [...prev, mapInventory(data)]);
  };

  // ── Health / Vaccination ──────────────────────────────────────────────────────
  const addHealthEvent = async (event: Omit<HealthEvent, "id">) => {
    const { data, error } = await db()
      .from("health_vaccination")
      .insert({
        batch_id: event.batchId,
        vaccine_name: event.vaccineName,
        scheduled_date: event.date,
        status: event.status,
      })
      .select()
      .single();
    if (error) { console.error(error); return; }
    setHealthEvents(prev => [...prev, mapHealth(data)]);
  };

  const deleteHealthEvent = async (id: string) => {
    setHealthEvents(prev => prev.filter(e => e.id !== id));
    await db().from("health_vaccination").delete().eq("id", id);
  };

  // ── Finance ───────────────────────────────────────────────────────────────────
  const addTransaction = async (tx: Omit<Transaction, "id">) => {
    const { data, error } = await db()
      .from("finance_transactions")
      .insert({
        type: tx.type,
        category: tx.category,
        amount: tx.amount,
        date: tx.date,
        notes: tx.notes,
      })
      .select()
      .single();
    if (error) { console.error(error); return; }
    setTransactions(prev => [mapTransaction(data), ...prev]);
  };

  // ── Workers ───────────────────────────────────────────────────────────────────
  const addWorker = async (w: Omit<Worker, "id">) => {
    const { data, error } = await db()
      .from("workers")
      .insert({ name: w.name, role: w.role, daily_wage: w.dailyWage })
      .select()
      .single();
    if (error) { console.error(error); return; }
    setWorkers(prev => [...prev, mapWorker(data)]);
  };

  const deleteWorker = async (id: string) => {
    setWorkers(prev => prev.filter(w => w.id !== id));
    await db().from("workers").delete().eq("id", id);
  };

  const updateWorkerWage = async (id: string, dailyWage: number) => {
    setWorkers(prev => prev.map(w => w.id === id ? { ...w, dailyWage } : w));
    await db().from("workers").update({ daily_wage: dailyWage }).eq("id", id);
  };

  // ── Attendance ────────────────────────────────────────────────────────────────
  const setAttendance = async (key: string, status: "present" | "absent" | "half") => {
    setAttendanceMap(prev => ({ ...prev, [key]: status }));
    const [workerId, date] = key.split("::");
    const worker = workersRef.current.find(w => w.id === workerId);
    const calculatedWage = worker ? worker.dailyWage * WAGE_MULT[status] : 0;
    await db().from("attendance").upsert(
      { worker_id: workerId, date, status, calculated_wage: calculatedWage },
      { onConflict: "worker_id,date" }
    );
  };

  return (
    <FarmContext.Provider value={{
      loading, dbError, configured: isConfigured,
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
