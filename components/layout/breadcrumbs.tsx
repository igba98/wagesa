"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { HomeIcon } from "@heroicons/react/24/outline";

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  inventory: "Inventory",
  movements: "Movements",
  reports: "Reports",
  users: "Users",
  settings: "Settings",
  new: "New",
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0 || segments[0] === "login") {
    return null;
  }

  // Build breadcrumb items with guaranteed unique keys
  const breadcrumbItems = [];

  // Handle different cases
  if (segments.length === 1 && segments[0] === "dashboard") {
    // On dashboard page - just show Dashboard
    breadcrumbItems.push({
      id: "dashboard-only",
      href: "/dashboard",
      label: "Dashboard",
      isHome: true,
    });
  } else {
    // On other pages - show Home > Current Path
    breadcrumbItems.push({
      id: "home",
      href: "/dashboard",
      label: "Home",
      isHome: true,
    });

    // Add current path segments
    segments.forEach((segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/");
      const label =
        routeLabels[segment] ||
        segment.charAt(0).toUpperCase() + segment.slice(1);
      breadcrumbItems.push({
        id: `segment-${index}-${segment}`,
        href,
        label,
        isHome: false,
      });
    });
  }

  const filteredItems = breadcrumbItems;

  return (
    <Breadcrumb className="mb-4 md:mb-6">
      <BreadcrumbList className="flex-wrap">
        {filteredItems.map((item, index) => (
          <div key={item.id} className="flex items-center">
            {index > 0 && <BreadcrumbSeparator className="mx-1 md:mx-2" />}
            <BreadcrumbItem>
              {index === filteredItems.length - 1 ? (
                <BreadcrumbPage className="flex items-center gap-1 md:gap-1.5 text-sm md:text-base">
                  {item.isHome && (
                    <HomeIcon className="h-3 w-3 md:h-4 md:w-4" />
                  )}
                  <span className="truncate max-w-[120px] md:max-w-none">
                    {item.label}
                  </span>
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link
                    href={item.href}
                    className="flex items-center gap-1 md:gap-1.5 hover:text-foreground text-sm md:text-base"
                  >
                    {item.isHome && (
                      <HomeIcon className="h-3 w-3 md:h-4 md:w-4" />
                    )}
                    <span className="truncate max-w-[80px] md:max-w-none">
                      {item.label}
                    </span>
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
