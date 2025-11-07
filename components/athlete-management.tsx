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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { User, Mail, Phone, CalendarIcon, Trophy, DollarSign, Activity, Target, BarChart3 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface AthleteProfile {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  dateOfBirth: Date
  joinDate: Date
  category: string
  status: "active" | "inactive" | "suspended"
  plan: string
  monthlyFee: number

  // Training data
  currentBlock: string
  blocksCompleted: number
  trainingDays: number
  adherence: number

  // Performance data
  currentPRs: {
    squat: number
    bench: number
    deadlift: number
    total: number
  }

  // Competition data
  upcomingCompetitions: string[]
  competitionsCompleted: number

  // Billing data
  paymentStatus: "current" | "overdue" | "pending"
  lastPayment: Date

  // Notes
  notes: string
  goals: string[]
}

export function AthleteManagement() {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedAthlete, setSelectedAthlete] = useState<string | null>(null)
  const [isAddAthleteOpen, setIsAddAthleteOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const athletes: AthleteProfile[] = [
    {
      id: "maria",
      name: "María González",
      email: "maria@email.com",
      phone: "+34 666 123 456",
      dateOfBirth: new Date("1995-03-15"),
      joinDate: new Date("2024-01-15"),
      category: "63kg Femenino",
      status: "active",
      plan: "Plan Premium",
      monthlyFee: 120,
      currentBlock: "Bloque Fuerza Fase 2",
      blocksCompleted: 3,
      trainingDays: 45,
      adherence: 94,
      currentPRs: { squat: 142, bench: 97, deadlift: 165, total: 404 },
      upcomingCompetitions: ["Campeonato Regional 2024"],
      competitionsCompleted: 2,
      paymentStatus: "current",
      lastPayment: new Date("2024-11-01"),
      notes: "Excelente progreso técnico. Trabajar confianza en competición.",
      goals: ["Alcanzar 150kg en sentadilla", "Competir a nivel nacional", "Mejorar técnica en press"],
    },
    {
      id: "carlos",
      name: "Carlos Ruiz",
      email: "carlos@email.com",
      phone: "+34 666 789 012",
      dateOfBirth: new Date("1988-07-22"),
      joinDate: new Date("2024-02-01"),
      category: "83kg Masculino",
      status: "active",
      plan: "Plan Básico",
      monthlyFee: 80,
      currentBlock: "Bloque Hipertrofia",
      blocksCompleted: 2,
      trainingDays: 38,
      adherence: 87,
      currentPRs: { squat: 185, bench: 135, deadlift: 225, total: 545 },
      upcomingCompetitions: ["Campeonato Regional 2024"],
      competitionsCompleted: 4,
      paymentStatus: "pending",
      lastPayment: new Date("2024-10-01"),
      notes: "Atleta experimentado. Enfoque en consistencia.",
      goals: ["Romper 600kg total", "Mejorar peso muerto", "Mantener peso corporal"],
    },
    {
      id: "ana",
      name: "Ana López",
      email: "ana@email.com",
      phone: "+34 666 345 678",
      dateOfBirth: new Date("1992-11-08"),
      joinDate: new Date("2024-01-20"),
      category: "57kg Femenino",
      status: "active",
      plan: "Plan Premium",
      monthlyFee: 120,
      currentBlock: "Bloque Preparación",
      blocksCompleted: 3,
      trainingDays: 42,
      adherence: 96,
      currentPRs: { squat: 125, bench: 80, deadlift: 145, total: 350 },
      upcomingCompetitions: ["Campeonato Regional 2024"],
      competitionsCompleted: 0,
      paymentStatus: "overdue",
      lastPayment: new Date("2024-09-15"),
      notes: "Primera competición próxima. Trabajar nervios pre-competición.",
      goals: ["Completar primera competición", "350kg total", "Ganar confianza"],
    },
    {
      id: "diego",
      name: "Diego Martín",
      email: "diego@email.com",
      phone: "+34 666 901 234",
      dateOfBirth: new Date("1990-05-12"),
      joinDate: new Date("2024-03-01"),
      category: "74kg Masculino",
      status: "inactive",
      plan: "Plan Básico",
      monthlyFee: 80,
      currentBlock: "Pausa",
      blocksCompleted: 1,
      trainingDays: 20,
      adherence: 65,
      currentPRs: { squat: 165, bench: 115, deadlift: 205, total: 485 },
      upcomingCompetitions: [],
      competitionsCompleted: 1,
      paymentStatus: "overdue",
      lastPayment: new Date("2024-08-01"),
      notes: "Pausa temporal por lesión. Seguimiento médico.",
      goals: ["Recuperación completa", "Volver al entrenamiento", "Mantener fuerza"],
    },
  ]

  const filteredAthletes = athletes.filter((athlete) => {
    const matchesSearch =
      athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      athlete.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || athlete.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const selectedAthleteData = selectedAthlete ? athletes.find((a) => a.id === selectedAthlete) : null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "suspended":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "current":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="athletes">Atletas</TabsTrigger>
          <TabsTrigger value="profile">Perfil Detallado</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Atletas</p>
                    <p className="text-2xl font-bold text-foreground">{athletes.length}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Atletas Activos</p>
                    <p className="text-2xl font-bold text-foreground">
                      {athletes.filter((a) => a.status === "active").length}
                    </p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Activity className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Adherencia Promedio</p>
                    <p className="text-2xl font-bold text-foreground">
                      {Math.round(athletes.reduce((sum, a) => sum + a.adherence, 0) / athletes.length)}%
                    </p>
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
                    <p className="text-sm text-muted-foreground">Pagos Pendientes</p>
                    <p className="text-2xl font-bold text-foreground">
                      {athletes.filter((a) => a.paymentStatus !== "current").length}
                    </p>
                  </div>
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {athletes
                    .filter((a) => a.status === "active")
                    .sort((a, b) => b.adherence - a.adherence)
                    .slice(0, 3)
                    .map((athlete, index) => (
                      <div key={athlete.id} className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full text-sm font-medium">
                          {index + 1}
                        </div>
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={athlete.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{getInitials(athlete.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{athlete.name}</p>
                          <p className="text-xs text-muted-foreground">{athlete.adherence}% adherencia</p>
                        </div>
                        <Badge variant="secondary">{athlete.currentPRs.total}kg</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Próximas Competiciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {athletes
                    .filter((a) => a.upcomingCompetitions.length > 0)
                    .map((athlete) => (
                      <div key={athlete.id} className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Trophy className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{athlete.name}</p>
                          <p className="text-xs text-muted-foreground">{athlete.upcomingCompetitions[0]}</p>
                        </div>
                        <Badge variant="outline">{athlete.category}</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="athletes" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <Input
                placeholder="Buscar atletas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                  <SelectItem value="suspended">Suspendidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isAddAthleteOpen} onOpenChange={setIsAddAthleteOpen}>
              <DialogTrigger asChild>
                <Button>Agregar Atleta</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Atleta</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nombre Completo</Label>
                    <Input id="name" placeholder="María González" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="maria@email.com" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" placeholder="+34 666 123 456" />
                  </div>
                  <div>
                    <Label htmlFor="plan">Plan</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Plan Básico - $80/mes</SelectItem>
                        <SelectItem value="premium">Plan Premium - $120/mes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsAddAthleteOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={() => setIsAddAthleteOpen(false)}>Agregar</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAthletes.map((athlete) => (
              <Card
                key={athlete.id}
                className="bg-white border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedAthlete(athlete.id)
                  setActiveTab("profile")
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={athlete.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{getInitials(athlete.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium">{athlete.name}</h4>
                      <p className="text-sm text-muted-foreground">{athlete.category}</p>
                      <Badge className={`mt-1 text-xs ${getStatusColor(athlete.status)}`}>
                        {athlete.status === "active"
                          ? "Activo"
                          : athlete.status === "inactive"
                            ? "Inactivo"
                            : "Suspendido"}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Bloque actual:</span>
                      <span className="font-medium">{athlete.currentBlock}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Adherencia:</span>
                      <span className="font-medium">{athlete.adherence}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-medium">{athlete.currentPRs.total}kg</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pago:</span>
                      <Badge className={`text-xs ${getPaymentStatusColor(athlete.paymentStatus)}`}>
                        {athlete.paymentStatus === "current"
                          ? "Al día"
                          : athlete.paymentStatus === "pending"
                            ? "Pendiente"
                            : "Vencido"}
                      </Badge>
                    </div>
                  </div>

                  <Progress value={athlete.adherence} className="mt-3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          {selectedAthleteData ? (
            <>
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedAthleteData.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-lg">{getInitials(selectedAthleteData.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{selectedAthleteData.name}</h2>
                  <p className="text-muted-foreground">{selectedAthleteData.category}</p>
                  <Badge className={`mt-1 ${getStatusColor(selectedAthleteData.status)}`}>
                    {selectedAthleteData.status === "active"
                      ? "Activo"
                      : selectedAthleteData.status === "inactive"
                        ? "Inactivo"
                        : "Suspendido"}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Personal Info */}
                <Card className="bg-white border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Información Personal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{selectedAthleteData.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{selectedAthleteData.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{format(selectedAthleteData.dateOfBirth, "dd/MM/yyyy")}</span>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">Plan: {selectedAthleteData.plan}</p>
                      <p className="text-sm text-muted-foreground">Cuota: ${selectedAthleteData.monthlyFee}/mes</p>
                      <p className="text-sm text-muted-foreground">
                        Desde: {format(selectedAthleteData.joinDate, "MMM yyyy", { locale: es })}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Training Stats */}
                <Card className="bg-white border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Entrenamiento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Bloque actual:</span>
                      <span className="text-sm font-medium">{selectedAthleteData.currentBlock}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Bloques completados:</span>
                      <span className="text-sm font-medium">{selectedAthleteData.blocksCompleted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Días entrenados:</span>
                      <span className="text-sm font-medium">{selectedAthleteData.trainingDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Adherencia:</span>
                      <span className="text-sm font-medium">{selectedAthleteData.adherence}%</span>
                    </div>
                    <Progress value={selectedAthleteData.adherence} className="mt-2" />
                  </CardContent>
                </Card>

                {/* Performance */}
                <Card className="bg-white border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      PRs Actuales
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Sentadilla:</span>
                      <span className="text-sm font-medium">{selectedAthleteData.currentPRs.squat}kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Press Banca:</span>
                      <span className="text-sm font-medium">{selectedAthleteData.currentPRs.bench}kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Peso Muerto:</span>
                      <span className="text-sm font-medium">{selectedAthleteData.currentPRs.deadlift}kg</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-sm font-medium">Total:</span>
                      <span className="text-lg font-bold text-primary">{selectedAthleteData.currentPRs.total}kg</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Goals and Notes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Objetivos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedAthleteData.goals.map((goal, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          {goal}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-white border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle>Notas del Coach</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{selectedAthleteData.notes}</p>
                    <Button size="sm" variant="outline" className="mt-3 bg-transparent">
                      Editar Notas
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="bg-transparent">
                      Crear Nuevo Bloque
                    </Button>
                    <Button size="sm" variant="outline" className="bg-transparent">
                      Ver Análisis
                    </Button>
                    <Button size="sm" variant="outline" className="bg-transparent">
                      Registrar Pago
                    </Button>
                    <Button size="sm" variant="outline" className="bg-transparent">
                      Agregar a Competición
                    </Button>
                    <Button size="sm" variant="outline" className="bg-transparent">
                      Enviar Mensaje
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex justify-center items-center h-96">
              <div className="text-center">
                <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">Selecciona un atleta para ver su perfil</p>
                <p className="text-sm text-muted-foreground">
                  Ve a la pestaña "Atletas" y haz clic en cualquier atleta
                </p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
