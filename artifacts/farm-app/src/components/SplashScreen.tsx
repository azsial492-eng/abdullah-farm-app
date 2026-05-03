import { motion } from "framer-motion";

export default function SplashScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-primary text-primary-foreground"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div />
      <motion.div
        className="text-center px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
      >
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-[0.18em] leading-tight drop-shadow-2xl font-serif uppercase">
          ABDULLAH PROTIEN FARM
        </h1>
      </motion.div>
      <motion.p
        className="pb-10 text-xs sm:text-sm tracking-[0.3em] uppercase text-primary-foreground/80"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
      >
        A PROJECT OF AL-NOOR DEVELOPERS
      </motion.p>
    </motion.div>
  );
}
