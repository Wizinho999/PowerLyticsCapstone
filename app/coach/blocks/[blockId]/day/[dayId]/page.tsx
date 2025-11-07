"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ChevronLeft, Plus, Trash2 } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"

interface Exercise {
  id: string
  exercise_id: string
  exercise_name: string
  target_sets: number | null
  target_reps: string | null
  target_rpe: number | null
  target_weight: number | null
  notes: string | null
}

export default function CoachDayDetailPage() {
  const params = useParams()
  const router = useRouter()
  const blockId = params.blockId as string
  const dayId = params.dayId as string
  const [dayName, setDayName] = useState("")
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [newExerciseName, setNewExerciseName] = useState("")
  const [newExerciseTargets, setNewExerciseTargets] = useState({
    sets: "",
    reps: "",
    rpe: "",
    weight: "",
  })

  useEffect(() => {
    loadDayData()
  }, [dayId])

  async function loadDayData() {
    try {
      setLoading(true)
      const supabase = createBrowserClient()

      // Load day info
      const { data: dayData, error: dayError } = await supabase
        .from("training_days")
        .select("name")
        .eq("id", dayId)
        .single()

      if (dayError) throw dayError
      setDayName(dayData.name)

      // Load exercises
      const { data: exercisesData, error: exercisesError } = await supabase
        .from("day_exercises")
        .select(`
          id,
          exercise_id,
          target_sets,
          target_reps,
          target_rpe,
          target_weight,
          notes,
          exercises (
            name
          )
        `)
        .eq("day_id", dayId)
        .order("created_at", { ascending: true })

      if (exercisesError) throw exercisesError

      setExercises(
        (exercisesData || []).map((ex: any) => ({
          id: ex.id,
          exercise_id: ex.exercise_id,
          exercise_name: ex.exercises?.name || "Sin nombre",
          target_sets: ex.target_sets,
          target_reps: ex.target_reps,
          target_rpe: ex.target_rpe,
          target_weight: ex.target_weight,
          notes: ex.notes,
        })),
      )
    } catch (err: any) {
      console.error("[v0] Error loading day:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddExercise() {
    if (!newExerciseName.trim()) return

    try {
      const supabase = createBrowserClient()
      const user = await supabase.auth.getUser()

      // Create exercise first
      const { data: exerciseData, error: exerciseError } = await supabase
        .from("exercises")
        .insert({
          name: newExerciseName,
          created_by: user.data.user?.id,
        })
        .select()
        .single()

      if (exerciseError) throw exerciseError

      // Add to day with targets
      const { error: dayExerciseError } = await supabase.from("day_exercises").insert({
        day_id: dayId,
        exercise_id: exerciseData.id,
        target_sets: newExerciseTargets.sets ? Number.parseInt(newExerciseTargets.sets) : null,
        target_reps: newExerciseTargets.reps || null,
        target_rpe: newExerciseTargets.rpe ? Number.parseFloat(newExerciseTargets.rpe) : null,
        target_weight: newExerciseTargets.weight ? Number.parseFloat(newExerciseTargets.weight) : null,
      })

      if (dayExerciseError) throw dayExerciseError

      // Reset form
      setNewExerciseName("")
      setNewExerciseTargets({ sets: "", reps: "", weight: "", rpe: "" })
      setShowAddExercise(false)

      // Reload exercises
      loadDayData()
    } catch (err: any) {
      console.error("[v0] Error adding exercise:", err)
      alert("Error al agregar ejercicio: " + err.message)
    }
  }

  async function handleDeleteExercise(exerciseId: string) {
    if (!confirm("¿Eliminar este ejercicio?")) return

    try {
      const supabase = createBrowserClient()
      const { error } = await supabase.from("day_exercises").delete().eq("id", exerciseId)

      if (error) throw error
      loadDayData()
    } catch (err: any) {
      console.error("[v0] Error deleting exercise:", err)
      alert("Error al eliminar ejercicio: " + err.message)
    }
  }

  if (loading) {
    return (
      <AuthGuard requiredRole="coach">
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-muted-foreground">Cargando día...</p>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requiredRole="coach">
      <div className="min-h-screen bg-background p-4">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/coach/blocks/${blockId}`)}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="flex-1 text-2xl font-bold">{dayName}</h1>
        </div>

        {/* Exercises List */}
        <div className="mb-6 space-y-3">
          {exercises.map((exercise) => (
            <Card key={exercise.id} className="p-4">
              <div className="mb-2 flex items-start justify-between">
                <h3 className="font-medium">{exercise.exercise_name}</h3>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteExercise(exercise.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Sets</p>
                  <p className="font-medium">{exercise.target_sets || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reps</p>
                  <p className="font-medium">{exercise.target_reps || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">RPE</p>
                  <p className="font-medium">{exercise.target_rpe || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Peso</p>
                  <p className="font-medium">{exercise.target_weight ? `${exercise.target_weight} kg` : "-"}</p>
                </div>
              </div>
              {exercise.notes && <p className="mt-2 text-sm text-muted-foreground">{exercise.notes}</p>}
            </Card>
          ))}
        </div>

        {/* Add Exercise Form */}
        {showAddExercise ? (
          <Card className="p-4">
            <h3 className="mb-4 font-medium">Agregar Ejercicio</h3>
            <div className="space-y-3">
              <Input
                placeholder="Nombre del ejercicio"
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Sets"
                  value={newExerciseTargets.sets}
                  onChange={(e) => setNewExerciseTargets({ ...newExerciseTargets, sets: e.target.value })}
                />
                <Input
                  placeholder="Reps (ej: 8-10)"
                  value={newExerciseTargets.reps}
                  onChange={(e) => setNewExerciseTargets({ ...newExerciseTargets, reps: e.target.value })}
                />
                <Input
                  type="number"
                  step="0.5"
                  placeholder="RPE"
                  value={newExerciseTargets.rpe}
                  onChange={(e) => setNewExerciseTargets({ ...newExerciseTargets, rpe: e.target.value })}
                />
                <Input
                  type="number"
                  step="0.5"
                  placeholder="Peso (kg)"
                  value={newExerciseTargets.weight}
                  onChange={(e) => setNewExerciseTargets({ ...newExerciseTargets, weight: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddExercise} className="flex-1">
                  Agregar
                </Button>
                <Button variant="outline" onClick={() => setShowAddExercise(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Button onClick={() => setShowAddExercise(true)} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Agregar Ejercicio
          </Button>
        )}
      </div>
    </AuthGuard>
  )
}
