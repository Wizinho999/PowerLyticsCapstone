"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
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

export function Dashboard() {
  const [username, setUsername] = useState("Usuario")
  const [initials, setInitials] = useState("U")
  const [lastTrainingDate, setLastTrainingDate] = useState<string | null>(null)
  const [lastNoteDate, setLastNoteDate] = useState<string | null>(null)
  const [lastWeightDate, setLastWeightDate] = useState<string | null>(null)
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const [isWeightDialogOpen, setIsWeightDialogOpen] = useState(false)
  const [noteContent, setNoteContent] = useState("")
  const [weightValue, setWeightValue] = useState("")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const displayName = user.user_metadata?.username || user.email?.split("@")[0] || "Usuario"
        setUsername(displayName)

        const userInitials = displayName
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
        setInitials(userInitials)

        // Load last training date
        const { data: lastLog } = await supabase
          .from("exercise_logs")
          .select("completed_at")
          .eq("athlete_id", user.id)
          .order("completed_at", { ascending: false })
          .limit(1)
          .single()

        if (lastLog) {
          const date = new Date(lastLog.completed_at)
          setLastTrainingDate(date.toLocaleDateString("es-CL"))
        }

        // Load last note date
        const { data: lastNote } = await supabase
          .from("notes")
          .select("created_at")
          .eq("author_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (lastNote) {
          const date = new Date(lastNote.created_at)
          setLastNoteDate(date.toLocaleDateString("es-CL"))
        }

        // Load last weight date
        const { data: lastWeight } = await supabase
          .from("body_weight_logs")
          .select("recorded_at")
          .eq("athlete_id", user.id)
          .order("recorded_at", { ascending: false })
          .limit(1)
          .single()

        if (lastWeight) {
          const date = new Date(lastWeight.recorded_at)
          setLastWeightDate(date.toLocaleDateString("es-CL"))
        }
      }
    }

    loadData()
  }, [supabase])

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
      })

      if (!error) {
        setNoteContent("")
        setIsNoteDialogOpen(false)
        // Reload last note date
        const { data: lastNote } = await supabase
          .from("notes")
          .select("created_at")
          .eq("author_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (lastNote) {
          const date = new Date(lastNote.created_at)
          setLastNoteDate(date.toLocaleDateString("es-CL"))
        }
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
        // Reload last weight date
        const { data: lastWeight } = await supabase
          .from("body_weight_logs")
          .select("recorded_at")
          .eq("athlete_id", user.id)
          .order("recorded_at", { ascending: false })
          .limit(1)
          .single()

        if (lastWeight) {
          const date = new Date(lastWeight.recorded_at)
          setLastWeightDate(date.toLocaleDateString("es-CL"))
        }
      }
    }
  }

  const quickAccessCards = [
    {
      title: "Entrenamiento",
      subtitle: lastTrainingDate ? `Último registro: ${lastTrainingDate}` : "¡Empieza a entrenar!",
      color: "bg-teal-500 hover:bg-teal-600",
      onClick: handleTrainingClick,
    },
    {
      title: "Nota",
      subtitle: lastNoteDate ? `Último registro: ${lastNoteDate}` : "¡Agrega tu primera nota!",
      color: "bg-yellow-500 hover:bg-yellow-600",
      onClick: handleNoteClick,
    },
    {
      title: "Trac",
      subtitle: "Último registro: 13/6/25",
      color: "bg-purple-500 hover:bg-purple-600",
      onClick: () => {}, // No functionality for now
    },
    {
      title: "Peso corporal",
      subtitle: lastWeightDate ? `Último registro: ${lastWeightDate}` : "¡Empieza a registrar tu peso corporal!",
      color: "bg-green-500 hover:bg-green-600",
      onClick: handleWeightClick,
    },
  ]

  return (
    <div className="min-h-screen bg-muted px-4 py-6 pb-20">
      {/* Header with user profile */}
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

      {/* Quick access cards */}
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

      {/* PowerLytics logo at bottom */}
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
    </div>
  )
}
