"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useApp } from "@/store/app-store";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import Breadcrumbs from "@/components/layout/breadcrumbs";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.replace("/login");
    }
  }, [currentUser, router]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Desktop Sidebar - Hidden on mobile */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto bg-muted/30">
            <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
              <Breadcrumbs />
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
