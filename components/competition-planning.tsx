"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Trophy, Target, Users, Clock } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Competition {
  id: string
  name: string
  date: Date
  location: string
  type: string
  status: "upcoming" | "active" | "completed"
  participants: string[]
}

interface Athlete {
  id: string
  name: string
  category: string
  currentPRs: {
    squat: number
    bench: number
    deadlift: number
    total: number
  }
  targetPRs: {
    squat: number
    bench: number
    deadlift: number
    total: number
  }
  gameplan: string
  status: "confirmed" | "pending" | "withdrawn"
}

interface GamePlan {
  athleteId: string
  attempts: {
    squat: [number, number, number]
    bench: [number, number, number]
    deadlift: [number, number, number]
  }
  strategy: string
  notes: string
}

export function CompetitionPlanning() {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedCompetition, setSelectedCompetition] = useState("comp1")
  const [isCreateCompOpen, setIsCreateCompOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()

  const competitions: Competition[] = [
    {
      id: "comp1",
      name: "Campeonato Regional 2024",
      date: new Date("2024-12-15"),
      location: "Centro Deportivo Municipal",
      type: "Powerlifting",
      status: "upcoming",
      participants: ["maria", "carlos", "ana"],
    },
    {
      id: "comp2",
      name: "Copa Nacional",
      date: new Date("2025-02-20"),
      location: "Estadio Nacional",
      type: "Powerlifting",
      status: "upcoming",
      participants: ["diego"],
    },
    {
      id: "comp3",
      name: "Torneo Local",
      date: new Date("2024-10-15"),
      location: "Gimnasio Central",
      type: "Powerlifting",
      status: "completed",
      participants: ["maria", "carlos"],
    },
  ]

  const athletes: Athlete[] = [
    {
      id: "maria",
      name: "María González",
      category: "63kg Femenino",
      currentPRs: { squat: 140, bench: 95, deadlift: 160, total: 395 },
      targetPRs: { squat: 145, bench: 100, deadlift: 165, total: 410 },
      gameplan: "Enfoque conservador en primeros intentos, buscar PRs en terceros",
      status: "confirmed",
    },
    {
      id: "carlos",
      name: "Carlos Ruiz",
      category: "83kg Masculino",
      currentPRs: { squat: 180, bench: 130, deadlift: 220, total: 530 },
      targetPRs: { squat: 185, bench: 135, deadlift: 225, total: 545 },
      gameplan: "Estrategia agresiva, buscar total personal desde segundo intento",
      status: "confirmed",
    },
    {
      id: "ana",
      name: "Ana López",
      category: "57kg Femenino",
      currentPRs: { squat: 120, bench: 75, deadlift: 140, total: 335 },
      targetPRs: { squat: 125, bench: 80, deadlift: 145, total: 350 },
      gameplan: "Primera competición, enfoque en completar todos los intentos",
      status: "pending",
    },
    {
      id: "diego",
      name: "Diego Martín",
      category: "74kg Masculino",
      currentPRs: { squat: 160, bench: 110, deadlift: 200, total: 470 },
      targetPRs: { squat: 165, bench: 115, deadlift: 205, total: 485 },
      gameplan: "Competición de preparación, probar nuevas técnicas",
      status: "confirmed",
    },
  ]

  const gamePlans: GamePlan[] = [
    {
      athleteId: "maria",
      attempts: {
        squat: [135, 142, 147],
        bench: [90, 97, 102],
        deadlift: [155, 162, 167],
      },
      strategy: "Conservador en primeros, agresivo en terceros",
      notes: "Revisar timing en sentadilla, trabajar confianza en press",
    },
    {
      athleteId: "carlos",
      attempts: {
        squat: [175, 182, 187],
        bench: [125, 132, 137],
        deadlift: [215, 222, 227],
      },
      strategy: "Buscar total desde segundo intento",
      notes: "Excelente forma técnica, confianza alta",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "withdrawn":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCompetitionStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800"
      case "active":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const selectedComp = competitions.find((c) => c.id === selectedCompetition)
  const competingAthletes = athletes.filter((a) => selectedComp?.participants.includes(a.id))

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="competitions">Competiciones</TabsTrigger>
          <TabsTrigger value="athletes">Atletas</TabsTrigger>
          <TabsTrigger value="gameplans">Game Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Próximas Competiciones</p>
                    <p className="text-2xl font-bold text-foreground">
                      {competitions.filter((c) => c.status === "upcoming").length}
                    </p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Trophy className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Atletas Compitiendo</p>
                    <p className="text-2xl font-bold text-foreground">
                      {athletes.filter((a) => a.status === "confirmed").length}
                    </p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Game Plans Listos</p>
                    <p className="text-2xl font-bold text-foreground">{gamePlans.length}</p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Días hasta próxima</p>
                    <p className="text-2xl font-bold text-foreground">
                      {Math.ceil((new Date("2024-12-15").getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                    </p>
                  </div>
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Competitions */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Próximas Competiciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {competitions
                  .filter((c) => c.status === "upcoming")
                  .map((competition) => (
                    <div
                      key={competition.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Trophy className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{competition.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {format(competition.date, "dd 'de' MMMM, yyyy", { locale: es })} • {competition.location}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {competition.participants.length} atletas participando
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getCompetitionStatusColor(competition.status)}>
                          {competition.status === "upcoming" ? "Próxima" : competition.status}
                        </Badge>
                        <Button size="sm" variant="outline">
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Gestión de Competiciones</h3>
            <Dialog open={isCreateCompOpen} onOpenChange={setIsCreateCompOpen}>
              <DialogTrigger asChild>
                <Button>Nueva Competición</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Competición</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="compName">Nombre de la Competición</Label>
                    <Input id="compName" placeholder="Ej: Campeonato Regional 2024" />
                  </div>
                  <div>
                    <Label>Fecha</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left bg-transparent">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Seleccionar fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} locale={es} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="location">Ubicación</Label>
                    <Input id="location" placeholder="Centro Deportivo Municipal" />
                  </div>
                  <div>
                    <Label htmlFor="type">Tipo</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="powerlifting">Powerlifting</SelectItem>
                        <SelectItem value="weightlifting">Weightlifting</SelectItem>
                        <SelectItem value="strongman">Strongman</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsCreateCompOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={() => setIsCreateCompOpen(false)}>Crear</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {competitions.map((competition) => (
              <Card key={competition.id} className="bg-white border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{competition.name}</h4>
                      <p className="text-sm text-muted-foreground">{competition.type}</p>
                    </div>
                    <Badge className={getCompetitionStatusColor(competition.status)}>
                      {competition.status === "upcoming"
                        ? "Próxima"
                        : competition.status === "active"
                          ? "Activa"
                          : "Completada"}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Fecha:</span>
                      <span className="font-medium">{format(competition.date, "dd/MM/yyyy")}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Ubicación:</span>
                      <span className="font-medium">{competition.location}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Participantes:</span>
                      <span className="font-medium">{competition.participants.length}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                      Editar
                    </Button>
                    <Button size="sm" variant="ghost" className="flex-1">
                      Ver Atletas
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="athletes" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Selección de Atletas</h3>
              <Select value={selectedCompetition} onValueChange={setSelectedCompetition}>
                <SelectTrigger className="w-64 mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {competitions
                    .filter((c) => c.status === "upcoming")
                    .map((comp) => (
                      <SelectItem key={comp.id} value={comp.id}>
                        {comp.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button>Agregar Atleta</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {competingAthletes.map((athlete) => (
              <Card key={athlete.id} className="bg-white border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{athlete.name}</h4>
                      <p className="text-sm text-muted-foreground">{athlete.category}</p>
                    </div>
                    <Badge className={getStatusColor(athlete.status)}>
                      {athlete.status === "confirmed"
                        ? "Confirmado"
                        : athlete.status === "pending"
                          ? "Pendiente"
                          : "Retirado"}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h5 className="text-sm font-medium mb-2">PRs Actuales</h5>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span>Sentadilla:</span>
                          <span className="font-medium">{athlete.currentPRs.squat}kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Press:</span>
                          <span className="font-medium">{athlete.currentPRs.bench}kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Peso Muerto:</span>
                          <span className="font-medium">{athlete.currentPRs.deadlift}kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total:</span>
                          <span className="font-medium">{athlete.currentPRs.total}kg</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium mb-2">Objetivos</h5>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span>Sentadilla:</span>
                          <span className="font-medium text-blue-600">{athlete.targetPRs.squat}kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Press:</span>
                          <span className="font-medium text-blue-600">{athlete.targetPRs.bench}kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Peso Muerto:</span>
                          <span className="font-medium text-blue-600">{athlete.targetPRs.deadlift}kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total:</span>
                          <span className="font-medium text-blue-600">{athlete.targetPRs.total}kg</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                      Editar Objetivos
                    </Button>
                    <Button size="sm" variant="ghost" className="flex-1">
                      Game Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="gameplans" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Game Plans</h3>
            <Button>Nuevo Game Plan</Button>
          </div>

          <div className="space-y-4">
            {gamePlans.map((plan) => {
              const athlete = athletes.find((a) => a.id === plan.athleteId)
              return (
                <Card key={plan.athleteId} className="bg-white border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-medium">{athlete?.name}</h4>
                        <p className="text-sm text-muted-foreground">{athlete?.category}</p>
                      </div>
                      <Button size="sm" variant="outline" className="bg-transparent">
                        Editar Plan
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                      <div>
                        <h5 className="font-medium mb-2 text-center">Sentadilla</h5>
                        <div className="space-y-1">
                          {plan.attempts.squat.map((weight, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>Intento {index + 1}:</span>
                              <span className="font-medium">{weight}kg</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium mb-2 text-center">Press Banca</h5>
                        <div className="space-y-1">
                          {plan.attempts.bench.map((weight, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>Intento {index + 1}:</span>
                              <span className="font-medium">{weight}kg</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium mb-2 text-center">Peso Muerto</h5>
                        <div className="space-y-1">
                          {plan.attempts.deadlift.map((weight, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>Intento {index + 1}:</span>
                              <span className="font-medium">{weight}kg</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h5 className="font-medium mb-1">Estrategia</h5>
                        <p className="text-sm text-muted-foreground">{plan.strategy}</p>
                      </div>
                      <div>
                        <h5 className="font-medium mb-1">Notas</h5>
                        <p className="text-sm text-muted-foreground">{plan.notes}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
