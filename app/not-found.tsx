"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ExclamationTriangleIcon,
  HomeIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-6 max-w-md"
      >
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center"
          >
            <ExclamationTriangleIcon className="h-10 w-10 text-muted-foreground" />
          </motion.div>

          <div>
            <h1 className="text-6xl font-bold text-muted-foreground mb-2">
              404
            </h1>
            <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
            <p className="text-muted-foreground">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/dashboard">
                  <HomeIcon className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Link>
              </Button>

              <Button
                variant="outline"
                onClick={() => router.back()}
                className="w-full"
              >
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          If you believe this is an error, please contact support.
        </p>
      </motion.div>
    </div>
  );
}
