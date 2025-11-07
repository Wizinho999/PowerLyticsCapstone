"use client"

import { Button } from "@/components/ui/button"
import { Home, Calendar, Grid3X3, TrendingUp, LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface BottomNavigationProps {
  currentPage: "dashboard" | "calendar" | "blocks" | "stats"
}

export function BottomNavigation({ currentPage }: BottomNavigationProps) {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("powerlytics_user")
    router.push("/")
  }

  const navItems = [
    {
      icon: Home,
      href: "/dashboard",
      active: currentPage === "dashboard",
      color: "text-teal-500",
    },
    {
      icon: Calendar,
      href: "/calendar",
      active: currentPage === "calendar",
      color: "text-teal-500",
    },
    {
      icon: Grid3X3,
      href: "/blocks",
      active: currentPage === "blocks",
      color: "text-teal-500",
    },
    {
      icon: TrendingUp,
      href: "/stats",
      active: currentPage === "stats",
      color: "text-teal-500",
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border">
      <div className="flex justify-around py-3">
        {navItems.map((item, index) => (
          <Link key={index} href={item.href}>
            <Button variant="ghost" size="icon" className={item.active ? item.color : "text-muted-foreground"}>
              <item.icon className="h-5 w-5" />
            </Button>
          </Link>
        ))}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
