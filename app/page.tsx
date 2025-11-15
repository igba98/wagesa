"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

export default function SplashPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4 md:p-6">
      <div className="text-center space-y-6 md:space-y-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4">
            Wegesa
          </h1>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-medium text-muted-foreground">
            Event Co
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="space-y-4"
        >
          <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-lg mx-auto">
            Professional inventory and asset movement tracking system for event
            rentals
          </p>
          <p className="text-sm md:text-base text-muted-foreground/80">
            Manage materials, track rentals, and monitor movement between Boba
            and Mikocheni stores
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        >
          <Button
            size="lg"
            className="text-base md:text-lg px-6 md:px-8 py-4 md:py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={() => router.push("/login")}
          >
            Enter System
            <ArrowRightIcon className="ml-2 h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="text-xs text-muted-foreground/60"
        >
          Powered by modern technology for seamless operations
        </motion.div>
      </div>
    </div>
  );
}
