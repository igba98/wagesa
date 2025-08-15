"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/store/app-store";
import { can } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import {
  HomeIcon,
  Squares2X2Icon,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const navigationItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: HomeIcon,
    description: "Overview and KPIs",
  },
  {
    href: "/inventory",
    label: "Inventory",
    icon: Squares2X2Icon,
    description: "Manage items and stock",
  },
  {
    href: "/movements",
    label: "Movements",
    icon: ArrowPathIcon,
    description: "Dispatches and rentals",
  },
  {
    href: "/reports",
    label: "Reports",
    icon: ChartBarIcon,
    description: "Analytics and exports",
  },
];

const adminItems = [
  {
    href: "/users",
    label: "Users",
    icon: UserGroupIcon,
    description: "User management",
    permission: "manageUsers" as const,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Cog6ToothIcon,
    description: "System configuration",
    permission: "manageSettings" as const,
  },
];

export default function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { currentUser, logout } = useApp();

  if (!currentUser) return null;

  const NavItem = ({
    href,
    label,
    icon: Icon,
    description,
    permission,
    onClick,
  }: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    permission?: keyof typeof can;
    onClick?: () => void;
  }) => {
    const isActive = pathname === href || pathname.startsWith(href + "/");

    // Check permissions if required
    if (permission && !can[permission](currentUser.role)) {
      return null;
    }

    return (
      <Link href={href} onClick={onClick}>
        <motion.div
          whileTap={{ scale: 0.98 }}
          className={`
            flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200
            ${
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }
          `}
        >
          <Icon className="h-5 w-5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="truncate">{label}</div>
            <div
              className={`text-xs truncate ${
                isActive
                  ? "text-primary-foreground/70"
                  : "text-muted-foreground/70"
              }`}
            >
              {description}
            </div>
          </div>
        </motion.div>
      </Link>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden h-10 w-10 p-0">
          <Bars3Icon className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <VisuallyHidden>
          <SheetTitle>Navigation Menu</SheetTitle>
        </VisuallyHidden>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-1"
              >
                <h2 className="text-lg font-semibold tracking-tight">Wagesa</h2>
                <p className="text-xs text-muted-foreground">
                  Inventory Management
                </p>
              </motion.div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 space-y-6 p-4">
            <nav className="space-y-1">
              {navigationItems.map((item) => (
                <NavItem
                  key={item.href}
                  {...item}
                  onClick={() => setIsOpen(false)}
                />
              ))}
            </nav>

            {adminItems.some(
              (item) =>
                !item.permission || can[item.permission](currentUser.role)
            ) && (
              <>
                <Separator />
                <nav className="space-y-1">
                  <div className="px-4 py-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Administration
                    </p>
                  </div>
                  {adminItems.map((item) => (
                    <NavItem
                      key={item.href}
                      {...item}
                      onClick={() => setIsOpen(false)}
                    />
                  ))}
                </nav>
              </>
            )}
          </div>

          {/* User info and logout */}
          <div className="border-t p-4 space-y-3">
            <div className="px-4 py-3 rounded-lg bg-muted/50">
              <div className="text-sm font-medium truncate">
                {currentUser.name}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {currentUser.email}
              </div>
              <div className="text-xs text-muted-foreground capitalize">
                {currentUser.role.replace("_", " ").toLowerCase()}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
