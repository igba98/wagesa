"use client";
import { useTheme } from "next-themes";
import { useApp } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SunIcon, MoonIcon, BellIcon } from "@heroicons/react/24/outline";
import { getRoleDisplayName } from "@/lib/roles";
import MobileSidebar from "./mobile-sidebar";

export default function Topbar() {
  const { theme, setTheme } = useTheme();
  const currentUser = useApp((s) => s.currentUser);

  if (!currentUser) return null;

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          {/* Mobile Menu */}
          <MobileSidebar />

          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold">
              Inventory & Movement System
            </h1>
            <p className="text-xs text-muted-foreground">
              Real-time tracking and management
            </p>
          </div>

          {/* Mobile Title - Shorter */}
          <div className="sm:hidden">
            <h1 className="text-base font-semibold">Wegesa</h1>
            <p className="text-xs text-muted-foreground">Inventory</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Notifications - Hidden on mobile */}
          <Button variant="ghost" size="sm" className="relative hidden sm:flex">
            <BellIcon className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive" />
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-9 w-9 p-0"
          >
            <SunIcon className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <MoonIcon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* User info */}
          <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-3 border-l">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium">{currentUser.name}</div>
              <Badge variant="secondary" className="text-xs">
                {getRoleDisplayName(currentUser.role)}
              </Badge>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {currentUser.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
