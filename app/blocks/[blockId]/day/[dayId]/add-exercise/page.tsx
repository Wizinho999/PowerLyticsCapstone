"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, Plus, Search } from "lucide-react"
import { BottomNavigation } from "@/components/bottom-navigation"
import { createBrowserClient } from "@/lib/supabase/client"

interface Exercise {
  id: string
  name: string
  category: string
}

const categories = [
  { id: "knee_dominant", name: "Knee Dominant" },
  { id: "hip_dominant", name: "Hip Dominant" },
  { id: "horizontal_push", name: "Horizontal Push" },
  { id: "vertical_push", name: "Vertical Push" },
  { id: "horizontal_pull", name: "Horizontal Pull" },
  { id: "vertical_pull", name: "Vertical Pull" },
  { id: "other", name: "Other" },
]

export default function AddExercisePage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createBrowserClient()

  const blockId = params.blockId as string
  const dayId = params.dayId as string

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newExerciseName, setNewExerciseName] = useState("")
  const [newExerciseCategory, setNewExerciseCategory] = useState("other")
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadExercises()
  }, [])

  useEffect(() => {
    filterExercises()
  }, [searchQuery, selectedCategory, exercises])

  const loadExercises = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .or(`is_public.eq.true,created_by.eq.${user?.id}`)
        .order("name")

      if (error) throw error
      setExercises(data || [])
      setFilteredExercises(data || [])
    } catch (error) {
      console.error("[v0] Error loading exercises:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterExercises = () => {
    let filtered = exercises

    if (searchQuery) {
      filtered = filtered.filter((ex) => ex.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    if (selectedCategory) {
      filtered = filtered.filter((ex) => ex.category === selectedCategory)
    }

    setFilteredExercises(filtered)
  }

  const createExercise = async () => {
    if (!newExerciseName.trim()) return

    setCreating(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from("exercises")
        .insert({
          name: newExerciseName,
          category: newExerciseCategory,
          created_by: user?.id,
          is_public: false,
        })
        .select()
        .single()

      if (error) throw error

      setNewExerciseName("")
      setNewExerciseCategory("other")
      setShowCreateDialog(false)
      loadExercises()
    } catch (error) {
      console.error("[v0] Error creating exercise:", error)
    } finally {
      setCreating(false)
    }
  }

  const addExerciseToDay = async (exerciseId: string) => {
    try {
      const { data: existingExercises } = await supabase
        .from("day_exercises")
        .select("order_index")
        .eq("training_day_id", dayId)
        .order("order_index", { ascending: false })
        .limit(1)

      const nextOrderIndex =
        existingExercises && existingExercises.length > 0 ? existingExercises[0].order_index + 1 : 0

      const { error } = await supabase.from("day_exercises").insert({
        training_day_id: dayId,
        exercise_id: exerciseId,
        order_index: nextOrderIndex,
        target_sets: 3,
      })

      if (error) throw error

      router.back()
    } catch (error) {
      console.error("[v0] Error adding exercise:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-muted-foreground">Cargando ejercicios...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted px-4 py-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-teal-500">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-teal-500" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white"
        />
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant="outline"
            size="sm"
            onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
            className={`whitespace-nowrap ${
              selectedCategory === category.id
                ? "bg-teal-500 text-white border-teal-500"
                : "bg-white text-teal-500 border-teal-500"
            }`}
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* Exercises list */}
      <div className="space-y-2">
        {filteredExercises.map((exercise) => (
          <div
            key={exercise.id}
            onClick={() => addExerciseToDay(exercise.id)}
            className="flex items-center justify-between p-4 bg-white rounded-lg cursor-pointer hover:shadow-md transition-shadow"
          >
            <span className="text-foreground font-medium">{exercise.name}</span>
            <Button variant="ghost" size="icon" className="text-teal-500">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
              </svg>
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Create a new exercise</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="New exercise name"
              value={newExerciseName}
              onChange={(e) => setNewExerciseName(e.target.value)}
              className="text-center"
            />
            <Select value={newExerciseCategory} onValueChange={setNewExerciseCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={createExercise}
              disabled={creating || !newExerciseName.trim()}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white"
            >
              {creating ? "Creando..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNavigation currentPage="blocks" />
    </div>
  )
}
