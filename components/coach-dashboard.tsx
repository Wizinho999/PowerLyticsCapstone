"use client"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { CoachAthleteManagement } from "@/components/coach-athlete-management"
import { CoachBlocksList } from "@/components/coach-blocks-list"
import { SubscriptionPlans } from "@/components/subscription-plans"
import { PerformanceAnalytics } from "@/components/performance-analytics"
import { SimpleBillingManagement } from "@/components/simple-billing-management"
import { CompetitionPlanning } from "@/components/competition-planning"

export function CoachDashboard() {
  const [activeSection, setActiveSection] = useState("overview")
  const [coachName, setCoachName] = useState("Coach")
  const [coachId, setCoachId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUserData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setError("No se encontró usuario")
          setLoading(false)
          return
        }

        setCoachId(user.id)

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError && profileError.code === "PGRST116") {
          const { error: profileInsertError } = await supabase.from("profiles").insert({
            id: user.id,
            email: user.email || "",
            full_name: user.user_metadata?.username || user.email?.split("@")[0] || "Coach",
            role: "coach",
          })

          if (profileInsertError) {
            console.error("Error creating profile:", profileInsertError)
            setError("Error al crear perfil de usuario")
            setLoading(false)
            return
          }
        } else if (profileError) {
          console.error("Error loading profile:", profileError)
          setError("Error al cargar perfil de usuario")
          setLoading(false)
          return
        }

        const { data: coachData, error: coachError } = await supabase
          .from("coaches")
          .select("*")
          .eq("id", user.id)
          .single()

        if (coachError && coachError.code === "PGRST116") {
          const { error: insertError } = await supabase.from("coaches").insert({
            id: user.id,
            business_name: user.user_metadata?.username || user.email?.split("@")[0] || "Coach",
            specialization: "Powerlifting",
            total_athletes: 0,
          })

          if (insertError) {
            console.error("Error creating coach record:", insertError)
            setError("Error al crear perfil de coach")
            setLoading(false)
            return
          }
        } else if (coachError) {
          console.error("Error loading coach data:", coachError)
          setError("Error al cargar datos del coach")
          setLoading(false)
          return
        }

        const displayName = user.user_metadata?.username || user.email?.split("@")[0] || "Coach"
        setCoachName(displayName)

        const { data: subData } = await supabase
          .from("coach_subscriptions")
          .select("*")
          .eq("coach_id", user.id)
          .eq("status", "active")
          .single()

        setSubscription(subData)
        setLoading(false)
      } catch (err) {
        console.error("Unexpected error:", err)
        setError("Error inesperado al cargar el dashboard")
        setLoading(false)
      }
    }

    getUserData()
  }, [supabase])

  const handleSelectPlan = async (planId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        alert("Debes iniciar sesión para continuar")
        return
      }

      const response = await fetch("/api/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId, userId: user.id }),
      })

      if (!response.ok) {
        throw new Error("Failed to create subscription")
      }

      const { initPoint } = await response.json()

      if (initPoint) {
        window.location.href = initPoint
      }
    } catch (error) {
      console.error("Error creating subscription:", error)
      alert("Error al procesar el pago. Por favor intenta de nuevo.")
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const menuItems = [
    { id: "overview", label: "Resumen" },
    { id: "blocks", label: "Crear Bloques" },
    { id: "analytics", label: "Analizar Rendimiento" },
    { id: "billing", label: "Gestionar Facturación" },
    { id: "competitions", label: "Planificar Competiciones" },
    { id: "athletes", label: "Gestionar Atletas" },
    { id: "subscription", label: "Suscripción" },
  ]

  const quickStats = [
    { label: "Atletas Activos", value: "0", change: "+0" },
    { label: "Bloques Creados", value: "0", change: "+0" },
    { label: "Ingresos Mes", value: "$0", change: "+0%" },
    { label: "Competiciones", value: "0", change: "+0" },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.push("/")} variant="outline">
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Bienvenido, {coachName}</h2>
              <p className="text-muted-foreground">Aquí tienes un resumen de tu actividad reciente</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickStats.map((stat, index) => (
                <Card key={index} className="bg-white border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {stat.change}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card
                className="bg-white border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setActiveSection("blocks")}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3">
                    <span>Crear Bloques de Entrenamiento</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">• Determina los protocolos</p>
                  <p className="text-sm text-muted-foreground">• Organiza los bloques por semanas</p>
                  <p className="text-sm text-muted-foreground">• Importa entrenamientos de la librería</p>
                  <p className="text-sm text-muted-foreground">• Copia bloques entre atletas</p>
                </CardContent>
              </Card>

              <Card
                className="bg-white border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setActiveSection("analytics")}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3">
                    <span>Analizar Rendimiento</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">• Observa gráficos del 1RM estimado</p>
                  <p className="text-sm text-muted-foreground">• Tonelaje, Stress Index, NL</p>
                  <p className="text-sm text-muted-foreground">• Obtén un resumen de cada bloque</p>
                </CardContent>
              </Card>

              <Card
                className="bg-white border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setActiveSection("billing")}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3">
                    <span>Gestionar Facturación</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">• Registra las cuotas de tus clientes</p>
                  <p className="text-sm text-muted-foreground">• Control de pagos y vencimientos</p>
                </CardContent>
              </Card>

              <Card
                className="bg-white border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setActiveSection("competitions")}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3">
                    <span>Planificar Competiciones</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">• Selecciona los atletas que compiten</p>
                  <p className="text-sm text-muted-foreground">• Determina el gameplan para cada atleta</p>
                </CardContent>
              </Card>

              <Card
                className="bg-white border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setActiveSection("athletes")}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3">
                    <span>Gestionar Atletas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">• Administra perfiles completos</p>
                  <p className="text-sm text-muted-foreground">• Seguimiento de progreso</p>
                  <p className="text-sm text-muted-foreground">• Gestión integral</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case "blocks":
        return <CoachBlocksList />

      case "subscription":
        return <SubscriptionPlans currentPlan={subscription?.plan_name} onSelectPlan={handleSelectPlan} />

      case "analytics":
        return <PerformanceAnalytics coachId={coachId} />

      case "billing":
        return <SimpleBillingManagement coachId={coachId} />

      case "competitions":
        return <CompetitionPlanning />

      case "athletes":
        return <CoachAthleteManagement />

      default:
        return null
    }
  }

  const getPlanName = (planId: string) => {
    const plans: Record<string, string> = {
      inicial: "Inicial",
      basico: "Básico",
      profesional: "Profesional",
      avanzado: "Avanzado",
      ilimitado: "Ilimitado",
    }
    return plans[planId] || "Free"
  }

  const getAthleteLimit = (planId: string) => {
    const limits: Record<string, string> = {
      inicial: "5",
      basico: "15",
      profesional: "30",
      avanzado: "50",
      ilimitado: "Ilimitado",
    }
    return limits[planId] || "0"
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-foreground">PowerLytics</h1>
          <p className="text-sm text-muted-foreground">Panel Coach</p>
        </div>

        <nav className="px-4 space-y-2 flex-1">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "default" : "ghost"}
              className={`w-full justify-start gap-3 px-3 py-2 ${
                activeSection === item.id
                  ? "bg-green-100 text-green-800 hover:bg-blue-100 hover:text-blue-800"
                  : "hover:bg-blue-100 hover:text-blue-800"
              }`}
              onClick={() => setActiveSection(item.id)}
            >
              <span className="text-sm">{item.label}</span>
            </Button>
          ))}
        </nav>

        <div className="p-4 space-y-3 mt-auto">
          {subscription ? (
            <Card className="bg-accent/10 border-accent/20">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2">Plan Actual</p>
                <p className="font-semibold text-sm">{getPlanName(subscription.plan_name)}</p>
                <Badge variant="secondary" className="mt-2 text-xs">
                  Hasta {getAthleteLimit(subscription.plan_name)} atletas
                </Badge>
              </CardContent>
            </Card>
          ) : (
            <Button variant="default" className="w-full" onClick={() => setActiveSection("subscription")}>
              Elegir Plan
            </Button>
          )}
          <Button variant="outline" className="w-full bg-transparent" onClick={handleLogout}>
            Cerrar Sesión
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6">{renderSection()}</div>
    </div>
  )
}
