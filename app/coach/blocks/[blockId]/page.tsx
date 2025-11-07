"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"

interface TrainingDay {
  id: string
  name: string
  day_number: number
}

interface ExerciseSet {
  id: string
  set_number: number
  target_reps: number
  target_weight: number | null
  target_rpe: number | null
}

interface Exercise {
  id: string
  exercise_name: string
  sets: ExerciseSet[]
  actual_sets: number
}

interface Block {
  id: string
  name: string
  athlete_name: string
  start_date: string | null
  end_date: string | null
}

interface NewSet {
  reps: string
  weight: string
  rpe: string
}

export default function CoachBlockDetailPage() {
  const params = useParams()
  const router = useRouter()
  const blockId = params.blockId as string

  const [block, setBlock] = useState<Block | null>(null)
  const [days, setDays] = useState<TrainingDay[]>([])
  const [currentDayIndex, setCurrentDayIndex] = useState(0)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [newExercise, setNewExercise] = useState({
    name: "",
  })
  const [newSets, setNewSets] = useState<NewSet[]>([{ reps: "", weight: "", rpe: "" }])

  useEffect(() => {
    loadBlockData()
  }, [blockId])

  useEffect(() => {
    if (days.length > 0) {
      loadDayExercises(days[currentDayIndex].id)
    }
  }, [currentDayIndex, days])

  async function loadBlockData() {
    try {
      const supabase = createBrowserClient()

      const { data: blockData, error: blockError } = await supabase
        .from("training_blocks")
        .select("id, name, start_date, end_date")
        .eq("id", blockId)
        .single()

      if (blockError) throw blockError

      const { data: athleteBlockData } = await supabase
        .from("athlete_blocks")
        .select("athlete_id")
        .eq("block_id", blockId)
        .single()

      if (athleteBlockData) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", athleteBlockData.athlete_id)
          .single()

        setBlock({
          ...blockData,
          athlete_name: profileData?.full_name || profileData?.email || "Sin nombre",
        })
      }

      const { data: daysData, error: daysError } = await supabase
        .from("training_days")
        .select("id, name, day_number")
        .eq("block_id", blockId)
        .order("day_number")

      if (daysError) throw daysError
      setDays(daysData || [])

      setLoading(false)
    } catch (err: any) {
      console.error("[v0] Error loading block:", err)
      setLoading(false)
    }
  }

  async function loadDayExercises(dayId: string) {
    try {
      const supabase = createBrowserClient()

      const { data: exercisesData, error } = await supabase
        .from("day_exercises")
        .select(`
          id,
          exercises (name),
          exercise_sets (
            id,
            set_number,
            target_reps,
            target_weight,
            target_rpe
          )
        `)
        .eq("training_day_id", dayId)
        .order("order_index")

      if (error) throw error

      const formattedExercises = await Promise.all(
        (exercisesData || []).map(async (ex: any) => {
          const { count } = await supabase
            .from("exercise_logs")
            .select("*", { count: "exact", head: true })
            .eq("day_exercise_id", ex.id)

          return {
            id: ex.id,
            exercise_name: ex.exercises?.name || "Sin nombre",
            sets: ex.exercise_sets || [],
            actual_sets: count || 0,
          }
        }),
      )

      setExercises(formattedExercises)
    } catch (err: any) {
      console.error("[v0] Error loading exercises:", err)
    }
  }

  async function handleAddExercise() {
    if (!newExercise.name.trim() || !days[currentDayIndex]) return

    const validSets = newSets.filter((s) => s.reps)
    if (validSets.length === 0) {
      alert("Debes agregar al menos una serie con repeticiones")
      return
    }

    try {
      const supabase = createBrowserClient()
      const { data: user } = await supabase.auth.getUser()

      console.log("[v0] Creating exercise:", newExercise.name)

      const { data: exerciseData, error: exerciseError } = await supabase
        .from("exercises")
        .insert({
          name: newExercise.name,
          category: "custom",
          created_by: user.user?.id,
        })
        .select()
        .single()

      if (exerciseError) throw exerciseError
      console.log("[v0] Exercise created:", exerciseData)

      const { data: dayExData, error: dayExError } = await supabase
        .from("day_exercises")
        .insert({
          training_day_id: days[currentDayIndex].id,
          exercise_id: exerciseData.id,
          target_sets: validSets.length,
          order_index: exercises.length,
        })
        .select()
        .single()

      if (dayExError) throw dayExError
      console.log("[v0] Day exercise created:", dayExData)

      const setsToInsert = validSets.map((set, index) => ({
        day_exercise_id: dayExData.id,
        set_number: index + 1,
        target_reps: Number.parseInt(set.reps),
        target_weight: set.weight ? Number.parseFloat(set.weight) : null,
        target_rpe: set.rpe ? Number.parseFloat(set.rpe) : null,
      }))

      console.log("[v0] Inserting sets:", setsToInsert)

      const { data: setsData, error: setsError } = await supabase.from("exercise_sets").insert(setsToInsert).select()

      if (setsError) throw setsError
      console.log("[v0] Sets created:", setsData)

      setNewExercise({ name: "" })
      setNewSets([{ reps: "", weight: "", rpe: "" }])
      setShowAddExercise(false)
      loadDayExercises(days[currentDayIndex].id)
    } catch (err: any) {
      console.error("[v0] Error adding exercise:", err)
      alert("Error: " + err.message)
    }
  }

  function addNewSet() {
    setNewSets([...newSets, { reps: "", weight: "", rpe: "" }])
  }

  function updateNewSet(index: number, field: keyof NewSet, value: string) {
    const updated = [...newSets]
    updated[index][field] = value
    setNewSets(updated)
  }

  function removeNewSet(index: number) {
    if (newSets.length > 1) {
      setNewSets(newSets.filter((_, i) => i !== index))
    }
  }

  function navigateDay(direction: "prev" | "next") {
    if (direction === "prev" && currentDayIndex > 0) {
      setCurrentDayIndex(currentDayIndex - 1)
    } else if (direction === "next" && currentDayIndex < days.length - 1) {
      setCurrentDayIndex(currentDayIndex + 1)
    }
  }

  async function handleDeleteExercise(exerciseId: string) {
    if (!confirm("¿Estás seguro de que quieres eliminar este ejercicio?")) return

    try {
      const supabase = createBrowserClient()

      const { error } = await supabase.from("day_exercises").delete().eq("id", exerciseId)

      if (error) throw error

      loadDayExercises(days[currentDayIndex].id)
    } catch (err: any) {
      console.error("[v0] Error deleting exercise:", err)
      alert("Error al eliminar ejercicio: " + err.message)
    }
  }

  if (loading) {
    return (
      <AuthGuard requiredRole="coach">
        <div className="flex min-h-screen items-center justify-center bg-muted">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </AuthGuard>
    )
  }

  const currentDay = days[currentDayIndex]

  return (
    <AuthGuard requiredRole="coach">
      <div className="min-h-screen bg-muted px-4 py-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/coach")} className="text-teal-500">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">{block?.name}</h1>
            <p className="text-sm text-muted-foreground">Atleta: {block?.athlete_name}</p>
          </div>
        </div>

        {days.length > 0 && (
          <div className="mb-6 flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDay("prev")}
              disabled={currentDayIndex === 0}
              className="text-teal-500"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <div className="flex flex-1 gap-2 overflow-x-auto">
              {days.map((day, index) => (
                <Button
                  key={day.id}
                  variant={index === currentDayIndex ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentDayIndex(index)}
                  className={index === currentDayIndex ? "bg-teal-500 hover:bg-teal-600" : ""}
                >
                  {day.name}
                </Button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDay("next")}
              disabled={currentDayIndex === days.length - 1}
              className="text-teal-500"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        {currentDay && <h2 className="mb-6 text-2xl font-bold text-foreground">{currentDay.name}</h2>}

        <div className="mb-6 space-y-4">
          {exercises.length === 0 ? (
            <Card className="bg-white">
              <CardContent className="py-12 text-center">
                <p className="mb-4 text-muted-foreground">No hay ejercicios en este día</p>
              </CardContent>
            </Card>
          ) : (
            exercises.map((exercise) => (
              <Card key={exercise.id} className="bg-white border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{exercise.exercise_name}</h3>
                      <p className="text-sm text-muted-foreground">{exercise.sets.length} series</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteExercise(exercise.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <Tabs defaultValue="target" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-transparent">
                      <TabsTrigger
                        value="target"
                        className="data-[state=active]:bg-transparent data-[state=active]:text-teal-500 data-[state=active]:border-b-2 data-[state=active]:border-teal-500 rounded-none"
                      >
                        TARGET
                      </TabsTrigger>
                      <TabsTrigger
                        value="actual"
                        className="data-[state=active]:bg-transparent data-[state=active]:text-teal-500 data-[state=active]:border-b-2 data-[state=active]:border-teal-500 rounded-none"
                      >
                        PROGRESO
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="target" className="mt-4">
                      {exercise.sets.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-4">No hay series definidas</p>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-2 text-center text-xs font-medium text-muted-foreground mb-2">
                            <div className="w-16">SET</div>
                            <div>PESO</div>
                            <div>REPS</div>
                            <div>RPE</div>
                          </div>
                          {exercise.sets.map((set) => (
                            <div key={set.id} className="grid grid-cols-[auto_1fr_1fr_1fr] gap-2">
                              <div className="w-16 bg-gray-100 rounded-lg p-2 text-center text-sm font-medium">
                                {set.set_number}
                              </div>
                              <div className="bg-gray-100 rounded-lg p-2 text-center text-sm font-medium">
                                {set.target_weight ? `${set.target_weight}kg` : "-"}
                              </div>
                              <div className="bg-gray-100 rounded-lg p-2 text-center text-sm font-medium">
                                {set.target_reps}
                              </div>
                              <div className="bg-gray-100 rounded-lg p-2 text-center text-sm font-medium">
                                {set.target_rpe || "-"}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="actual" className="mt-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          El atleta ha completado{" "}
                          <span className="font-medium text-teal-500">{exercise.actual_sets}</span> de{" "}
                          <span className="font-medium">{exercise.sets.length}</span> sets
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {showAddExercise ? (
          <Card className="bg-white">
            <CardContent className="p-4">
              <h3 className="mb-4 font-medium">Agregar Ejercicio</h3>
              <div className="space-y-4">
                <Input
                  placeholder="Nombre del ejercicio"
                  value={newExercise.name}
                  onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                />

                <div>
                  <p className="text-sm font-medium mb-2">Series</p>
                  <div className="space-y-2">
                    <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-2 text-center text-xs font-medium text-muted-foreground mb-2">
                      <div className="w-12">SET</div>
                      <div>PESO (kg)</div>
                      <div>REPS</div>
                      <div>RPE</div>
                      <div className="w-10"></div>
                    </div>
                    {newSets.map((set, index) => (
                      <div key={index} className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-2">
                        <div className="w-12 bg-gray-100 rounded-lg p-2 text-center text-sm font-medium flex items-center justify-center">
                          {index + 1}
                        </div>
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="-"
                          value={set.weight}
                          onChange={(e) => updateNewSet(index, "weight", e.target.value)}
                          className="text-center"
                        />
                        <Input
                          type="number"
                          placeholder="0"
                          value={set.reps}
                          onChange={(e) => updateNewSet(index, "reps", e.target.value)}
                          className="text-center"
                        />
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="-"
                          value={set.rpe}
                          onChange={(e) => updateNewSet(index, "rpe", e.target.value)}
                          className="text-center"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeNewSet(index)}
                          disabled={newSets.length === 1}
                          className="w-10 h-10"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addNewSet}
                    className="w-full mt-2 text-teal-500 border-teal-500 bg-transparent"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Serie
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleAddExercise} className="flex-1 bg-teal-500 hover:bg-teal-600">
                    Agregar Ejercicio
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddExercise(false)
                      setNewExercise({ name: "" })
                      setNewSets([{ reps: "", weight: "", rpe: "" }])
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button onClick={() => setShowAddExercise(true)} className="w-full bg-teal-500 hover:bg-teal-600 h-12">
            <Plus className="mr-2 h-5 w-5" />
            Agregar Ejercicio
          </Button>
        )}
      </div>
    </AuthGuard>
  )
}
