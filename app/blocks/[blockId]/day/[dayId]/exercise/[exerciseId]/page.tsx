"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, Plus, MoreHorizontal } from "lucide-react"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { createBrowserClient } from "@/lib/supabase/client"

interface ExerciseSet {
  id: string
  set_number: number
  target_reps: number
  target_weight: number | null
  target_rpe: number | null
}

interface ExerciseLog {
  id: string
  set_number: number
  actual_weight: number
  actual_reps: number
  actual_rpe: number | null
}

interface NewSet {
  weight: string
  reps: string
  rpe: string
}

export default function ExerciseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createBrowserClient()

  const [activeTab, setActiveTab] = useState("actual")
  const [exerciseName, setExerciseName] = useState("")
  const [targetSets, setTargetSets] = useState<ExerciseSet[]>([])
  const [actualLogs, setActualLogs] = useState<ExerciseLog[]>([])
  const [newSets, setNewSets] = useState<NewSet[]>([])
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [e1rm, setE1rm] = useState(0)
  const [tonnage, setTonnage] = useState(0)

  const dayExerciseId = params.exerciseId as string

  useEffect(() => {
    loadExerciseData()
  }, [dayExerciseId])

  useEffect(() => {
    calculateStats()
  }, [actualLogs])

  async function loadExerciseData() {
    try {
      console.log("[v0] Loading exercise data for:", dayExerciseId)

      const { data: dayExercise, error: dayExError } = await supabase
        .from("day_exercises")
        .select(`
          *,
          exercise:exercises(name),
          training_day:training_days(*)
        `)
        .eq("id", dayExerciseId)
        .single()

      if (dayExError) throw dayExError
      if (!dayExercise) throw new Error("Exercise not found")

      console.log("[v0] Day exercise loaded:", dayExercise)
      setExerciseName(dayExercise.exercise.name)
      setNotes(dayExercise.notes || "")

      const { data: sets, error: setsError } = await supabase
        .from("exercise_sets")
        .select("*")
        .eq("day_exercise_id", dayExerciseId)
        .order("set_number")

      if (setsError) throw setsError
      console.log("[v0] Target sets loaded:", sets)
      setTargetSets(sets || [])

      const { data: user } = await supabase.auth.getUser()
      if (user.user) {
        console.log("[v0] Loading logs for athlete:", user.user.id)
        const { data: logs, error: logsError } = await supabase
          .from("exercise_logs")
          .select("*")
          .eq("day_exercise_id", dayExerciseId)
          .eq("athlete_id", user.user.id)
          .order("set_number")

        if (logsError) {
          console.error("[v0] Error loading logs:", logsError)
          throw logsError
        }
        console.log("[v0] Actual logs loaded:", logs)
        setActualLogs(logs || [])

        if ((!logs || logs.length === 0) && sets && sets.length > 0) {
          console.log("[v0] No logs found, adding empty rows to match target sets")
          setNewSets(sets.map(() => ({ weight: "", reps: "", rpe: "" })))
        }
      }

      setLoading(false)
    } catch (error: any) {
      console.error("[v0] Error loading exercise:", error.message)
      setLoading(false)
    }
  }

  function calculateStats() {
    if (actualLogs.length === 0) {
      setE1rm(0)
      setTonnage(0)
      return
    }

    const maxE1rm = Math.max(...actualLogs.map((log) => log.actual_weight * (1 + log.actual_reps / 30)))
    setE1rm(Math.round(maxE1rm * 10) / 10)

    const totalTonnage = actualLogs.reduce((sum, log) => sum + log.actual_weight * log.actual_reps, 0)
    setTonnage(Math.round(totalTonnage * 10) / 10)
  }

  async function addActualSet() {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("Not authenticated")

      const validSets = newSets.filter((s) => s.weight && s.reps)
      if (validSets.length === 0) return

      const nextSetNumber = actualLogs.length + 1

      for (let i = 0; i < validSets.length; i++) {
        const set = validSets[i]
        const { error } = await supabase.from("exercise_logs").insert({
          athlete_id: user.user.id,
          day_exercise_id: dayExerciseId,
          set_number: nextSetNumber + i,
          actual_weight: Number.parseFloat(set.weight),
          actual_reps: Number.parseInt(set.reps),
          actual_rpe: set.rpe ? Number.parseFloat(set.rpe) : null,
        })

        if (error) throw error
      }

      setNewSets([])
      await loadExerciseData()
    } catch (error: any) {
      console.error("Error adding set:", error.message)
      alert("Error adding set: " + error.message)
    }
  }

  function updateNewSet(index: number, field: keyof NewSet, value: string) {
    const updated = [...newSets]
    updated[index][field] = value
    setNewSets(updated)
  }

  async function updateExistingLog(
    logId: string,
    field: "actual_weight" | "actual_reps" | "actual_rpe",
    value: string,
  ) {
    try {
      const numValue = value === "" ? null : field === "actual_reps" ? Number.parseInt(value) : Number.parseFloat(value)

      const { error } = await supabase
        .from("exercise_logs")
        .update({ [field]: numValue })
        .eq("id", logId)

      if (error) throw error

      setActualLogs((prev) => prev.map((log) => (log.id === logId ? { ...log, [field]: numValue } : log)))

      calculateStats()
    } catch (error: any) {
      console.error("Error updating log:", error.message)
    }
  }

  function handleLogBlur(logId: string, field: "actual_weight" | "actual_reps" | "actual_rpe", value: string) {
    updateExistingLog(logId, field, value)
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    logId: string,
    field: "actual_weight" | "actual_reps" | "actual_rpe",
    value: string,
  ) {
    if (e.key === "Enter") {
      e.preventDefault()
      updateExistingLog(logId, field, value)
      const form = e.currentTarget.form
      if (form) {
        const inputs = Array.from(form.querySelectorAll("input"))
        const currentIndex = inputs.indexOf(e.currentTarget)
        if (currentIndex < inputs.length - 1) {
          ;(inputs[currentIndex + 1] as HTMLInputElement).focus()
        }
      }
    }
  }

  async function deleteLastSet() {
    try {
      if (newSets.length > 0) {
        setNewSets(newSets.slice(0, -1))
        return
      }

      if (actualLogs.length > 0) {
        const lastLog = actualLogs[actualLogs.length - 1]
        const { error } = await supabase.from("exercise_logs").delete().eq("id", lastLog.id)

        if (error) throw error
        setActualLogs((prev) => prev.slice(0, -1))
      }
    } catch (error: any) {
      console.error("Error deleting last set:", error.message)
      alert("Error deleting set: " + error.message)
    }
  }

  function addNewRow() {
    setNewSets([...newSets, { weight: "", reps: "", rpe: "" }])
  }

  async function saveNewSet(index: number) {
    try {
      const set = newSets[index]
      if (!set.weight || !set.reps) return

      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("Not authenticated")

      const nextSetNumber = actualLogs.length + newSets.filter((_, i) => i < index).length + 1

      const { data: newLog, error } = await supabase
        .from("exercise_logs")
        .insert({
          athlete_id: user.user.id,
          day_exercise_id: dayExerciseId,
          set_number: nextSetNumber,
          actual_weight: Number.parseFloat(set.weight),
          actual_reps: Number.parseInt(set.reps),
          actual_rpe: set.rpe ? Number.parseFloat(set.rpe) : null,
        })
        .select()
        .single()

      if (error) throw error

      if (newLog) {
        setActualLogs((prev) => [...prev, newLog])
      }

      // Remove the saved set from newSets
      const updated = newSets.filter((_, i) => i !== index)
      setNewSets(updated)
    } catch (error: any) {
      console.error("Error saving set:", error.message)
      alert("Error saving set: " + error.message)
    }
  }

  function handleNewSetBlur(index: number, field: keyof NewSet, value: string) {
    updateNewSet(index, field, value)
    const set = newSets[index]
    if (set.weight && set.reps) {
      saveNewSet(index)
    }
  }

  function handleNewSetKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number, field: keyof NewSet) {
    if (e.key === "Enter") {
      e.preventDefault()
      const set = newSets[index]
      if (set.weight && set.reps) {
        saveNewSet(index)
      }
      const form = e.currentTarget.form
      if (form) {
        const inputs = Array.from(form.querySelectorAll("input"))
        const currentIndex = inputs.indexOf(e.currentTarget)
        if (currentIndex < inputs.length - 1) {
          ;(inputs[currentIndex + 1] as HTMLInputElement).focus()
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted px-4 py-6 pb-20">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-teal-500">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-teal-500">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={deleteLastSet}>Borrar último set</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <h1 className="text-2xl font-bold text-foreground text-center mb-8">{exerciseName}</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
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
            ACTUAL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="target" className="mt-8">
          {targetSets.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No target sets defined yet</div>
          ) : (
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-muted-foreground mb-4">
                <div className="col-span-4 text-xs">SETS</div>
                <div className="text-xs">WEIGHT</div>
                <div className="text-xs">REPS</div>
                <div className="text-xs">RPE</div>
              </div>
              {targetSets.map((set, index) => (
                <div key={set.id} className="grid grid-cols-7 gap-2">
                  <div className="col-span-4 bg-white rounded-lg p-3 text-muted-foreground text-center text-sm">
                    Set {set.set_number}
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center font-medium text-sm">
                    {set.target_weight || "-"}
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center font-medium text-sm">{set.target_reps}</div>
                  <div className="bg-white rounded-lg p-2 text-center font-medium text-sm">{set.target_rpe || "-"}</div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="actual" className="mt-8">
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-[auto_auto_1fr_1fr_1fr] gap-2 text-center text-sm font-medium text-muted-foreground mb-4">
              <div className="w-12"></div>
              <div className="w-20 text-xs">TARGET</div>
              <div className="text-xs">WEIGHT</div>
              <div className="text-xs">REPS</div>
              <div className="text-xs">RPE</div>
            </div>

            {actualLogs.map((log, index) => {
              const targetSet = targetSets[index]
              const targetText = targetSet
                ? `x ${targetSet.target_reps}${targetSet.target_rpe ? ` @${targetSet.target_rpe}` : ""}`
                : "-"

              return (
                <div key={log.id} className="grid grid-cols-[auto_auto_1fr_1fr_1fr] gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setActiveTab("target")}
                    className="w-12 h-12 bg-white rounded-lg text-teal-500 hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <div className="w-20 bg-gray-100 rounded-lg p-3 text-muted-foreground text-center text-sm flex items-center justify-center">
                    {targetText}
                  </div>
                  <Input
                    type="number"
                    defaultValue={log.actual_weight || ""}
                    onBlur={(e) => handleLogBlur(log.id, "actual_weight", e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, log.id, "actual_weight", e.currentTarget.value)}
                    className="bg-white text-center h-12"
                  />
                  <Input
                    type="number"
                    defaultValue={log.actual_reps || ""}
                    onBlur={(e) => handleLogBlur(log.id, "actual_reps", e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, log.id, "actual_reps", e.currentTarget.value)}
                    className="bg-white text-center h-12"
                  />
                  <Input
                    type="number"
                    step="0.5"
                    defaultValue={log.actual_rpe || ""}
                    onBlur={(e) => handleLogBlur(log.id, "actual_rpe", e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, log.id, "actual_rpe", e.currentTarget.value)}
                    placeholder="-"
                    className="bg-white text-center h-12"
                  />
                </div>
              )
            })}

            {newSets.map((set, index) => {
              const targetSet = targetSets[actualLogs.length + index]
              const targetText = targetSet
                ? `x ${targetSet.target_reps}${targetSet.target_rpe ? ` @${targetSet.target_rpe}` : ""}`
                : "-"

              return (
                <div key={index} className="grid grid-cols-[auto_auto_1fr_1fr_1fr] gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setActiveTab("target")}
                    className="w-12 h-12 bg-white rounded-lg text-teal-500 hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <div className="w-20 bg-gray-100 rounded-lg p-3 text-muted-foreground text-center text-sm flex items-center justify-center">
                    {targetText}
                  </div>
                  <Input
                    type="number"
                    placeholder=""
                    value={set.weight}
                    onChange={(e) => updateNewSet(index, "weight", e.target.value)}
                    onBlur={(e) => handleNewSetBlur(index, "weight", e.target.value)}
                    onKeyDown={(e) => handleNewSetKeyDown(e, index, "weight")}
                    className="bg-white text-center h-12"
                  />
                  <Input
                    type="number"
                    placeholder=""
                    value={set.reps}
                    onChange={(e) => updateNewSet(index, "reps", e.target.value)}
                    onBlur={(e) => handleNewSetBlur(index, "reps", e.target.value)}
                    onKeyDown={(e) => handleNewSetKeyDown(e, index, "reps")}
                    className="bg-white text-center h-12"
                  />
                  <Input
                    type="number"
                    step="0.5"
                    placeholder=""
                    value={set.rpe}
                    onChange={(e) => updateNewSet(index, "rpe", e.target.value)}
                    onBlur={(e) => handleNewSetBlur(index, "rpe", e.target.value)}
                    onKeyDown={(e) => handleNewSetKeyDown(e, index, "rpe")}
                    className="bg-white text-center h-12"
                  />
                </div>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Button onClick={addNewRow} className="w-full bg-teal-500 hover:bg-teal-600 text-white mb-6 h-12">
        <Plus className="h-5 w-5" />
      </Button>

      <Card className="bg-white border-0 shadow-sm mb-6">
        <CardContent className="p-4">
          <h3 className="text-lg font-bold text-foreground mb-3">Statistics</h3>
          <div className="flex gap-4 text-sm">
            <span className="text-muted-foreground">
              E1RM: <span className="font-medium text-foreground">{e1rm} kg</span>
            </span>
            <span className="text-muted-foreground">
              Tonnage: <span className="font-medium text-foreground">{tonnage} kg</span>
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground mb-3">Notes</h3>
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-4">
            <Textarea
              placeholder="Exercise Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px] border-0 p-0 focus-visible:ring-0 text-muted-foreground resize-none"
            />
          </CardContent>
        </Card>
      </div>

      <BottomNavigation currentPage="blocks" />
    </div>
  )
}
