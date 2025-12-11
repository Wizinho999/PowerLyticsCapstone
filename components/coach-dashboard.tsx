"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { Users, Dumbbell, DollarSign, Trophy } from "lucide-react"

interface QuickStat {
  label: string
  value: string | number
  change: string
  trend: "up" | "down" | "neutral"
  icon: any
  color: string
}

export function CoachDashboard() {
  const [activeSection, setActiveSection] = useState("overview")
  const [coachName, setCoachName] = useState("Coach")
  const [coachId, setCoachId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [quickStats, setQuickStats] = useState<QuickStat[]>([
    { label: "Atletas Activos", value: 0, change: "+0", trend: "neutral", icon: Users, color: "" },
    { label: "Bloques Creados", value: 0, change: "+0", trend: "neutral", icon: Dumbbell, color: "" },
    { label: "Ingresos Mes", value: "$0", change: "+0%", trend: "neutral", icon: DollarSign, color: "" },
    { label: "Competiciones", value: 0, change: "+0", trend: "neutral", icon: Trophy, color: "" },
  ])
  const [recentActivity, setRecentActivity] = useState<any[]>([])

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

        await loadStatistics(user.id)

        setLoading(false)
      } catch (err) {
        console.error("Unexpected error:", err)
        setError("Error inesperado al cargar el dashboard")
        setLoading(false)
      }
    }

    getUserData()
  }, [supabase])

  const loadStatistics = async (coachId: string) => {
    try {
      const { count: athletesCount } = await supabase
        .from("athletes")
        .select("*", { count: "exact", head: true })
        .eq("coach_id", coachId)

      const { count: blocksCount } = await supabase
        .from("training_blocks")
        .select("*", { count: "exact", head: true })
        .eq("coach_id", coachId)

      const { count: competitionsCount } = await supabase
        .from("competitions")
        .select("*", { count: "exact", head: true })
        .eq("coach_id", coachId)

      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const prevMonth = new Date()
      prevMonth.setMonth(prevMonth.getMonth() - 1)
      prevMonth.setDate(1)
      const prevMonthEnd = new Date(startOfMonth)
      prevMonthEnd.setDate(0)

      const { count: prevBlocksCount } = await supabase
        .from("training_blocks")
        .select("*", { count: "exact", head: true })
        .eq("coach_id", coachId)
        .gte("created_at", prevMonth.toISOString())
        .lt("created_at", startOfMonth.toISOString())

      const summaryResponse = await fetch(`/api/athlete-billing?coachId=${coachId}&type=summary`)
      let monthIncome = 0
      let incomeDiff = 0

      if (summaryResponse.ok) {
        const { summary } = await summaryResponse.json()
        monthIncome = summary?.monthIncome || 0
        incomeDiff = summary?.incomeDiff || 0
      }

      const blocksDiff = (blocksCount || 0) - (prevBlocksCount || 0)
      const { data: recentBlocks } = await supabase
        .from("training_blocks")
        .select("*, profiles!training_blocks_athlete_id_fkey(full_name)")
        .eq("coach_id", coachId)
        .order("created_at", { ascending: false })
        .limit(5)

      setRecentActivity(recentBlocks || [])

      setQuickStats([
        {
          label: "Atletas Activos",
          value: athletesCount || 0,
          change: athletesCount && athletesCount > 0 ? `${athletesCount} total` : "Sin atletas",
          trend: "neutral",
          icon: Users,
          color: "",
        },
        {
          label: "Bloques Creados",
          value: blocksCount || 0,
          change:
            blocksDiff > 0 ? `+${blocksDiff} este mes` : blocksDiff < 0 ? `${blocksDiff} este mes` : "Sin cambios",
          trend: blocksDiff > 0 ? "up" : blocksDiff < 0 ? "down" : "neutral",
          icon: Dumbbell,
          color: "",
        },
        {
          label: "Ingresos Mes",
          value: `$${monthIncome.toLocaleString("es-CL")}`,
          change: incomeDiff !== 0 ? `${incomeDiff > 0 ? "+" : ""}${incomeDiff.toFixed(1)}%` : "Sin cambios",
          trend: incomeDiff > 0 ? "up" : incomeDiff < 0 ? "down" : "neutral",
          icon: DollarSign,
          color: "",
        },
        {
          label: "Competiciones",
          value: competitionsCount || 0,
          change:
            competitionsCount && competitionsCount > 0 ? `${competitionsCount} planificadas` : "Sin competiciones",
          trend: "neutral",
          icon: Trophy,
          color: "",
        },
      ])
    } catch (error) {
      console.error("Error loading statistics:", error)
    }
  }

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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickStats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <Card key={index} className="border-l-4 border-l-green-500">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                          <p className="text-3xl font-bold">{stat.value}</p>
                          {stat.change !== "Sin cambios" && (
                            <p className="text-sm text-muted-foreground mt-1">{stat.change}</p>
                          )}
                        </div>
                        <Icon className="h-10 w-10 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
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
