"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Exercise {
  id: string
  name: string
  category: string
  sets: number
  reps: string
  rpe: number
  weight: string
}

interface TrainingDay {
  id: string
  name: string
  exercises: Exercise[]
}

export function TrainingBlockCreator() {
  const [blockName, setBlockName] = useState("")
  const [blockWeeks, setBlockWeeks] = useState("4")
  const [selectedAthlete, setSelectedAthlete] = useState("")
  const [activeTab, setActiveTab] = useState("create")

  const [trainingDays, setTrainingDays] = useState<TrainingDay[]>([
    {
      id: "day1",
      name: "Día 1 - Tren Superior",
      exercises: [],
    },
    {
      id: "day2",
      name: "Día 2 - Tren Inferior",
      exercises: [],
    },
  ])

  const exerciseLibrary = [
    { id: "1", name: "Sentadilla", category: "Tren Inferior", sets: 4, reps: "6-8", rpe: 8, weight: "80%" },
    { id: "2", name: "Press Banca", category: "Tren Superior", sets: 4, reps: "6-8", rpe: 8, weight: "80%" },
    { id: "3", name: "Peso Muerto", category: "Tren Inferior", sets: 3, reps: "5", rpe: 9, weight: "85%" },
    { id: "4", name: "Dominadas", category: "Tren Superior", sets: 3, reps: "8-10", rpe: 7, weight: "Corporal" },
    { id: "5", name: "Press Militar", category: "Tren Superior", sets: 3, reps: "8-10", rpe: 7, weight: "70%" },
    { id: "6", name: "Remo con Barra", category: "Tren Superior", sets: 4, reps: "8-10", rpe: 7, weight: "75%" },
  ]

  const athletes = [
    { id: "1", name: "María González" },
    { id: "2", name: "Carlos Ruiz" },
    { id: "3", name: "Ana López" },
    { id: "4", name: "Diego Martín" },
  ]

  const existingBlocks = [
    { id: "1", name: "Bloque Fuerza Base", weeks: 4, athlete: "María González" },
    { id: "2", name: "Bloque Hipertrofia", weeks: 6, athlete: "Carlos Ruiz" },
    { id: "3", name: "Bloque Potencia", weeks: 3, athlete: "Ana López" },
  ]

  const addExerciseToDay = (dayId: string, exercise: Exercise) => {
    setTrainingDays((days) =>
      days.map((day) =>
        day.id === dayId
          ? { ...day, exercises: [...day.exercises, { ...exercise, id: `${dayId}-${exercise.id}` }] }
          : day,
      ),
    )
  }

  const removeExerciseFromDay = (dayId: string, exerciseId: string) => {
    setTrainingDays((days) =>
      days.map((day) =>
        day.id === dayId ? { ...day, exercises: day.exercises.filter((ex) => ex.id !== exerciseId) } : day,
      ),
    )
  }

  const copyBlock = (blockId: string) => {
    // Simulate copying block logic
    console.log(`Copiando bloque ${blockId}`)
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Crear Nuevo</TabsTrigger>
          <TabsTrigger value="library">Librería</TabsTrigger>
          <TabsTrigger value="copy">Copiar Bloques</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          {/* Block Configuration */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Configuración del Bloque</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="blockName">Nombre del Bloque</Label>
                  <Input
                    id="blockName"
                    value={blockName}
                    onChange={(e) => setBlockName(e.target.value)}
                    placeholder="Ej: Bloque Fuerza Fase 1"
                  />
                </div>
                <div>
                  <Label htmlFor="blockWeeks">Duración (semanas)</Label>
                  <Select value={blockWeeks} onValueChange={setBlockWeeks}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 semanas</SelectItem>
                      <SelectItem value="3">3 semanas</SelectItem>
                      <SelectItem value="4">4 semanas</SelectItem>
                      <SelectItem value="6">6 semanas</SelectItem>
                      <SelectItem value="8">8 semanas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="athlete">Atleta</Label>
                  <Select value={selectedAthlete} onValueChange={setSelectedAthlete}>
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
              </div>
            </CardContent>
          </Card>

          {/* Training Days */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {trainingDays.map((day) => (
              <Card key={day.id} className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">{day.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {day.exercises.map((exercise) => (
                    <div key={exercise.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{exercise.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {exercise.sets} x {exercise.reps} @ RPE {exercise.rpe} ({exercise.weight})
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExerciseFromDay(day.id, exercise.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        ✕
                      </Button>
                    </div>
                  ))}

                  {day.exercises.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-8">No hay ejercicios agregados</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Exercise Library */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Librería de Ejercicios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {exerciseLibrary.map((exercise) => (
                  <div key={exercise.id} className="p-3 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{exercise.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {exercise.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      {exercise.sets} x {exercise.reps} @ RPE {exercise.rpe}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs bg-transparent"
                        onClick={() => addExerciseToDay("day1", exercise)}
                      >
                        + Día 1
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs bg-transparent"
                        onClick={() => addExerciseToDay("day2", exercise)}
                      >
                        + Día 2
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Save Block */}
          <div className="flex justify-end gap-3">
            <Button variant="outline">Guardar como Borrador</Button>
            <Button>Crear Bloque</Button>
          </div>
        </TabsContent>

        <TabsContent value="library" className="space-y-6">
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Plantillas de Bloques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: "Bloque Fuerza Básico", weeks: 4, exercises: 12 },
                  { name: "Bloque Hipertrofia", weeks: 6, exercises: 16 },
                  { name: "Bloque Potencia", weeks: 3, exercises: 8 },
                  { name: "Bloque Resistencia", weeks: 8, exercises: 10 },
                  { name: "Bloque Preparación", weeks: 2, exercises: 6 },
                  { name: "Bloque Competición", weeks: 1, exercises: 4 },
                ].map((template, index) => (
                  <Card key={index} className="border border-border">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">{template.name}</h4>
                      <div className="flex justify-between text-sm text-muted-foreground mb-3">
                        <span>{template.weeks} semanas</span>
                        <span>{template.exercises} ejercicios</span>
                      </div>
                      <Button size="sm" className="w-full">
                        Usar Plantilla
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="copy" className="space-y-6">
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Copiar Bloques Existentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {existingBlocks.map((block) => (
                  <div key={block.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <h4 className="font-medium">{block.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {block.weeks} semanas • Atleta: {block.athlete}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Ver Detalles
                      </Button>
                      <Button size="sm" onClick={() => copyBlock(block.id)}>
                        Copiar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
