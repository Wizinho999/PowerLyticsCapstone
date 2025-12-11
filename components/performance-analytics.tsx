"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { TrendingUp, Zap, Flame, Brain } from "lucide-react"
import { CollapsibleInfoCard } from "@/components/collapsible-info-card"

interface PerformanceAnalyticsProps {
  coachId: string
}

export function PerformanceAnalytics({ coachId }: PerformanceAnalyticsProps) {
  const [selectedAthlete, setSelectedAthlete] = useState<string>("")
  const [selectedExercise, setSelectedExercise] = useState<string>("all")
  const [selectedPeriod, setSelectedPeriod] = useState("3months")
  const [athletes, setAthletes] = useState<any[]>([])
  const [exercises, setExercises] = useState<any[]>([])
  const [performanceData, setPerformanceData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const loadAthletes = async () => {
      const { data, error } = await supabase
        .from("athletes")
        .select(`
          id,
          profiles!inner (
            full_name
          )
        `)
        .eq("coach_id", coachId)

      if (data && data.length > 0) {
        const validAthletes = data.filter((athlete) => athlete.profiles)

        if (validAthletes.length > 0) {
          setAthletes(validAthletes)
          setSelectedAthlete(validAthletes[0].id)
        }
      }
    }

    if (coachId) {
      loadAthletes()
    }
  }, [coachId, supabase])

  useEffect(() => {
    if (!selectedAthlete) return

    const loadPerformanceData = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          athleteId: selectedAthlete,
          period: selectedPeriod,
        })

        if (selectedExercise !== "all") {
          params.append("exerciseId", selectedExercise)
        }

        const response = await fetch(`/api/performance?${params}`)
        const data = await response.json()

        setPerformanceData(data)
        setExercises(data.availableExercises || [])
      } catch (error) {
        console.error("Error loading performance data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadPerformanceData()
  }, [selectedAthlete, selectedExercise, selectedPeriod])

  const e1rmData = performanceData?.e1rmData || []
  const tonnageData = performanceData?.tonnageData || []
  const stressData = performanceData?.stressData || []
  const nlData = performanceData?.nlData || []
  const blockSummaries = performanceData?.blockSummaries || []

  if (athletes.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto mt-12">
        <CardHeader>
          <CardTitle>Sin atletas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No tienes atletas asignados para analizar su rendimiento.</p>
        </CardContent>
      </Card>
    )
  }

  if (loading || !performanceData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando datos de rendimiento...</p>
        </div>
      </div>
    )
  }

  // Calculate current metrics
  const latestE1RM = e1rmData.length > 0 ? e1rmData[e1rmData.length - 1].e1rm : 0
  const avgTonnage =
    tonnageData.length > 0
      ? Math.round(tonnageData.reduce((sum: number, d: any) => sum + d.tonnage, 0) / tonnageData.length)
      : 0
  const avgStress =
    stressData.length > 0
      ? (stressData.reduce((sum: number, d: any) => sum + d.stress, 0) / stressData.length).toFixed(1)
      : "0.0"

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Select value={selectedAthlete} onValueChange={setSelectedAthlete}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar atleta" />
            </SelectTrigger>
            <SelectContent>
              {athletes.map((athlete) => (
                <SelectItem key={athlete.id} value={athlete.id}>
                  {athlete.profiles?.full_name || "Atleta sin nombre"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <Select value={selectedExercise} onValueChange={setSelectedExercise}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar ejercicio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los ejercicios</SelectItem>
              {exercises?.map((exercise) => (
                <SelectItem key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Último mes</SelectItem>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
              <SelectItem value="6months">Últimos 6 meses</SelectItem>
              <SelectItem value="1year">Último año</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-slate-100 to-slate-50">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="strength">1RM</TabsTrigger>
          <TabsTrigger value="volume">Volumen</TabsTrigger>
          <TabsTrigger value="blocks">Bloques</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <CollapsibleInfoCard title="Métricas de Rendimiento" storageKey="coach-performance-metrics-info">
            <div className="space-y-2">
              <p>
                <span className="font-medium">1RM Estimado:</span> Máximo de 1 repetición calculado con fórmula de
                Brzycki: Peso × (36 / (37 - Reps))
              </p>
              <p>
                <span className="font-medium">Tonelaje:</span> Volumen total de trabajo = Peso × Reps × Sets. Mide el
                trabajo total realizado.
              </p>
              <p>
                <span className="font-medium">Stress Index:</span> Indicador de intensidad del entrenamiento basado en
                %1RM y proximidad al fallo. Escala 0-10, óptimo entre 6-8.
              </p>
              <p>
                <span className="font-medium">NL (Number of Lifts):</span> Cantidad total de levantamientos por
                ejercicio para medir frecuencia de práctica.
              </p>
            </div>
          </CollapsibleInfoCard>

          {/* Key Metrics with gradient backgrounds */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1RM Card - Blue gradient */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">1RM Estimado</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                      {latestE1RM}
                      <span className="text-lg ml-1">kg</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tonnage Card - Green gradient */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">Tonelaje Promedio</p>
                    </div>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                      {(avgTonnage / 1000).toFixed(1)}
                      <span className="text-lg ml-1">k</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stress Index Card - Orange gradient */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Stress Index</p>
                    </div>
                    <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{avgStress}</p>
                  </div>
                  <Badge variant="outline" className="bg-white dark:bg-slate-800 text-xs ml-2">
                    {Number.parseFloat(avgStress) > 8 ? "Alto" : Number.parseFloat(avgStress) > 5 ? "Óptimo" : "Bajo"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Records Card - Purple gradient */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Total Registros</p>
                    </div>
                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{e1rmData.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-t-lg">
                <CardTitle className="text-lg text-blue-900 dark:text-blue-100">Progresión 1RM Estimado</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={e1rmData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="date" stroke="var(--color-muted-foreground)" />
                    <YAxis stroke="var(--color-muted-foreground)" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="e1rm"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: "#3b82f6", r: 5 }}
                      activeDot={{ r: 7 }}
                      isAnimationActive={true}
                      name="1RM Estimado"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-t-lg">
                <CardTitle className="text-lg text-purple-900 dark:text-purple-100">
                  Carga Neural por Ejercicio
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={nlData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      dataKey="exercise"
                      angle={0}
                      textAnchor="start"
                      height={80}
                      stroke="var(--color-muted-foreground)"
                    />
                    <YAxis stroke="var(--color-muted-foreground)" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
                    />
                    <Bar dataKey="nl" fill="rgb(147, 51, 234)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="strength" className="space-y-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-t-lg">
              <CardTitle className="text-lg text-blue-900 dark:text-blue-100">Evolución 1RM Estimado</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {e1rmData && e1rmData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={e1rmData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="date" stroke="var(--color-muted-foreground)" />
                    <YAxis stroke="var(--color-muted-foreground)" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="e1rm"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      isAnimationActive={true}
                      name="1RM Estimado"
                      dot={{ fill: "#3b82f6", r: 6, strokeWidth: 2, stroke: "#ffffff" }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-96">
                  <p className="text-muted-foreground">No hay datos de 1RM disponibles para este período</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="volume" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-t-lg">
                <CardTitle className="text-lg text-green-900 dark:text-green-100">Tonelaje por Semana</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={tonnageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="week" stroke="var(--color-muted-foreground)" />
                    <YAxis stroke="var(--color-muted-foreground)" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
                    />
                    <Bar dataKey="tonnage" fill="var(--color-chart-2)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-t-lg">
                <CardTitle className="text-lg text-orange-900 dark:text-orange-100">Stress Index por Semana</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="week" stroke="var(--color-muted-foreground)" />
                    <YAxis domain={[0, 10]} stroke="var(--color-muted-foreground)" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="stress"
                      stroke="var(--color-chart-3)"
                      strokeWidth={3}
                      dot={{ fill: "var(--color-chart-3)", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="blocks" className="space-y-6">
          <div className="space-y-4">
            {blockSummaries.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <p className="text-muted-foreground text-center">No hay bloques de entrenamiento disponibles.</p>
                </CardContent>
              </Card>
            ) : (
              blockSummaries.map((block: any, index: number) => (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{block.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{block.period}</p>
                      </div>
                      <Badge
                        className={`${
                          block.status === "Completado"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                            : block.status === "En progreso"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100"
                        }`}
                      >
                        {block.status}
                      </Badge>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">Progreso</span>
                        <span className="text-sm font-bold text-primary">{block.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${block.progress}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
