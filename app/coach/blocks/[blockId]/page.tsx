"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, ArrowLeft, Copy, Edit } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { updateExerciseSets } from "@/lib/supabase/actions" // Assuming this is the server action

interface TrainingDay {
  id: string
  name: string
  day_number: number
  scheduled_date: string | null
  week_number: number
}

interface ExerciseSet {
  id: string
  set_number: number
  target_reps: number
  target_weight: number | null
  target_rpe: number | null
  target_percentage: number | null
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
  description: string | null
  total_weeks: number
}

interface NewSet {
  reps: string
  weight: string
  rpe: string
}

interface CoachBlockPageProps {
  params: { blockId: string }
}

export default function CoachBlockPage({ params }: CoachBlockPageProps) {
  const { blockId } = params
  const router = useRouter()
  const supabase = createClient()

  const [block, setBlock] = useState<any>(null)
  const [days, setDays] = useState<any[]>([])
  const [currentDayIndex, setCurrentDayIndex] = useState(0)
  const [exercisesByDay, setExercisesByDay] = useState<Record<string, any[]>>({})
  const [selectedExercise, setSelectedExercise] = useState<any>(null)
  const [sets, setSets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [athletes, setAthletes] = useState<any[]>([])
  const [showAddExerciseForm, setShowAddExerciseForm] = useState(false)
  const [newExercise, setNewExercise] = useState({ name: "", sets: [{ reps: "", rpe: "", weight: "" }] })
  const [openWeek, setOpenWeek] = useState<string>("week-1") // Track which week accordion is open
  const [showDateEditor, setShowDateEditor] = useState(false) // Declared setShowDateEditor variable
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null)
  const [editingExercise, setEditingExercise] = useState<{
    name: string
    sets: { id: string; set_number: number; reps: number; weight: number | null; rpe: number | null }[]
  } | null>(null)

  const daysByWeek = days.reduce(
    (acc, day) => {
      const weekNum = day.week_number || 1
      if (!acc[weekNum]) {
        acc[weekNum] = []
      }
      acc[weekNum].push(day)
      return acc
    },
    {} as Record<number, any[]>,
  )

  const weekNumbers = Object.keys(daysByWeek)
    .map(Number)
    .sort((a, b) => a - b)

  useEffect(() => {
    if (blockId !== "new") {
      loadBlockData()
    }
  }, [blockId])

  async function loadBlockData() {
    if (blockId === "new") {
      setLoading(false)
      return
    }

    try {
      const { data: blockData, error: blockError } = await supabase
        .from("training_blocks")
        .select("id, name, start_date, end_date, description, total_weeks")
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
        .select("id, name, day_number, scheduled_date, week_number")
        .eq("block_id", blockId)
        .order("week_number, day_number")

      if (daysError) throw daysError
      setDays(daysData || [])

      if (daysData && daysData.length > 0) {
        await loadAllExercises(daysData.map((d) => d.id))
      }

      setLoading(false)
    } catch (err: any) {
      console.error("[v0] Error loading block:", err)
      setLoading(false)
    }
  }

  async function loadAllExercises(dayIds: string[]) {
    try {
      console.log("[v0] Pre-loading exercises for", dayIds.length, "days")

      // Load ALL exercises for ALL days in ONE query
      const { data: exercisesData, error: exercisesError } = await supabase
        .from("day_exercises")
        .select(`
          id,
          training_day_id,
          exercises (name),
          exercise_sets (
            id,
            set_number,
            target_reps,
            target_weight,
            target_rpe,
            target_percentage
          )
        `)
        .in("training_day_id", dayIds)
        .order("order_index")

      if (exercisesError) throw exercisesError

      // Get all exercise IDs to fetch logs
      const exerciseIds = (exercisesData || []).map((ex: any) => ex.id)

      // Fetch ALL logs in ONE query
      const { data: logsData } = await supabase
        .from("exercise_logs")
        .select("day_exercise_id")
        .in("day_exercise_id", exerciseIds)

      // Count logs per exercise in memory
      const logCounts = (logsData || []).reduce((acc: Record<string, number>, log: any) => {
        acc[log.day_exercise_id] = (acc[log.day_exercise_id] || 0) + 1
        return acc
      }, {})

      // Group exercises by day
      const exercisesByDayMap: Record<string, any[]> = {}

      for (const ex of exercisesData || []) {
        const dayId = ex.training_day_id
        if (!exercisesByDayMap[dayId]) {
          exercisesByDayMap[dayId] = []
        }

        exercisesByDayMap[dayId].push({
          id: ex.id,
          exercise_name: ex.exercises?.name || "Sin nombre",
          sets: ex.exercise_sets || [],
          actual_sets: logCounts[ex.id] || 0,
        })
      }

      setExercisesByDay(exercisesByDayMap)
      console.log("[v0] Pre-loaded exercises for", Object.keys(exercisesByDayMap).length, "days")
    } catch (err: any) {
      console.error("[v0] Error pre-loading exercises:", err.message)
    }
  }

  async function handleAddExercise() {
    if (saving) return

    if (!newExercise.name.trim() || !days[currentDayIndex]) return

    const validSets = newExercise.sets.filter((s) => s.reps)
    if (validSets.length === 0) {
      alert("Debes agregar al menos una serie con repeticiones")
      return
    }

    setSaving(true)

    try {
      const { data: user } = await supabase.auth.getUser()

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

      const { data: dayExData, error: dayExError } = await supabase
        .from("day_exercises")
        .insert({
          training_day_id: days[currentDayIndex].id,
          exercise_id: exerciseData.id,
          target_sets: validSets.length,
          order_index: exercisesByDay[days[currentDayIndex].id]?.length || 0,
        })
        .select()
        .single()

      if (dayExError) throw dayExError

      const setsToInsert = validSets.map((set, index) => ({
        day_exercise_id: dayExData.id,
        set_number: index + 1,
        target_reps: Number.parseInt(set.reps),
        target_weight: set.weight ? Number.parseFloat(set.weight) : null,
        target_rpe: set.rpe ? Number.parseFloat(set.rpe) : null,
        target_percentage: set.target_percentage ? Number.parseFloat(set.target_percentage) : null,
      }))

      const { error: setsError } = await supabase.from("exercise_sets").insert(setsToInsert)

      if (setsError) throw setsError

      setNewExercise({ name: "", sets: [{ reps: "", weight: "", rpe: "", target_percentage: "" }] })
      setShowAddExerciseForm(false)
      await loadAllExercises([days[currentDayIndex].id])
    } catch (err: any) {
      console.error("[v0] Error adding exercise:", err)
      alert("Error: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  function addNewSet() {
    setNewExercise({
      ...newExercise,
      sets: [...newExercise.sets, { reps: "", weight: "", rpe: "", target_percentage: "" }],
    })
  }

  function updateNewSet(index: number, field: keyof NewSet, value: string) {
    const updatedSets = [...newExercise.sets]
    updatedSets[index][field] = value
    setNewExercise({ ...newExercise, sets: updatedSets })
  }

  function removeNewSet(index: number) {
    if (newExercise.sets.length > 1) {
      setNewExercise({
        ...newExercise,
        sets: newExercise.sets.filter((_, i) => i !== index),
      })
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
      const { error } = await supabase.from("day_exercises").delete().eq("id", exerciseId)

      if (error) throw error

      await loadAllExercises([days[currentDayIndex].id])
    } catch (err: any) {
      console.error("[v0] Error deleting exercise:", err)
      alert("Error al eliminar ejercicio: " + err.message)
    }
  }

  async function handleSaveDates() {
    setSaving(true)
    try {
      for (const day of days) {
        const newDate = editingDates[day.id]
        if (newDate) {
          const { error } = await supabase.from("training_days").update({ scheduled_date: newDate }).eq("id", day.id)

          if (error) throw error
        }
      }

      alert("Fechas actualizadas correctamente")
      setShowDateEditor(false)
      await loadBlockData()
    } catch (err: any) {
      console.error("[v0] Error saving dates:", err)
      alert("Error al guardar fechas: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  const editingDates = days.reduce(
    (acc, day) => {
      acc[day.id] = day.scheduled_date || ""
      return acc
    },
    {} as Record<string, string>,
  )

  function updateEditingDate(dayId: string, date: string) {
    setDays(days.map((day) => (day.id === dayId ? { ...day, scheduled_date: date } : day)))
  }

  const addWeek = async () => {
    if (!block) return

    try {
      setSaving(true)

      const maxWeek = Math.max(...weekNumbers, 0)
      const newWeekNumber = maxWeek + 1
      const lastWeekDays = daysByWeek[maxWeek] || []

      if (lastWeekDays.length === 0) {
        alert("No hay días en la última semana para duplicar")
        setSaving(false)
        return
      }

      // Get all exercises from last week
      const lastWeekDayIds = lastWeekDays.map((d) => d.id)
      const { data: allOldExercises, error: exercisesError } = await supabase
        .from("day_exercises")
        .select("*, exercise_sets(*)")
        .in("training_day_id", lastWeekDayIds)
        .order("order_index")

      if (exercisesError) throw exercisesError

      // Create new days
      const newDaysToInsert = lastWeekDays.map((oldDay) => {
        const oldDate = new Date(oldDay.scheduled_date)
        const newDate = new Date(oldDate)
        newDate.setDate(newDate.getDate() + 7)

        return {
          block_id: block.id,
          name: oldDay.name,
          week_number: newWeekNumber,
          day_number: oldDay.day_number,
          scheduled_date: newDate.toISOString().split("T")[0],
        }
      })

      const { data: newDays, error: daysError } = await supabase.from("training_days").insert(newDaysToInsert).select()

      if (daysError) throw daysError

      const { error: updateBlockError } = await supabase
        .from("training_blocks")
        .update({ total_weeks: newWeekNumber })
        .eq("id", block.id)

      if (updateBlockError) throw updateBlockError

      // Map old day IDs to new day IDs
      const dayIdMap = new Map<string, string>()
      lastWeekDays.forEach((oldDay, index) => {
        dayIdMap.set(oldDay.id, newDays[index].id)
      })

      // Create exercises
      if (allOldExercises && allOldExercises.length > 0) {
        const newExercisesToInsert = allOldExercises.map((oldExercise) => ({
          training_day_id: dayIdMap.get(oldExercise.training_day_id)!,
          exercise_id: oldExercise.exercise_id,
          order_index: oldExercise.order_index,
          target_sets: oldExercise.target_sets,
          target_reps: oldExercise.target_reps,
          target_rpe: oldExercise.target_rpe,
          target_weight: oldExercise.target_weight,
          notes: oldExercise.notes,
        }))

        const { data: newExercises, error: newExercisesError } = await supabase
          .from("day_exercises")
          .insert(newExercisesToInsert)
          .select()

        if (newExercisesError) throw newExercisesError

        // Map old exercise IDs to new exercise IDs
        const exerciseIdMap = new Map<string, string>()
        allOldExercises.forEach((oldEx, index) => {
          exerciseIdMap.set(oldEx.id, newExercises[index].id)
        })

        // Create sets
        const newSetsToInsert: any[] = []
        allOldExercises.forEach((oldExercise) => {
          if (oldExercise.exercise_sets && oldExercise.exercise_sets.length > 0) {
            const newExerciseId = exerciseIdMap.get(oldExercise.id)
            if (newExerciseId) {
              oldExercise.exercise_sets.forEach((set: any) => {
                newSetsToInsert.push({
                  day_exercise_id: newExerciseId,
                  set_number: set.set_number,
                  target_reps: set.target_reps,
                  target_weight: set.target_weight,
                  target_rpe: set.target_rpe,
                  target_percentage: set.target_percentage,
                })
              })
            }
          }
        })

        if (newSetsToInsert.length > 0) {
          const { error: setsError } = await supabase.from("exercise_sets").insert(newSetsToInsert)
          if (setsError) throw setsError
        }
      }

      // Reload all data
      await loadBlockData()
      alert(`Semana ${newWeekNumber} creada exitosamente`)
    } catch (error: any) {
      console.error("[v0] Error adding week:", error)
      alert(`Error al agregar semana: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const currentDay = days[currentDayIndex]
  const exercises = currentDay ? exercisesByDay[currentDay.id] || [] : []

  const handleEditExercise = (exercise: Exercise) => {
    setEditingExerciseId(exercise.id)
    setEditingExercise({
      name: exercise.exercise_name,
      sets: exercise.sets.map((set) => ({
        id: set.id,
        set_number: set.set_number,
        reps: set.target_reps,
        weight: set.target_weight,
        rpe: set.target_rpe,
      })),
    })
  }

  const handleSaveEditedExercise = async () => {
    if (!editingExerciseId || !editingExercise) return

    setSaving(true)
    try {
      const updates = editingExercise.sets.map((set) => ({
        id: set.id,
        reps: set.reps,
        weight: set.weight,
        rpe: set.rpe,
      }))

      await updateExerciseSets(updates)

      // Update local state
      setExercisesByDay((prev) => {
        const newState = { ...prev }
        const dayExercises = newState[currentDay?.id || ""]
        if (dayExercises) {
          const exerciseIndex = dayExercises.findIndex((ex) => ex.id === editingExerciseId)
          if (exerciseIndex !== -1) {
            dayExercises[exerciseIndex] = {
              ...dayExercises[exerciseIndex],
              sets: dayExercises[exerciseIndex].sets.map((existingSet) => {
                const editedSet = editingExercise.sets.find((s) => s.id === existingSet.id)
                if (editedSet) {
                  return {
                    ...existingSet,
                    target_reps: editedSet.reps,
                    target_weight: editedSet.weight,
                    target_rpe: editedSet.rpe,
                  }
                }
                return existingSet
              }),
            }
          }
        }
        return newState
      })

      setEditingExerciseId(null)
      setEditingExercise(null)
      alert("Ejercicio actualizado exitosamente")
    } catch (error) {
      console.error("[v0] Error updating exercise:", error)
      alert("Error al actualizar ejercicio. Por favor intenta de nuevo.")
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingExerciseId(null)
    setEditingExercise(null)
  }

  const updateEditingSet = (index: number, field: "reps" | "weight" | "rpe", value: string) => {
    if (!editingExercise) return

    const newSets = [...editingExercise.sets]
    if (field === "reps") {
      newSets[index].reps = Number.parseInt(value) || 0
    } else if (field === "weight") {
      newSets[index].weight = value ? Number.parseFloat(value) : null
    } else if (field === "rpe") {
      newSets[index].rpe = value ? Number.parseFloat(value) : null
    }

    setEditingExercise({ ...editingExercise, sets: newSets })
  }

  if (!block && blockId !== "new") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando bloque...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/coach")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{block?.name || "Bloque sin nombre"}</h1>
            <p className="text-sm text-muted-foreground">
              {block?.total_weeks || weekNumbers.length}{" "}
              {block?.total_weeks || weekNumbers.length === 1 ? "semana" : "semanas"} • {days.length}{" "}
              {days.length === 1 ? "día" : "días"}
            </p>
          </div>
        </div>
        <Button onClick={addWeek} variant="outline" className="gap-2 bg-transparent">
          <Copy className="h-4 w-4" />
          Agregar Semana {Math.max(...weekNumbers, 0) + 1}
        </Button>
      </div>

      <Card className="p-4">
        <Accordion type="single" collapsible value={openWeek} onValueChange={setOpenWeek}>
          {weekNumbers.map((weekNum) => (
            <AccordionItem key={`week-${weekNum}`} value={`week-${weekNum}`}>
              <AccordionTrigger className="text-lg font-semibold">
                Semana {weekNum} ({daysByWeek[weekNum].length} {daysByWeek[weekNum].length === 1 ? "día" : "días"})
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap gap-2 pt-2">
                  {daysByWeek[weekNum].map((day) => {
                    const dayIndex = days.findIndex((d) => d.id === day.id)
                    return (
                      <Button
                        key={day.id}
                        variant={dayIndex === currentDayIndex ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentDayIndex(dayIndex)}
                        className={dayIndex === currentDayIndex ? "bg-teal-500 hover:bg-teal-600" : ""}
                      >
                        {day?.name || `Día ${day?.day_number}`}
                      </Button>
                    )
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>

      {/* Current Day Content */}
      {currentDay && !blockId.includes("new") && (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-xl">{currentDay.name || `Día ${currentDay.day_number}`}</CardTitle>
          </CardHeader>

          {loading ? (
            <CardContent>
              <p className="text-center text-muted-foreground">Cargando ejercicios...</p>
            </CardContent>
          ) : (
            exercises.map((exercise) => (
              <Card key={exercise.id} className="bg-white border-0 shadow-sm">
                <CardContent className="p-4">
                  {editingExerciseId === exercise.id ? (
                    // Edit mode
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-foreground">{editingExercise?.name}</h3>
                      </div>

                      <div className="space-y-2">
                        <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-2 text-center text-xs font-medium text-muted-foreground mb-2">
                          <div className="w-16">SET</div>
                          <div>PESO (kg)</div>
                          <div>REPS</div>
                          <div>RPE</div>
                        </div>
                        {editingExercise?.sets.map((set, index) => (
                          <div key={set.id} className="grid grid-cols-[auto_1fr_1fr_1fr] gap-2">
                            <div className="w-16 bg-gray-100 rounded-lg p-2 text-center text-sm font-medium flex items-center justify-center">
                              {index + 1}
                            </div>
                            <Input
                              type="number"
                              step="0.5"
                              placeholder="-"
                              value={set.weight || ""}
                              onChange={(e) => updateEditingSet(index, "weight", e.target.value)}
                              className="text-center"
                            />
                            <Input
                              type="number"
                              placeholder="0"
                              value={set.reps}
                              onChange={(e) => updateEditingSet(index, "reps", e.target.value)}
                              className="text-center"
                            />
                            <Input
                              type="number"
                              step="0.5"
                              placeholder="-"
                              value={set.rpe || ""}
                              onChange={(e) => updateEditingSet(index, "rpe", e.target.value)}
                              className="text-center"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveEditedExercise}
                          disabled={saving}
                          className="flex-1 bg-teal-500 hover:bg-teal-600"
                        >
                          {saving ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                        <Button variant="outline" disabled={saving} onClick={handleCancelEdit}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{exercise.exercise_name}</h3>
                          <p className="text-sm text-muted-foreground">{exercise.sets.length} series</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditExercise(exercise)}
                            className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteExercise(exercise.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

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
                    </>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </Card>
      )}

      {showAddExerciseForm ? (
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
                <Label className="text-sm font-medium mb-2">Series</Label>
                <div className="space-y-2">
                  <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-2 text-center text-xs font-medium text-muted-foreground mb-2">
                    <div className="w-12">SET</div>
                    <div>PESO (kg)</div>
                    <div>REPS</div>
                    <div>RPE</div>
                    <div className="w-10"></div>
                  </div>
                  {newExercise.sets.map((set, index) => (
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
                        disabled={newExercise.sets.length === 1}
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
                <Button
                  onClick={handleAddExercise}
                  disabled={saving || !newExercise.name.trim()}
                  className="flex-1 bg-teal-500 hover:bg-teal-600"
                >
                  {saving ? "Agregando..." : "Agregar Ejercicio"}
                </Button>
                <Button
                  variant="outline"
                  disabled={saving}
                  onClick={() => {
                    setShowAddExerciseForm(false)
                    setNewExercise({ name: "", sets: [{ reps: "", weight: "", rpe: "", target_percentage: "" }] })
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setShowAddExerciseForm(true)} className="w-full bg-teal-500 hover:bg-teal-600 h-12">
          <Plus className="mr-2 h-5 w-5" />
          Agregar Ejercicio
        </Button>
      )}
    </div>
  )
}
