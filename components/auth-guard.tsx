"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: "athlete" | "coach"
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setIsAuthenticated(true)
        setUserRole(user.user_metadata?.role || "athlete")
      } else {
        setIsAuthenticated(false)
        setUserRole(null)
      }
    }

    checkAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsAuthenticated(true)
        setUserRole(session.user.user_metadata?.role || "athlete")
      } else {
        setIsAuthenticated(false)
        setUserRole(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    if (isAuthenticated === false) {
      router.push("/")
      return
    }

    if (isAuthenticated && requiredRole && userRole !== requiredRole) {
      // Redirect to appropriate dashboard based on user role
      if (userRole === "coach") {
        router.push("/coach")
      } else {
        router.push("/dashboard")
      }
    }
  }, [isAuthenticated, userRole, requiredRole, router, pathname])

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated === false) {
    return null
  }

  return <>{children}</>
}
