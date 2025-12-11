"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { BottomNavigation } from "@/components/bottom-navigation"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AthleteInvitations } from "@/components/athlete-invitations"
import { TracForm, type TracData } from "@/components/trac-form"
import useSWR from "swr"

export function Dashboard() {
  const [username, setUsername] = useState("Usuario")
  const [initials, setInitials] = useState("U")
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const [isWeightDialogOpen, setIsWeightDialogOpen] = useState(false)
  const [isTracDialogOpen, setIsTracDialogOpen] = useState(false)
  const [noteContent, setNoteContent] = useState("")
  const [noteDate, setNoteDate] = useState("")
  const [weightValue, setWeightValue] = useState("")
  const router = useRouter()
  const supabase = createClient()

  const { data: dashboardData, mutate } = useSWR(
    "dashboard-data",
    async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return null

      const [lastLog, lastNote, lastWeight, lastTrac] = await Promise.all([
        supabase
          .from("exercise_logs")
          .select("completed_at")
          .eq("athlete_id", user.id)
          .order("completed_at", { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from("notes")
          .select("created_at")
          .eq("author_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from("body_weight_logs")
          .select("recorded_at")
          .eq("athlete_id", user.id)
          .order("recorded_at", { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from("trac_logs")
          .select("scheduled_date")
          .eq("user_id", user.id)
          .order("scheduled_date", { ascending: false })
          .limit(1)
          .single(),
      ])

      return {
        user,
        lastTrainingDate: lastLog.data ? new Date(lastLog.data.completed_at).toLocaleDateString("es-CL") : null,
        lastNoteDate: lastNote.data ? new Date(lastNote.data.created_at).toLocaleDateString("es-CL") : null,
        lastWeightDate: lastWeight.data ? new Date(lastWeight.data.recorded_at).toLocaleDateString("es-CL") : null,
        lastTracDate: lastTrac.data ? new Date(lastTrac.data.scheduled_date).toLocaleDateString("es-CL") : null,
      }
    },
    {
      revalidateOnMount: true,
      dedupingInterval: 5000,
    },
  )

  useEffect(() => {
    if (dashboardData?.user) {
      const displayName =
        dashboardData.user.user_metadata?.username || dashboardData.user.email?.split("@")[0] || "Usuario"
      setUsername(displayName)

      const userInitials = displayName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
      setInitials(userInitials)
    }
  }, [dashboardData])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const handleTrainingClick = () => {
    router.push("/blocks")
  }

  const handleNoteClick = () => {
    setIsNoteDialogOpen(true)
  }

  const handleWeightClick = () => {
    setIsWeightDialogOpen(true)
  }

  const handleTracClick = () => {
    setIsTracDialogOpen(true)
  }

  const handleSaveNote = async () => {
    if (!noteContent.trim()) return

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { error } = await supabase.from("notes").insert({
        author_id: user.id,
        content: noteContent,
        category: "general",
        scheduled_date: noteDate || new Date().toISOString().split("T")[0],
      })

      if (!error) {
        setNoteContent("")
        setNoteDate("")
        setIsNoteDialogOpen(false)
        mutate()
      }
    }
  }

  const handleSaveWeight = async () => {
    const weight = Number.parseFloat(weightValue)
    if (isNaN(weight) || weight <= 0) return

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { error } = await supabase.from("body_weight_logs").insert({
        athlete_id: user.id,
        weight: weight,
        recorded_at: new Date().toISOString(),
      })

      if (!error) {
        setWeightValue("")
        setIsWeightDialogOpen(false)
        mutate()
      }
    }
  }

  const handleSaveTrac = async (tracData: TracData) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { error } = await supabase.from("trac_logs").insert({
        user_id: user.id,
        leg_soreness: tracData.leg_soreness,
        push_soreness: tracData.push_soreness,
        pull_soreness: tracData.pull_soreness,
        sleep_nutrition: tracData.sleep_nutrition,
        perceived_recovery: tracData.perceived_recovery,
        motivation: tracData.motivation,
        technical_comfort: tracData.technical_comfort,
        scheduled_date: tracData.recorded_date,
      })

      if (error) {
        console.error("[v0] Error saving TRAC:", error)
        alert("Error al guardar el TRAC: " + error.message)
      } else {
        setIsTracDialogOpen(false)
        mutate()
      }
    }
  }

  const quickAccessCards = [
    {
      title: "Entrenamiento",
      subtitle: dashboardData?.lastTrainingDate
        ? `Último registro: ${dashboardData.lastTrainingDate}`
        : "¡Empieza a entrenar!",
      color: "bg-teal-500 hover:bg-teal-600",
      onClick: handleTrainingClick,
    },
    {
      title: "Nota",
      subtitle: dashboardData?.lastNoteDate
        ? `Último registro: ${dashboardData.lastNoteDate}`
        : "¡Agrega tu primera nota!",
      color: "bg-yellow-500 hover:bg-yellow-600",
      onClick: handleNoteClick,
    },
    {
      title: "Trac",
      subtitle: dashboardData?.lastTracDate
        ? `Último registro: ${dashboardData.lastTracDate}`
        : "¡Registra tu primer TRAC!",
      color: "bg-purple-500 hover:bg-purple-600",
      onClick: handleTracClick,
    },
    {
      title: "Peso corporal",
      subtitle: dashboardData?.lastWeightDate
        ? `Último registro: ${dashboardData.lastWeightDate}`
        : "¡Empieza a registrar tu peso corporal!",
      color: "bg-green-500 hover:bg-green-600",
      onClick: handleWeightClick,
    },
  ]

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-muted px-4 py-6 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div>
              <Skeleton className="h-7 w-40 mb-1" />
            </div>
          </div>
          <Skeleton className="h-9 w-16" />
        </div>

        <div className="space-y-3 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-white border-0 shadow-sm py-1.5">
              <CardContent className="px-3 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <BottomNavigation currentPage="dashboard" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted px-4 py-6 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 bg-black">
            <AvatarFallback className="bg-black text-white font-semibold text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Hola, {username}</h1>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-foreground"
        >
          Salir
        </Button>
      </div>

      <AthleteInvitations />

      <div className="space-y-3 mb-8">
        {quickAccessCards.map((card, index) => (
          <Card key={index} className="bg-white border-0 shadow-sm py-1.5">
            <CardContent className="px-3 py-0">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-foreground mb-0.5">{card.title}</h3>
                  <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                </div>
                <Button
                  size="icon"
                  className={`${card.color} text-white border-0 h-8 w-8 rounded-lg`}
                  onClick={card.onClick}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center mt-16">
        <Image src="/images/powerlytics-logo.png" alt="PowerLytics" width={120} height={60} className="opacity-60" />
      </div>

      <BottomNavigation currentPage="dashboard" />

      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Nota</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="noteDate">Fecha</Label>
              <Input id="noteDate" type="date" value={noteDate} onChange={(e) => setNoteDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Nota</Label>
              <Textarea
                id="note"
                placeholder="Escribe tu nota aquí..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveNote} disabled={!noteContent.trim()}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isWeightDialogOpen} onOpenChange={setIsWeightDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Peso Corporal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="75.5"
                value={weightValue}
                onChange={(e) => setWeightValue(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWeightDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveWeight} disabled={!weightValue || Number.parseFloat(weightValue) <= 0}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTracDialogOpen} onOpenChange={setIsTracDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <TracForm onSave={handleSaveTrac} onCancel={() => setIsTracDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
