"use client"

import type React from "react"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Users, Zap, CheckCircle2, Calendar, MapPin, Dumbbell, Loader2, ClipboardList, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { GamePlanTable, createEmptyGamePlan, type GamePlanData } from "@/components/gameplan-table"

type Competition = {
  id: string
  name: string
  date: string | null
  location: string | null
  federation?: string | null
  status?: "upcoming" | "in_progress" | "completed" | null
}

type AthleteProfile = {
  id: string
  full_name?: string | null
  email?: string | null
}

type CompetitionAthlete = {
  id: string
  athlete_id: string
  competition_id: string
  status: string
  weight_class: string | null
  gameplan: GamePlanData | null
  gameplan_notes: string | null
  gameplan_last_updated: string | null
  competition: Competition | null
  athlete: AthleteProfile | null
}

type SexOption = "male" | "female"
type AgeClassOption = "sbjr" | "jr" | "open" | "m1" | "m2" | "m3"

const maleYouthClasses = ["-53", "-59", "-66", "-74", "-83", "-93", "-105", "-120", "+120"]
const maleOpenClasses = ["-59", "-66", "-74", "-83", "-93", "-105", "-120", "+120"]
const femaleYouthClasses = ["-43", "-47", "-52", "-57", "-63", "-69", "-76", "-84", "+84"]
const femaleOpenClasses = ["-47", "-52", "-57", "-63", "-69", "-76", "-84", "+84"]

const weightClassOptions: Record<SexOption, Record<AgeClassOption, string[]>> = {
  male: {
    sbjr: maleYouthClasses,
    jr: maleYouthClasses,
    open: maleOpenClasses,
    m1: maleOpenClasses,
    m2: maleOpenClasses,
    m3: maleOpenClasses,
  },
  female: {
    sbjr: femaleYouthClasses,
    jr: femaleYouthClasses,
    open: femaleOpenClasses,
    m1: femaleOpenClasses,
    m2: femaleOpenClasses,
    m3: femaleOpenClasses,
  },
}

const sexSelectOptions: { label: string; value: SexOption }[] = [
  { label: "Masculino", value: "male" },
  { label: "Femenino", value: "female" },
]

const ageClassLabels: Record<AgeClassOption, string> = {
  sbjr: "Sub-Junior",
  jr: "Junior",
  open: "Open",
  m1: "M1",
  m2: "M2",
  m3: "M3",
}

const ageClassSelectOptions: { label: string; value: AgeClassOption }[] = (
  Object.entries(ageClassLabels) as [AgeClassOption, string][]
).map(([value, label]) => ({ value, label }))

const defaultWeightClass = weightClassOptions.male.open[0]

function formatDate(dateString?: string | null) {
  if (!dateString) return "Sin fecha"
  return new Date(dateString).toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" })
}

function hasPlan(plan: GamePlanData | null | undefined) {
  if (!plan) return false
  return Object.values(plan).some((lift) =>
    Object.values(lift).some((attempt) => Object.values(attempt).some((value) => value !== null)),
  )
}

export function CompetitionPlanning() {
  const supabase = useMemo(() => createClient(), [])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [entries, setEntries] = useState<CompetitionAthlete[]>([])
  const [coachAthletes, setCoachAthletes] = useState<AthleteProfile[]>([])
  const [coachId, setCoachId] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [competitionForm, setCompetitionForm] = useState({ name: "", date: "", location: "", federation: "" })
  const [competitionFeedback, setCompetitionFeedback] = useState<string | null>(null)
  const [creatingCompetition, setCreatingCompetition] = useState(false)
  const [enrollCompetition, setEnrollCompetition] = useState<Competition | null>(null)
  const [selectedAthleteId, setSelectedAthleteId] = useState("")
  const [sex, setSex] = useState<SexOption>("male")
  const [ageClass, setAgeClass] = useState<AgeClassOption>("open")
  const [weightClass, setWeightClass] = useState(defaultWeightClass)
  const [athleteStatus, setAthleteStatus] = useState("registered")
  const [enrollFeedback, setEnrollFeedback] = useState<string | null>(null)
  const [enrolling, setEnrolling] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<CompetitionAthlete | null>(null)
  const [editGamePlan, setEditGamePlan] = useState<GamePlanData>(createEmptyGamePlan())
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [removeEntryId, setRemoveEntryId] = useState<string | null>(null)

  const loadCoachAthletes = useCallback(
    async (coachUserId: string) => {
      try {
        const { data: athleteRows, error: athleteError } = await supabase
          .from("athletes")
          .select("id")
          .eq("coach_id", coachUserId)

        if (athleteError) throw athleteError

        if (!athleteRows || athleteRows.length === 0) {
          setCoachAthletes([])
          return
        }

        const athleteIds = athleteRows.map((row) => row.id)
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", athleteIds)

        if (profilesError) throw profilesError

        setCoachAthletes(profilesData ?? [])
      } catch (err) {
        console.error("Error loading coach athletes:", err)
        setCoachAthletes([])
      }
    },
    [supabase],
  )

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setCompetitions([])
        setEntries([])
        setLoading(false)
        return
      }

      setCoachId(user.id)
      await loadCoachAthletes(user.id)

      const { data: comps, error: compsError } = await supabase
        .from("competitions")
        .select("id, name, date, location, federation, status")
        .eq("coach_id", user.id)
        .order("date", { ascending: true })

      if (compsError) throw compsError

      setCompetitions(comps ?? [])

      if (!comps || comps.length === 0) {
        setEntries([])
        setLoading(false)
        return
      }

      const competitionIds = comps.map((comp) => comp.id)
      const { data: competitionAthletes, error: athletesError } = await supabase
        .from("competition_athletes")
        .select("id, athlete_id, competition_id, status, weight_class, gameplan, gameplan_notes, gameplan_last_updated")
        .in("competition_id", competitionIds)

      if (athletesError) throw athletesError

      if (!competitionAthletes || competitionAthletes.length === 0) {
        setEntries([])
        setLoading(false)
        return
      }

      const athleteIds = Array.from(new Set(competitionAthletes.map((item) => item.athlete_id)))
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", athleteIds)

      if (profilesError) throw profilesError

      const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
      const competitionMap = new Map(comps.map((comp) => [comp.id, comp]))

      const normalized: CompetitionAthlete[] = (competitionAthletes ?? []).map((row) => ({
        ...row,
        competition: competitionMap.get(row.competition_id) ?? null,
        athlete: profileMap.get(row.athlete_id) ?? null,
        gameplan: (row.gameplan as GamePlanData | null) ?? null,
      }))

      setEntries(normalized)
    } catch (err: any) {
      console.error("Error loading competitions:", err)
      setError("No se pudo cargar la información. Intenta más tarde.")
    } finally {
      setLoading(false)
    }
  }, [loadCoachAthletes, supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  const openGamePlan = (entry: CompetitionAthlete) => {
    setSelectedEntry(entry)
    setEditGamePlan(entry.gameplan ?? createEmptyGamePlan())
    setNotes(entry.gameplan_notes ?? "")
    setFeedback(null)
  }

  const closeGamePlan = () => {
    setSelectedEntry(null)
    setEditGamePlan(createEmptyGamePlan())
    setNotes("")
    setFeedback(null)
  }

  const handleSaveGamePlan = async () => {
    if (!selectedEntry) return
    setSaving(true)
    setFeedback(null)

    try {
      const payload = {
        gameplan: editGamePlan,
        gameplan_notes: notes.trim() ? notes.trim() : null,
        gameplan_last_updated: new Date().toISOString(),
      }

      const { error: updateError } = await supabase
        .from("competition_athletes")
        .update(payload)
        .eq("id", selectedEntry.id)

      if (updateError) throw updateError

      setEntries((prev) => prev.map((entry) => (entry.id === selectedEntry.id ? { ...entry, ...payload } : entry)))

      setSelectedEntry((prev) => (prev ? { ...prev, ...payload } : prev))
      setFeedback("Game plan guardado correctamente")
    } catch (err: any) {
      console.error("Error saving game plan:", err)
      const message =
        typeof err?.message === "string" ? err.message : "No se pudo guardar el game plan. Intenta nuevamente."
      setFeedback(message)
    } finally {
      setSaving(false)
    }
  }

  const handleCreateCompetition = async () => {
    if (!competitionForm.name.trim() || !competitionForm.date) {
      setCompetitionFeedback("Nombre y fecha son obligatorios")
      return
    }

    if (!coachId) {
      setCompetitionFeedback("No se pudo identificar al coach")
      return
    }

    setCreatingCompetition(true)
    setCompetitionFeedback(null)

    try {
      const payload = {
        coach_id: coachId,
        name: competitionForm.name.trim(),
        date: competitionForm.date,
        location: competitionForm.location.trim() ? competitionForm.location.trim() : null,
        federation: competitionForm.federation.trim() ? competitionForm.federation.trim() : null,
        status: "upcoming" as const,
      }

      const { data: inserted, error: insertError } = await supabase
        .from("competitions")
        .insert(payload)
        .select("id, name, date, location, federation, status")
        .single()

      if (insertError) throw insertError

      setCompetitions((prev) =>
        [...prev, inserted].sort((a, b) => {
          if (!a.date || !b.date) return 0
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        }),
      )

      setCompetitionForm({ name: "", date: "", location: "", federation: "" })
      setShowCreateDialog(false)
    } catch (err) {
      console.error("Error creating competition:", err)
      setCompetitionFeedback("No se pudo crear la competición. Intenta nuevamente.")
    } finally {
      setCreatingCompetition(false)
    }
  }

  const resetEnrollForm = () => {
    setSelectedAthleteId("")
    setSex("male")
    setAgeClass("open")
    setWeightClass(defaultWeightClass)
    setAthleteStatus("registered")
  }

  const openEnrollDialog = (competition: Competition) => {
    setEnrollCompetition(competition)
    resetEnrollForm()
    setEnrollFeedback(null)
  }

  const closeEnrollDialog = () => {
    setEnrollCompetition(null)
    setEnrollFeedback(null)
    resetEnrollForm()
  }

  useEffect(() => {
    const options = weightClassOptions[sex][ageClass]
    if (!options.includes(weightClass)) {
      setWeightClass(options[0] ?? "")
    }
  }, [sex, ageClass, weightClass])

  const handleEnrollAthlete = async () => {
    if (!enrollCompetition) return
    if (!selectedAthleteId) {
      setEnrollFeedback("Debes seleccionar un atleta")
      return
    }
    if (!weightClass) {
      setEnrollFeedback("Debes seleccionar una categoría de peso")
      return
    }

    setEnrolling(true)
    setEnrollFeedback(null)

    try {
      const weightClassLabel = `${weightClass} ${ageClassLabels[ageClass]}`.trim()
      const payload = {
        competition_id: enrollCompetition.id,
        athlete_id: selectedAthleteId,
        status: athleteStatus,
        weight_class: weightClassLabel || null,
      }

      const { data, error } = await supabase.from("competition_athletes").insert(payload).select("id").single()
      if (error) throw error

      const athleteProfile = coachAthletes.find((athlete) => athlete.id === selectedAthleteId) ?? null

      const newEntry: CompetitionAthlete = {
        id: data?.id ?? crypto.randomUUID(),
        competition_id: enrollCompetition.id,
        athlete_id: selectedAthleteId,
        status: athleteStatus,
        weight_class: weightClassLabel || weightClass,
        gameplan: null,
        gameplan_notes: null,
        gameplan_last_updated: null,
        competition: enrollCompetition,
        athlete: athleteProfile,
      }

      setEntries((prev) => [...prev, newEntry])
      setEnrollFeedback("Atleta agregado correctamente")
      resetEnrollForm()
    } catch (err) {
      console.error("Error enrolling athlete:", err)
      setEnrollFeedback("No se pudo agregar el atleta. Intenta nuevamente.")
    } finally {
      setEnrolling(false)
    }
  }

  const currentWeightOptions = weightClassOptions[sex][ageClass] ?? []

  const handleRemoveEntry = async (entryId: string) => {
    if (!entryId) return
    const confirmDelete = window.confirm("¿Eliminar al atleta de esta competencia?")
    if (!confirmDelete) return

    setRemoveEntryId(entryId)
    try {
      const { error } = await supabase.from("competition_athletes").delete().eq("id", entryId)
      if (error) throw error

      setEntries((prev) => prev.filter((entry) => entry.id !== entryId))
    } catch (err) {
      console.error("Error removing athlete:", err)
    } finally {
      setRemoveEntryId(null)
    }
  }

  const stats = {
    upcoming: competitions.filter((comp) => comp.status !== "completed").length,
    athletes: entries.length,
    readyPlans: entries.filter((entry) => hasPlan(entry.gameplan)).length,
    completed: competitions.filter((comp) => comp.status === "completed").length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center text-muted-foreground gap-3">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p>Cargando competiciones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Planificar Competiciones</h2>
        <p className="text-muted-foreground">Gestiona competiciones y game plans para tus atletas</p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatCard
          title="Próximas Competiciones"
          value={stats.upcoming}
          icon={<Trophy className="w-6 h-6 text-blue-600" />}
          gradient="from-blue-50 to-blue-100"
          pillColor="bg-blue-200"
        />
        <DashboardStatCard
          title="Atletas Compitiendo"
          value={stats.athletes}
          icon={<Users className="w-6 h-6 text-green-600" />}
          gradient="from-green-50 to-green-100"
          pillColor="bg-green-200"
        />
        <DashboardStatCard
          title="Game Plans Listos"
          value={stats.readyPlans}
          icon={<Zap className="w-6 h-6 text-orange-600" />}
          gradient="from-orange-50 to-orange-100"
          pillColor="bg-orange-200"
        />
        <DashboardStatCard
          title="Completadas"
          value={stats.completed}
          icon={<CheckCircle2 className="w-6 h-6 text-purple-600" />}
          gradient="from-purple-50 to-purple-100"
          pillColor="bg-purple-200"
        />
      </div>

      <Card className="border-0 shadow-lg bg-white">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg mx-2 my-0 py-0">
          <div className="flex justify-between items-center">
            <CardTitle className="text-white">Competiciones</CardTitle>
            <Button
              className="bg-white text-blue-600 hover:bg-blue-50 py-0 my-3.5"
              onClick={() => setShowCreateDialog(true)}
            >
              Nueva Competición
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {competitions.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aún no registras competiciones. Agrega la primera para crear game plans.
            </p>
          ) : (
            competitions.map((competition) => {
              const athletesInCompetition = entries.filter((entry) => entry.competition_id === competition.id)
              return (
                <div
                  key={competition.id}
                  className="p-5 border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-transparent rounded-lg shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-lg text-foreground">{competition.name}</h4>
                      <p className="text-sm text-muted-foreground">{competition.federation || ""}</p>
                    </div>
                    <Trophy className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4 text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                      {formatDate(competition.date)}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                      {competition.location || "Ubicación por confirmar"}
                    </div>
                    <div className="flex items-center">
                      <Dumbbell className="w-4 h-4 mr-2 text-blue-600" />
                      Powerlifting
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-blue-600" />
                      {athletesInCompetition.length} atleta(s)
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEnrollDialog(competition)}>
                      Gestionar atletas
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-white">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg py-2 my-0">
          <CardTitle className="text-white">Atletas en Competición</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {entries.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No hay atletas asignados a competiciones.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="relative p-5 bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-lg shadow-sm flex flex-col gap-4"
                >
                  <button
                    className="absolute top-3 right-3 text-red-500 hover:text-red-600"
                    onClick={() => handleRemoveEntry(entry.id)}
                    disabled={removeEntryId === entry.id}
                    aria-label="Eliminar atleta de la competencia"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-lg text-foreground">
                        {entry.athlete?.full_name || entry.athlete?.email || "Atleta sin nombre"}
                      </h4>
                      <p className="text-sm text-muted-foreground">{entry.competition?.name || "Competencia"}</p>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {entry.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Categoría</span>
                      <span className="font-semibold text-foreground">{entry.weight_class || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Game Plan</span>
                      <Badge variant={hasPlan(entry.gameplan) ? "default" : "outline"}>
                        {hasPlan(entry.gameplan) ? "Listo" : "Pendiente"}
                      </Badge>
                    </div>
                    {entry.gameplan_last_updated ? (
                      <div className="flex justify-between text-xs">
                        <span>Actualizado</span>
                        <span>{new Date(entry.gameplan_last_updated).toLocaleString("es-CL")}</span>
                      </div>
                    ) : null}
                  </div>

                  <Button
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => openGamePlan(entry)}
                  >
                    Game Plan
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={showCreateDialog}
        onOpenChange={(open) => (open ? setShowCreateDialog(true) : setShowCreateDialog(false))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear nueva competición</DialogTitle>
          </DialogHeader>

          {competitionFeedback ? (
            <Alert variant="destructive">
              <AlertDescription>{competitionFeedback}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="competition-name">Nombre</Label>
              <Input
                id="competition-name"
                placeholder="Campeonato Regional"
                value={competitionForm.name}
                onChange={(event) => setCompetitionForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="competition-date">Fecha</Label>
              <Input
                id="competition-date"
                type="date"
                value={competitionForm.date}
                onChange={(event) => setCompetitionForm((prev) => ({ ...prev, date: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="competition-location">Lugar</Label>
              <Input
                id="competition-location"
                placeholder="Centro Deportivo"
                value={competitionForm.location}
                onChange={(event) => setCompetitionForm((prev) => ({ ...prev, location: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="competition-fed">Federación</Label>
              <Input
                id="competition-fed"
                placeholder="Federación"
                value={competitionForm.federation}
                onChange={(event) => setCompetitionForm((prev) => ({ ...prev, federation: event.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateDialog(false)} disabled={creatingCompetition}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCompetition} disabled={creatingCompetition}>
              {creatingCompetition ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(enrollCompetition)} onOpenChange={(open) => (open ? null : closeEnrollDialog())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar atleta a {enrollCompetition?.name}</DialogTitle>
          </DialogHeader>

          {enrollFeedback ? (
            <Alert variant={enrollFeedback.includes("No se pudo") ? "destructive" : "default"}>
              <AlertDescription>{enrollFeedback}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Atleta</Label>
              <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={coachAthletes.length === 0 ? "No tienes atletas" : "Selecciona un atleta"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {coachAthletes.map((athlete) => (
                    <SelectItem key={athlete.id} value={athlete.id}>
                      {athlete.full_name || athlete.email || "Atleta sin nombre"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sexo</Label>
                <Select value={sex} onValueChange={(value) => setSex(value as SexOption)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sexSelectOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Categoría Etaria</Label>
                <Select value={ageClass} onValueChange={(value) => setAgeClass(value as AgeClassOption)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ageClassSelectOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Categoría de Peso</Label>
              <Select
                value={weightClass}
                onValueChange={setWeightClass}
                disabled={currentWeightOptions.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {currentWeightOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={athleteStatus} onValueChange={setAthleteStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="registered">Registrado</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="competed">Compitió</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={closeEnrollDialog} disabled={enrolling}>
              Cancelar
            </Button>
            <Button onClick={handleEnrollAthlete} disabled={enrolling || coachAthletes.length === 0}>
              {enrolling ? "Agregando..." : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedEntry)} onOpenChange={(open) => (open ? null : closeGamePlan())}>
        <DialogContent className="w-full max-w-5xl xl:max-w-6xl">
          {selectedEntry ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                  Game Plan · {selectedEntry.athlete?.full_name || selectedEntry.athlete?.email || "Atleta"}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedEntry.competition?.name} · {formatDate(selectedEntry.competition?.date)}
                </p>
              </DialogHeader>

              {feedback ? (
                <Alert variant={feedback.includes("No se pudo") ? "destructive" : "default"}>
                  <AlertDescription>{feedback}</AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                <GamePlanTable data={editGamePlan} editable onChange={setEditGamePlan} />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="gameplan-notes">
                    Notas del Game Plan
                  </label>
                  <Textarea
                    id="gameplan-notes"
                    placeholder="Notas generales, recordatorios o estrategias específicas"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Button variant="ghost" onClick={closeGamePlan} disabled={saving}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveGamePlan} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                  {saving ? "Guardando..." : "Guardar Game Plan"}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

type DashboardStatCardProps = {
  title: string
  value: number
  icon: React.ReactNode
  gradient: string
  pillColor: string
}

function DashboardStatCard({ title, value, icon, gradient, pillColor }: DashboardStatCardProps) {
  return (
    <Card className={`border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br ${gradient}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-foreground/80 mb-2">{title}</p>
            <p className="text-4xl font-bold text-foreground">{value}</p>
          </div>
          <div className={`${pillColor} p-3 rounded-lg`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
