"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="strength">1RM</TabsTrigger>
          <TabsTrigger value="volume">Volumen</TabsTrigger>
          <TabsTrigger value="blocks">Bloques</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">1RM Estimado</p>
                    <p className="text-2xl font-bold text-foreground">{latestE1RM}kg</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tonelaje Promedio</p>
                    <p className="text-2xl font-bold text-foreground">{(avgTonnage / 1000).toFixed(1)}k</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Stress Index</p>
                    <p className="text-2xl font-bold text-foreground">{avgStress}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {Number.parseFloat(avgStress) > 8 ? "Alto" : Number.parseFloat(avgStress) > 5 ? "Óptimo" : "Bajo"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Registros</p>
                    <p className="text-2xl font-bold text-foreground">{e1rmData.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Progresión 1RM Estimado</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={e1rmData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="e1rm" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Carga Neural por Ejercicio</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={nlData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="exercise" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="nl" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="strength" className="space-y-6">
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Evolución 1RM Estimado</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={e1rmData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="e1rm" stroke="#8884d8" strokeWidth={3} name="1RM Estimado" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="volume" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Tonelaje por Semana</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={tonnageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="tonnage" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Stress Index por Semana</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="stress" stroke="#ff7300" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="blocks" className="space-y-6">
          <div className="space-y-4">
            {blockSummaries.length === 0 ? (
              <Card className="bg-white border-0 shadow-sm">
                <CardContent className="p-6">
                  <p className="text-muted-foreground text-center">No hay bloques de entrenamiento disponibles.</p>
                </CardContent>
              </Card>
            ) : (
              blockSummaries.map((block: any, index: number) => (
                <Card key={index} className="bg-white border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{block.name}</h3>
                        <p className="text-sm text-muted-foreground">{block.period}</p>
                      </div>
                      <Badge
                        variant={
                          block.status === "Completado"
                            ? "secondary"
                            : block.status === "En progreso"
                              ? "default"
                              : "outline"
                        }
                      >
                        {block.status}
                      </Badge>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Progreso</span>
                        <span className="text-sm font-medium">{block.progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
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
