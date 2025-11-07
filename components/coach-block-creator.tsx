"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { ChevronLeft, Plus, Trash2, Edit2 } from "lucide-react"

interface Athlete {
  id: string
  full_name: string
  email: string
}

interface TrainingDay {
  id: string
  name: string
  day_number: number
}

export function CoachBlockCreator() {
  const router = useRouter()
  const supabase = createClient()

  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("")
  const [blockName, setBlockName] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [description, setDescription] = useState("")
  const [days, setDays] = useState<TrainingDay[]>([])
  const [editingDayId, setEditingDayId] = useState<string | null>(null)
  const [editingDayName, setEditingDayName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAthletes()
  }, [])

  const loadAthletes = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: athletesData, error: athletesError } = await supabase
        .from("athletes")
        .select("id")
        .eq("coach_id", user.id)

      if (athletesError) throw athletesError

      if (!athletesData || athletesData.length === 0) {
        setAthletes([])
        return
      }

      const athleteIds = athletesData.map((a) => a.id)
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", athleteIds)

      if (profilesError) throw profilesError

      const formattedAthletes = profilesData.map((profile) => ({
        id: profile.id,
        full_name: profile.full_name || profile.email,
        email: profile.email,
      }))

      setAthletes(formattedAthletes)
    } catch (err: any) {
      console.error("[v0] Error loading athletes:", err)
      setError(err.message)
    }
  }

  const addDay = () => {
    const newDay: TrainingDay = {
      id: `temp-${Date.now()}`,
      name: `Día ${days.length + 1}`,
      day_number: days.length + 1,
    }
    setDays([...days, newDay])
  }

  const removeDay = (dayId: string) => {
    setDays(days.filter((d) => d.id !== dayId))
  }

  const startEditingDay = (day: TrainingDay) => {
    setEditingDayId(day.id)
    setEditingDayName(day.name)
  }

  const saveEditingDay = () => {
    if (editingDayId && editingDayName.trim()) {
      setDays(days.map((d) => (d.id === editingDayId ? { ...d, name: editingDayName.trim() } : d)))
    }
    setEditingDayId(null)
    setEditingDayName("")
  }

  const cancelEditingDay = () => {
    setEditingDayId(null)
    setEditingDayName("")
  }

  const createBlock = async () => {
    if (!selectedAthleteId) {
      setError("Por favor selecciona un atleta")
      return
    }

    if (!blockName.trim()) {
      setError("Por favor ingresa un nombre para el bloque")
      return
    }

    if (days.length === 0) {
      setError("Por favor agrega al menos un día de entrenamiento")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("No autenticado")

      const { data: blockData, error: blockError } = await supabase
        .from("training_blocks")
        .insert({
          name: blockName,
          description: description || null,
          start_date: startDate || null,
          end_date: endDate || null,
          coach_id: user.id,
          total_weeks: 1,
          total_days: days.length,
          status: "draft",
        })
        .select()
        .single()

      if (blockError) throw blockError

      const { error: assignError } = await supabase.from("athlete_blocks").insert({
        athlete_id: selectedAthleteId,
        block_id: blockData.id,
        start_date: startDate || null,
        end_date: endDate || null,
      })

      if (assignError) throw assignError

      const daysToInsert = days.map((day, index) => ({
        block_id: blockData.id,
        name: day.name,
        day_number: index + 1,
        week_number: 1, // Default to week 1 for now
      }))

      const { error: daysError } = await supabase.from("training_days").insert(daysToInsert)

      if (daysError) throw daysError

      console.log("[v0] Block created successfully:", blockData.id)
      router.push("/coach")
    } catch (err: any) {
      console.error("[v0] Error creating block:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/coach")} className="h-10 w-10">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-semibold">Crear Bloque de Entrenamiento</h1>
        </div>

        {error && (
          <Card className="mb-4 border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </Card>
        )}

        <Card className="mb-4 p-4">
          <Label htmlFor="athlete" className="mb-2 block text-sm font-medium">
            Atleta
          </Label>
          <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
            <SelectTrigger id="athlete">
              <SelectValue placeholder="Seleccionar atleta" />
            </SelectTrigger>
            <SelectContent>
              {athletes.map((athlete) => (
                <SelectItem key={athlete.id} value={athlete.id}>
                  {athlete.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {athletes.length === 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              No tienes atletas asignados. Invita atletas desde la sección de gestión.
            </p>
          )}
        </Card>

        <Card className="mb-4 p-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="blockName" className="mb-2 block text-sm font-medium">
                Nombre del Bloque
              </Label>
              <Input
                id="blockName"
                value={blockName}
                onChange={(e) => setBlockName(e.target.value)}
                placeholder="Ej: Bloque de Fuerza - Semana 1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="mb-2 block text-sm font-medium">
                  Fecha de Inicio
                </Label>
                <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>

              <div>
                <Label htmlFor="endDate" className="mb-2 block text-sm font-medium">
                  Fecha de Fin
                </Label>
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="mb-2 block text-sm font-medium">
                Descripción
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción del bloque (opcional)"
                rows={3}
              />
            </div>
          </div>
        </Card>

        <Card className="mb-4 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Días de Entrenamiento</h2>
            <Button onClick={addDay} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Día
            </Button>
          </div>

          {days.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No hay días agregados. Haz clic en &quot;Agregar Día&quot; para comenzar.
            </p>
          ) : (
            <div className="space-y-2">
              {days.map((day) => (
                <div key={day.id} className="flex items-center gap-2 rounded-lg border bg-card p-3">
                  {editingDayId === day.id ? (
                    <>
                      <Input
                        value={editingDayName}
                        onChange={(e) => setEditingDayName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEditingDay()
                          if (e.key === "Escape") cancelEditingDay()
                        }}
                        className="flex-1"
                        autoFocus
                      />
                      <Button variant="ghost" size="sm" onClick={saveEditingDay}>
                        Guardar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={cancelEditingDay}>
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 font-medium">{day.name}</span>
                      <Button variant="ghost" size="icon" onClick={() => startEditingDay(day)} className="h-8 w-8">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeDay(day.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Nota: Después de crear el bloque, podrás agregar ejercicios a cada día desde la vista de detalle del bloque.
          </p>
        </Card>

        <Button
          onClick={createBlock}
          disabled={loading || !selectedAthleteId || !blockName || days.length === 0}
          className="w-full"
          size="lg"
        >
          {loading ? "Creando..." : "Crear Bloque"}
        </Button>
      </div>
    </div>
  )
}
