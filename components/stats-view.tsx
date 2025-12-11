"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BottomNavigation } from "@/components/bottom-navigation"
import { useState, useEffect } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip as ChartTooltip,
  BarChart,
  Bar,
} from "recharts"
import { createClient } from "@/lib/supabase/client"
import { LoadingLogo } from "@/components/loading-logo"
import { TooltipProvider } from "@/components/ui/tooltip"
import { CollapsibleInfoCard } from "@/components/collapsible-info-card"

const tabs = [
  { id: "exercises", label: "Básico" },
  { id: "weight", label: "Peso corporal" },
  { id: "trac", label: "Trac" },
]

const BASIC_EXERCISES = {
  squat: ["Squat", "Sentadilla", "Back Squat", "Front Squat", "Squat Low Bar"],
  bench: ["Bench Press", "BP", "Bench", "Press Banca"],
  deadlift: ["Deadlift", "DL", "Peso Muerto"],
}

export function StatsView() {
  const [activeTab, setActiveTab] = useState("exercises")
  const [selectedTimeRange, setSelectedTimeRange] = useState("3M")
  const [selectedExercise, setSelectedExercise] = useState<string>("squat")
  const [isLoading, setIsLoading] = useState(true)
  const [exerciseData, setExerciseData] = useState<any[]>([])
  const [weightData, setWeightData] = useState<any[]>([])
  const [tracData, setTracData] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    loadUser()
  }, [supabase])

  useEffect(() => {
    if (!userId) return

    const loadExerciseData = async () => {
      setIsLoading(true)

      // Calculate date range
      const now = new Date()
      const startDate = new Date(now)

      switch (selectedTimeRange) {
        case "1M":
          startDate.setMonth(now.getMonth() - 1)
          break
        case "3M":
          startDate.setMonth(now.getMonth() - 3)
          break
        case "6M":
          startDate.setMonth(now.getMonth() - 6)
          break
      }

      const { data: logs } = await supabase
        .from("exercise_logs")
        .select(`
          *,
          day_exercises!inner (
            exercises!inner (
              name
            ),
            training_day:training_days!inner (
              week_number,
              name,
              block_id
            )
          )
        `)
        .eq("athlete_id", userId)
        .gte("completed_at", startDate.toISOString())
        .order("completed_at", { ascending: true })

      if (logs) {
        // Filter by selected exercise category
        const exerciseNames = BASIC_EXERCISES[selectedExercise as keyof typeof BASIC_EXERCISES]
        const filteredLogs = logs.filter((log: any) => {
          const name = log.day_exercises?.exercises?.name
          return exerciseNames.some((exName) => name?.toLowerCase().includes(exName.toLowerCase()))
        })

        // Calculate E1RM using Brzycki formula
        const calculateE1RM = (weight: number, reps: number) => {
          if (reps === 1) return weight
          return weight * (36 / (37 - reps))
        }

        const groupedByWeek = filteredLogs.reduce((acc: any, log: any) => {
          const blockId = log.day_exercises?.training_day?.block_id
          const weekNumber = log.day_exercises?.training_day?.week_number

          if (!blockId || !weekNumber) return acc

          const weekKey = `${blockId}-week${weekNumber}`
          const date = new Date(log.completed_at)

          const e1rm = Math.round(calculateE1RM(Number.parseFloat(log.actual_weight), log.actual_reps))

          if (!acc[weekKey]) {
            acc[weekKey] = {
              date: date,
              weekNumber: weekNumber,
              e1rm: e1rm,
              maxE1rm: e1rm,
            }
          } else {
            // Keep the max E1RM for this week and the latest date
            if (e1rm > acc[weekKey].maxE1rm) {
              acc[weekKey].maxE1rm = e1rm
              acc[weekKey].e1rm = e1rm
            }
            if (date > acc[weekKey].date) {
              acc[weekKey].date = date
            }
          }

          return acc
        }, {})

        const chartData = Object.values(groupedByWeek)
          .sort((a: any, b: any) => a.date.getTime() - b.date.getTime())
          .map((entry: any) => ({
            date: `Semana ${entry.weekNumber}`,
            e1rm: entry.e1rm,
          }))

        setExerciseData(chartData)
      }

      setIsLoading(false)
    }

    loadExerciseData()
  }, [userId, selectedTimeRange, selectedExercise, supabase])

  useEffect(() => {
    if (!userId || activeTab !== "weight") return

    const loadWeightData = async () => {
      setIsLoading(true)

      // Calculate date range
      const now = new Date()
      const startDate = new Date(now)

      switch (selectedTimeRange) {
        case "1M":
          startDate.setMonth(now.getMonth() - 1)
          break
        case "3M":
          startDate.setMonth(now.getMonth() - 3)
          break
        case "6M":
          startDate.setMonth(now.getMonth() - 6)
          break
      }

      const { data: weights } = await supabase
        .from("body_weight_logs")
        .select("*")
        .eq("athlete_id", userId)
        .gte("recorded_at", startDate.toISOString())
        .order("recorded_at", { ascending: true })

      if (weights) {
        const chartData = weights.map((log: any) => ({
          date: new Date(log.recorded_at).toLocaleDateString("es-CL", { month: "short", day: "numeric" }),
          weight: Number.parseFloat(log.weight),
        }))

        setWeightData(chartData)
      }

      setIsLoading(false)
    }

    loadWeightData()
  }, [userId, activeTab, selectedTimeRange, supabase])

  useEffect(() => {
    if (!userId || activeTab !== "trac") return

    const loadTracData = async () => {
      setIsLoading(true)

      // Calculate date range
      const now = new Date()
      const startDate = new Date(now)

      switch (selectedTimeRange) {
        case "1M":
          startDate.setMonth(now.getMonth() - 1)
          break
        case "3M":
          startDate.setMonth(now.getMonth() - 3)
          break
        case "6M":
          startDate.setMonth(now.getMonth() - 6)
          break
      }

      const { data: tracs } = await supabase
        .from("trac_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("scheduled_date", startDate.toISOString().split("T")[0])
        .order("scheduled_date", { ascending: true })

      if (tracs && tracs.length > 0) {
        const chartData = tracs.map((trac: any) => ({
          date: new Date(trac.scheduled_date).toLocaleDateString("es-CL", { month: "short", day: "numeric" }),
          "Perceived Recovery": trac.perceived_recovery || 0,
          Motivation: trac.motivation || 0,
          "Technical Comfort": trac.technical_comfort || 0,
          "Sleep/Nutrition": trac.sleep_nutrition || 0,
          "Leg Soreness": trac.leg_soreness || 0,
          "Push Soreness": trac.push_soreness || 0,
          "Pull Soreness": trac.pull_soreness || 0,
        }))

        setTracData(chartData)
      } else {
        setTracData([])
      }

      setIsLoading(false)
    }

    loadTracData()
  }, [userId, activeTab, selectedTimeRange, supabase])

  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <LoadingLogo size="medium" />
        </div>
      )
    }

    if (activeTab === "exercises") {
      if (exerciseData.length === 0) {
        return (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No hay datos de entrenamientos para este ejercicio
          </div>
        )
      }

      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={exerciseData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
            <ChartTooltip />
            <Line type="monotone" dataKey="e1rm" stroke="#14b8a6" strokeWidth={2} dot={{ fill: "#14b8a6", r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      )
    }

    if (activeTab === "weight") {
      if (weightData.length === 0) {
        return (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No hay datos de peso corporal registrados
          </div>
        )
      }

      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={weightData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
            <YAxis
              domain={["dataMin - 2", "dataMax + 2"]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#6b7280" }}
            />
            <ChartTooltip />
            <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      )
    }

    if (activeTab === "trac") {
      if (tracData.length === 0) {
        return (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No hay datos de TRAC registrados
          </div>
        )
      }

      return (
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tracData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
              <YAxis
                domain={[0, 20]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6b7280" }}
                label={{ value: "Ideal Conditions", position: "insideTopLeft", fontSize: 11, fill: "#9ca3af" }}
              />
              <ChartTooltip />
              <Bar dataKey="Perceived Recovery" fill="#9ca3af" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Motivation" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Technical Comfort" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Sleep/Nutrition" fill="#6d28d9" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Leg Soreness" fill="#d8b4fe" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Push Soreness" fill="#c084fc" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pull Soreness" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 justify-center text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#9ca3af]" />
              <span className="text-muted-foreground">Perceived Recovery</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#a78bfa]" />
              <span className="text-muted-foreground">Motivation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#7c3aed]" />
              <span className="text-muted-foreground">Technical Comfort</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#6d28d9]" />
              <span className="text-muted-foreground">Sleep/Nutrition</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#d8b4fe]" />
              <span className="text-muted-foreground">Leg Soreness</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#c084fc]" />
              <span className="text-muted-foreground">Push Soreness</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#a855f7]" />
              <span className="text-muted-foreground">Pull Soreness</span>
            </div>
          </div>
        </div>
      )
    }
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-muted px-4 py-6 pb-20">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-6">Estadísticas</h1>

          {/* Tabs */}
          <div className="flex gap-1 mb-6">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                className={`
                  flex-1 rounded-none border-b-2 bg-transparent
                  ${
                    activeTab === tab.id
                      ? "border-teal-500 text-teal-500 bg-transparent"
                      : "border-transparent text-muted-foreground"
                  }
                `}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          {activeTab === "exercises" && (
            <Select value={selectedExercise} onValueChange={setSelectedExercise}>
              <SelectTrigger className="bg-white border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="squat">Squat / Sentadilla</SelectItem>
                <SelectItem value="bench">Bench Press</SelectItem>
                <SelectItem value="deadlift">Deadlift / Peso Muerto</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {activeTab === "exercises" && (
          <CollapsibleInfoCard title="¿Qué es E1RM?" storageKey="stats-e1rm-info">
            <p>
              <span className="font-medium">E1RM (Estimated 1 Rep Max)</span> es tu máximo estimado de 1 repetición. Se
              calcula usando la fórmula de Brzycki:{" "}
              <span className="font-mono text-xs bg-blue-100 px-1 rounded">Peso × (36 / (37 - Reps))</span>
            </p>
            <p className="text-xs">Ejemplo: Si levantas 100kg x 5 reps, tu E1RM ≈ 113kg</p>
          </CollapsibleInfoCard>
        )}

        {activeTab === "weight" && (
          <CollapsibleInfoCard title="Peso Corporal" storageKey="stats-weight-info">
            <p>
              Monitorea cómo fluctúa tu peso a lo largo del tiempo. Mantener un peso estable es importante para
              competencias y para entender tu rendimiento en diferentes categorías de peso.
            </p>
          </CollapsibleInfoCard>
        )}

        {activeTab === "trac" && (
          <CollapsibleInfoCard title="¿Qué es TRAC?" storageKey="stats-trac-info">
            <p>
              <span className="font-medium">TRAC (Training Readiness Assessment & Condition)</span> mide tu estado de
              recuperación. Escala de 0-20 donde 20 = condiciones ideales.
            </p>
            <div className="grid grid-cols-1 gap-1.5 text-xs mt-2">
              <p>
                <span className="font-medium">Leg/Push/Pull Soreness:</span> Dolor muscular en piernas, empuje
                (pecho/hombros) y tirón (espalda)
              </p>
              <p>
                <span className="font-medium">Sleep/Nutrition:</span> Calidad de sueño y alimentación
              </p>
              <p>
                <span className="font-medium">Perceived Recovery:</span> Qué tan recuperado te sientes
              </p>
              <p>
                <span className="font-medium">Motivation:</span> Nivel de motivación para entrenar
              </p>
              <p>
                <span className="font-medium">Technical Comfort:</span> Confianza con la técnica
              </p>
            </div>
          </CollapsibleInfoCard>
        )}

        {/* Chart Card */}
        <Card className="bg-white border-0 shadow-sm mb-6">
          <CardContent className="p-6">
            {/* Time range selector */}
            <div className="flex justify-end mb-4">
              <div className="flex bg-muted rounded-lg p-1">
                <Button
                  variant={selectedTimeRange === "1M" ? "default" : "ghost"}
                  size="sm"
                  className={`
                    px-4 py-1 text-sm
                    ${
                      selectedTimeRange === "1M"
                        ? "bg-white text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }
                  `}
                  onClick={() => setSelectedTimeRange("1M")}
                >
                  1M
                </Button>
                <Button
                  variant={selectedTimeRange === "3M" ? "default" : "ghost"}
                  size="sm"
                  className={`
                    px-4 py-1 text-sm
                    ${
                      selectedTimeRange === "3M"
                        ? "bg-white text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }
                  `}
                  onClick={() => setSelectedTimeRange("3M")}
                >
                  3M
                </Button>
                <Button
                  variant={selectedTimeRange === "6M" ? "default" : "ghost"}
                  size="sm"
                  className={`
                    px-4 py-1 text-sm
                    ${
                      selectedTimeRange === "6M"
                        ? "bg-white text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }
                  `}
                  onClick={() => setSelectedTimeRange("6M")}
                >
                  6M
                </Button>
              </div>
            </div>

            <div className="h-64 w-full overflow-hidden">{renderChart()}</div>
          </CardContent>
        </Card>

        <BottomNavigation currentPage="stats" />
      </div>
    </TooltipProvider>
  )
}
