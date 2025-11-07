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
import { CalendarIcon, DollarSign, AlertTriangle, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Payment {
  id: string
  athleteName: string
  amount: number
  dueDate: Date
  paidDate?: Date
  status: "pending" | "paid" | "overdue"
  plan: string
}

interface Athlete {
  id: string
  name: string
  email: string
  plan: string
  monthlyFee: number
  joinDate: Date
  status: "active" | "inactive"
}

export function BillingManagement() {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false)

  const athletes: Athlete[] = [
    {
      id: "1",
      name: "María González",
      email: "maria@email.com",
      plan: "Plan Premium",
      monthlyFee: 120,
      joinDate: new Date("2024-01-15"),
      status: "active",
    },
    {
      id: "2",
      name: "Carlos Ruiz",
      email: "carlos@email.com",
      plan: "Plan Básico",
      monthlyFee: 80,
      joinDate: new Date("2024-02-01"),
      status: "active",
    },
    {
      id: "3",
      name: "Ana López",
      email: "ana@email.com",
      plan: "Plan Premium",
      monthlyFee: 120,
      joinDate: new Date("2024-01-20"),
      status: "active",
    },
    {
      id: "4",
      name: "Diego Martín",
      email: "diego@email.com",
      plan: "Plan Básico",
      monthlyFee: 80,
      joinDate: new Date("2024-03-01"),
      status: "inactive",
    },
  ]

  const payments: Payment[] = [
    {
      id: "1",
      athleteName: "María González",
      amount: 120,
      dueDate: new Date("2024-12-01"),
      paidDate: new Date("2024-11-28"),
      status: "paid",
      plan: "Plan Premium",
    },
    {
      id: "2",
      athleteName: "Carlos Ruiz",
      amount: 80,
      dueDate: new Date("2024-12-01"),
      status: "pending",
      plan: "Plan Básico",
    },
    {
      id: "3",
      athleteName: "Ana López",
      amount: 120,
      dueDate: new Date("2024-11-25"),
      status: "overdue",
      plan: "Plan Premium",
    },
    {
      id: "4",
      athleteName: "Diego Martín",
      amount: 80,
      dueDate: new Date("2024-12-05"),
      status: "pending",
      plan: "Plan Básico",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-4 h-4" />
      case "pending":
        return <DollarSign className="w-4 h-4" />
      case "overdue":
        return <AlertTriangle className="w-4 h-4" />
      default:
        return null
    }
  }

  const totalRevenue = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0)
  const pendingRevenue = payments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0)
  const overdueRevenue = payments.filter((p) => p.status === "overdue").reduce((sum, p) => sum + p.amount, 0)

  const markAsPaid = (paymentId: string) => {
    // Simulate marking payment as paid
    console.log(`Marcando pago ${paymentId} como pagado`)
  }

  const sendReminder = (paymentId: string) => {
    // Simulate sending reminder
    console.log(`Enviando recordatorio para pago ${paymentId}`)
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
          <TabsTrigger value="athletes">Atletas</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Revenue Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ingresos del Mes</p>
                    <p className="text-2xl font-bold text-foreground">${totalRevenue}</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pagos Pendientes</p>
                    <p className="text-2xl font-bold text-foreground">${pendingRevenue}</p>
                  </div>
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pagos Vencidos</p>
                    <p className="text-2xl font-bold text-foreground">${overdueRevenue}</p>
                  </div>
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
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
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <span className="text-2xl">👥</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Payments */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Pagos Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payments.slice(0, 5).map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(payment.status)}
                      <div>
                        <p className="font-medium text-sm">{payment.athleteName}</p>
                        <p className="text-xs text-muted-foreground">{payment.plan}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">${payment.amount}</p>
                      <Badge className={`text-xs ${getStatusColor(payment.status)}`}>
                        {payment.status === "paid" ? "Pagado" : payment.status === "pending" ? "Pendiente" : "Vencido"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Gestión de Pagos</h3>
            <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
              <DialogTrigger asChild>
                <Button>Registrar Pago</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Nuevo Pago</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="athlete">Atleta</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar atleta" />
                      </SelectTrigger>
                      <SelectContent>
                        {athletes.map((athlete) => (
                          <SelectItem key={athlete.id} value={athlete.id}>
                            {athlete.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="amount">Monto</Label>
                    <Input id="amount" type="number" placeholder="120" />
                  </div>
                  <div>
                    <Label>Fecha de Vencimiento</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left bg-transparent">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          Seleccionar fecha
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={selectedMonth} onSelect={setSelectedMonth} locale={es} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsAddPaymentOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={() => setIsAddPaymentOpen(false)}>Registrar</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left p-4 font-medium">Atleta</th>
                      <th className="text-left p-4 font-medium">Plan</th>
                      <th className="text-left p-4 font-medium">Monto</th>
                      <th className="text-left p-4 font-medium">Vencimiento</th>
                      <th className="text-left p-4 font-medium">Estado</th>
                      <th className="text-left p-4 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b border-border">
                        <td className="p-4">{payment.athleteName}</td>
                        <td className="p-4">{payment.plan}</td>
                        <td className="p-4 font-medium">${payment.amount}</td>
                        <td className="p-4">{format(payment.dueDate, "dd/MM/yyyy", { locale: es })}</td>
                        <td className="p-4">
                          <Badge className={getStatusColor(payment.status)}>
                            {payment.status === "paid"
                              ? "Pagado"
                              : payment.status === "pending"
                                ? "Pendiente"
                                : "Vencido"}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            {payment.status !== "paid" && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => markAsPaid(payment.id)}>
                                  Marcar Pagado
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => sendReminder(payment.id)}>
                                  Recordatorio
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="athletes" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Gestión de Atletas</h3>
            <Button>Agregar Atleta</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {athletes.map((athlete) => (
              <Card key={athlete.id} className="bg-white border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{athlete.name}</h4>
                      <p className="text-sm text-muted-foreground">{athlete.email}</p>
                    </div>
                    <Badge variant={athlete.status === "active" ? "secondary" : "outline"}>
                      {athlete.status === "active" ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Plan:</span>
                      <span className="font-medium">{athlete.plan}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Cuota:</span>
                      <span className="font-medium">${athlete.monthlyFee}/mes</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Desde:</span>
                      <span className="font-medium">{format(athlete.joinDate, "MMM yyyy", { locale: es })}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                      Editar
                    </Button>
                    <Button size="sm" variant="ghost" className="flex-1">
                      Ver Historial
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Reportes Financieros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Ingresos por Mes</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Noviembre 2024</span>
                      <span className="font-medium">$2,400</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Octubre 2024</span>
                      <span className="font-medium">$2,200</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Septiembre 2024</span>
                      <span className="font-medium">$2,000</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Distribución por Plan</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Plan Premium</span>
                      <span className="font-medium">60%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Plan Básico</span>
                      <span className="font-medium">40%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Button>Exportar Reporte</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
