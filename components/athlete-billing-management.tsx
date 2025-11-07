"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, PlusCircle, Edit, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface BillingRecord {
  id: string
  athlete_id: string
  amount: number
  due_date: string
  paid_date?: string
  status: "pending" | "paid" | "overdue"
  payment_method?: string
  notes?: string
  athletes: {
    profiles: {
      full_name: string
    }
  }
}

interface Athlete {
  id: string
  profiles: {
    full_name: string
  }
}

export function AthleteBillingManagement({ coachId }: { coachId: string }) {
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([])
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddBillingOpen, setIsAddBillingOpen] = useState(false)
  const [isEditBillingOpen, setIsEditBillingOpen] = useState(false)
  const [editingBilling, setEditingBilling] = useState<BillingRecord | null>(null)

  // Form state
  const [selectedAthlete, setSelectedAthlete] = useState("")
  const [startDate, setStartDate] = useState<Date>()
  const [amount, setAmount] = useState("")
  const [paymentType, setPaymentType] = useState("monthly")
  const [endDate, setEndDate] = useState<Date>()
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (!coachId) return

    let isMounted = true

    const loadData = async () => {
      try {
        setLoading(true)

        const response = await fetch(`/api/athlete-billing?coachId=${coachId}`)
        const data = await response.json()

        if (isMounted) {
          if (data.athletes) {
            setAthletes(data.athletes)
          }
          if (data.billing) {
            setBillingRecords(data.billing)
          }
          setLoading(false)
        }
      } catch (error) {
        console.error("Error loading billing data:", error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [coachId])

  const reloadData = async () => {
    try {
      const response = await fetch(`/api/athlete-billing?coachId=${coachId}`)
      const data = await response.json()

      if (data.athletes) {
        setAthletes(data.athletes)
      }
      if (data.billing) {
        setBillingRecords(data.billing)
      }
    } catch (error) {
      console.error("Error loading billing data:", error)
    }
  }

  const handleAddBilling = async () => {
    if (!selectedAthlete || !startDate || !amount) {
      alert("Por favor completa todos los campos obligatorios")
      return
    }

    try {
      const response = await fetch("/api/athlete-billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coachId,
          athleteId: selectedAthlete,
          amount: Number.parseFloat(amount),
          dueDate: format(startDate, "yyyy-MM-dd"),
          paymentType,
          notes,
        }),
      })

      if (response.ok) {
        setIsAddBillingOpen(false)
        resetForm()
        await reloadData()
      }
    } catch (error) {
      console.error("Error adding billing:", error)
    }
  }

  const handleUpdateBilling = async () => {
    if (!editingBilling) return

    try {
      const response = await fetch("/api/athlete-billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingId: editingBilling.id,
          updates: {
            amount: Number.parseFloat(amount),
            due_date: startDate ? format(startDate, "yyyy-MM-dd") : editingBilling.due_date,
            payment_method: paymentType,
            notes,
          },
        }),
      })

      if (response.ok) {
        setIsEditBillingOpen(false)
        setEditingBilling(null)
        resetForm()
        await reloadData()
      }
    } catch (error) {
      console.error("Error updating billing:", error)
    }
  }

  const handleMarkAsPaid = async (billingId: string) => {
    try {
      const response = await fetch("/api/athlete-billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingId,
          updates: {
            status: "paid",
            paid_date: format(new Date(), "yyyy-MM-dd"),
          },
        }),
      })

      if (response.ok) {
        await reloadData()
      }
    } catch (error) {
      console.error("Error marking as paid:", error)
    }
  }

  const openEditDialog = (billing: BillingRecord) => {
    setEditingBilling(billing)
    setAmount(billing.amount.toString())
    setStartDate(new Date(billing.due_date))
    setPaymentType(billing.payment_method || "monthly")
    setNotes(billing.notes || "")
    setIsEditBillingOpen(true)
  }

  const resetForm = () => {
    setSelectedAthlete("")
    setStartDate(undefined)
    setAmount("")
    setPaymentType("monthly")
    setEndDate(undefined)
    setNotes("")
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      paid: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      overdue: "bg-red-100 text-red-800",
    }
    const labels = {
      paid: "Pagado",
      pending: "Pendiente",
      overdue: "Vencido",
    }
    return <Badge className={colors[status as keyof typeof colors]}>{labels[status as keyof typeof labels]}</Badge>
  }

  const calculateAmountDue = (billing: BillingRecord) => {
    return billing.status === "paid" ? 0 : billing.amount
  }

  if (loading) {
    return <div className="p-8 text-center">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestionar Facturación</h2>
        <Dialog open={isAddBillingOpen} onOpenChange={setIsAddBillingOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="w-4 h-4 mr-2" />
              Agregar Cuota
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar Nueva Cuota</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="athlete">Atleta *</Label>
                <Select value={selectedAthlete} onValueChange={setSelectedAthlete}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar atleta" />
                  </SelectTrigger>
                  <SelectContent>
                    {athletes.map((athlete) => (
                      <SelectItem key={athlete.id} value={athlete.id}>
                        {athlete.profiles?.full_name || "Sin nombre"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Inicio Cuota *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left bg-transparent">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} locale={es} />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="amount">Tarifa (CLP) *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="paymentType">Tipo Cuota *</Label>
                <Select value={paymentType} onValueChange={setPaymentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="biweekly">Quincenal</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Fin Cuota (Opcional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left bg-transparent">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} locale={es} />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="notes">Notas</Label>
                <Input
                  id="notes"
                  placeholder="Información adicional..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddBillingOpen(false)
                    resetForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleAddBilling}>Agregar</Button>
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
                <tr className="bg-muted/50">
                  <th className="text-left p-4 font-medium text-sm">Atleta</th>
                  <th className="text-left p-4 font-medium text-sm">Inicio Cuota</th>
                  <th className="text-left p-4 font-medium text-sm">Tarifa</th>
                  <th className="text-left p-4 font-medium text-sm">Tipo Cuota</th>
                  <th className="text-left p-4 font-medium text-sm">Fin Cuota</th>
                  <th className="text-left p-4 font-medium text-sm">Por Pagar</th>
                  <th className="text-left p-4 font-medium text-sm">Estado</th>
                  <th className="text-left p-4 font-medium text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {billingRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      No hay registros de facturación. Agrega una cuota para comenzar.
                    </td>
                  </tr>
                ) : (
                  billingRecords.map((billing) => (
                    <tr key={billing.id} className="border-b border-border hover:bg-muted/20">
                      <td className="p-4 font-medium">{billing.athletes?.profiles?.full_name || "Sin nombre"}</td>
                      <td className="p-4">{format(new Date(billing.due_date), "dd/MM/yyyy", { locale: es })}</td>
                      <td className="p-4 font-medium">${billing.amount.toLocaleString("es-CL")}</td>
                      <td className="p-4 capitalize">{billing.payment_method || "Mensual"}</td>
                      <td className="p-4">-</td>
                      <td className="p-4 font-medium text-orange-600">
                        ${calculateAmountDue(billing).toLocaleString("es-CL")}
                      </td>
                      <td className="p-4">{getStatusBadge(billing.status)}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {billing.status !== "paid" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-transparent"
                              onClick={() => handleMarkAsPaid(billing.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Pagado
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => openEditDialog(billing)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditBillingOpen} onOpenChange={setIsEditBillingOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Cuota</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Inicio Cuota</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} locale={es} />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="edit-amount">Tarifa (CLP)</Label>
              <Input id="edit-amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>

            <div>
              <Label htmlFor="edit-paymentType">Tipo Cuota</Label>
              <Select value={paymentType} onValueChange={setPaymentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="biweekly">Quincenal</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-notes">Notas</Label>
              <Input
                id="edit-notes"
                placeholder="Información adicional..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditBillingOpen(false)
                  setEditingBilling(null)
                  resetForm()
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleUpdateBilling}>Guardar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
