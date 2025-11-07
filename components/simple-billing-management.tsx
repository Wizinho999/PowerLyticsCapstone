"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PlusCircle, Edit, CheckCircle } from "lucide-react"

interface BillingRecord {
  id: string
  athlete_id: string
  athlete_name: string
  due_date: string
  amount: number
  payment_method: string
  paid_date: string | null
  amount_due: number
  status: "pending" | "paid" | "overdue" | "cancelled"
  notes: string | null
}

interface Athlete {
  id: string
  full_name: string
}

export function SimpleBillingManagement({ coachId }: { coachId: string }) {
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([])
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<BillingRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [athleteId, setAthleteId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("transfer")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (coachId) {
      loadBillingRecords()
      loadAthletes()
    }
  }, [coachId])

  const loadAthletes = async () => {
    try {
      const response = await fetch(`/api/athlete-billing?coachId=${coachId}&type=athletes`)
      if (response.ok) {
        const data = await response.json()
        setAthletes(data.athletes || [])
      } else {
        console.error("Error loading athletes: response not ok")
      }
    } catch (error) {
      console.error("Error loading athletes:", error)
    }
  }

  const loadBillingRecords = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/athlete-billing?coachId=${coachId}`)
      if (response.ok) {
        const data = await response.json()
        setBillingRecords(data.billingRecords || [])
      }
    } catch (error) {
      console.error("Error loading billing records:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddBilling = async () => {
    if (!athleteId || !dueDate || !amount) {
      alert("Por favor completa todos los campos requeridos")
      return
    }

    try {
      const response = await fetch("/api/athlete-billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coachId,
          athleteId,
          dueDate,
          amount: Number.parseFloat(amount),
          paymentMethod,
          notes,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        await loadBillingRecords()
        resetForm()
        setIsAddDialogOpen(false)
      } else {
        alert(`Error al agregar cuota: ${result.error}`)
      }
    } catch (error) {
      console.error("Error adding billing:", error)
      alert("Error al agregar cuota")
    }
  }

  const handleEditBilling = async () => {
    if (!editingRecord) return

    try {
      const response = await fetch("/api/athlete-billing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingRecord.id,
          dueDate,
          amount: Number.parseFloat(amount),
          paymentMethod,
          notes,
        }),
      })

      if (response.ok) {
        await loadBillingRecords()
        setEditingRecord(null)
        resetForm()
        setIsEditDialogOpen(false)
      }
    } catch (error) {
      console.error("Error updating billing:", error)
    }
  }

  const handleMarkAsPaid = async (id: string) => {
    try {
      const response = await fetch("/api/athlete-billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: "paid",
        }),
      })

      if (response.ok) {
        await loadBillingRecords()
      }
    } catch (error) {
      console.error("Error marking as paid:", error)
    }
  }

  const openEditDialog = (record: BillingRecord) => {
    setEditingRecord(record)
    setAthleteId(record.athlete_id)
    setDueDate(record.due_date)
    setAmount(record.amount.toString())
    setPaymentMethod(record.payment_method)
    setNotes(record.notes || "")
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setAthleteId("")
    setDueDate("")
    setAmount("")
    setPaymentMethod("transfer")
    setNotes("")
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      paid: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      overdue: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    }
    const labels = {
      paid: "Pagado",
      pending: "Pendiente",
      overdue: "Vencido",
      cancelled: "Cancelado",
    }
    return <Badge className={colors[status as keyof typeof colors]}>{labels[status as keyof typeof labels]}</Badge>
  }

  const getPaymentTypeLabel = (type: string) => {
    const labels = {
      transfer: "Transferencia",
      cash: "Efectivo",
      card: "Tarjeta",
      monthly: "Mensual",
      weekly: "Semanal",
      biweekly: "Quincenal",
      quarterly: "Trimestral",
    }
    return labels[type as keyof typeof labels] || type
  }

  if (isLoading) {
    return <div className="p-8 text-center">Cargando registros de facturación...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestionar Facturación</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
                <Label htmlFor="athlete">Atleta</Label>
                <Select value={athleteId} onValueChange={setAthleteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un atleta" />
                  </SelectTrigger>
                  <SelectContent>
                    {athletes.map((athlete) => (
                      <SelectItem key={athlete.id} value={athlete.id}>
                        {athlete.full_name || "Sin nombre"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dueDate">Fecha de Vencimiento</Label>
                <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>

              <div>
                <Label htmlFor="amount">Tarifa (CLP)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="paymentMethod">Método de Pago</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="card">Tarjeta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Input
                  id="notes"
                  placeholder="Notas adicionales"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
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
                  <th className="text-left p-4 font-medium text-sm">Vencimiento</th>
                  <th className="text-left p-4 font-medium text-sm">Tarifa</th>
                  <th className="text-left p-4 font-medium text-sm">Método de Pago</th>
                  <th className="text-left p-4 font-medium text-sm">Fecha de Pago</th>
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
                      <td className="p-4 font-medium">{billing.athlete_name}</td>
                      <td className="p-4">{billing.due_date}</td>
                      <td className="p-4 font-medium">${billing.amount.toLocaleString("es-CL")}</td>
                      <td className="p-4">{getPaymentTypeLabel(billing.payment_method)}</td>
                      <td className="p-4">{billing.paid_date || "-"}</td>
                      <td className="p-4 font-medium text-orange-600">${billing.amount_due.toLocaleString("es-CL")}</td>
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Cuota</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-dueDate">Fecha de Vencimiento</Label>
              <Input id="edit-dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>

            <div>
              <Label htmlFor="edit-amount">Tarifa (CLP)</Label>
              <Input id="edit-amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>

            <div>
              <Label htmlFor="edit-paymentMethod">Método de Pago</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-notes">Notas</Label>
              <Input id="edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditBilling}>Guardar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
