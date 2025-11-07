"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserPlus, Users, Mail, CheckCircle2, Clock } from "lucide-react"

interface Athlete {
  id: string
  full_name: string
  email: string
  created_at: string
}

interface Invitation {
  id: string
  athlete_email: string
  status: string
  created_at: string
  athlete_name?: string
}

export function CoachAthleteManagement() {
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      console.log("[v0] Loading coach athlete data...")
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("No autenticado")

      // Load athletes associated with this coach
      const { data: athletesData, error: athletesError } = await supabase
        .from("athletes")
        .select("id, created_at")
        .eq("coach_id", user.user.id)

      if (athletesError) throw athletesError
      console.log("[v0] Athletes data:", athletesData)

      // Load profiles for these athletes
      const athleteIds = athletesData?.map((a) => a.id) || []
      console.log("[v0] Athlete IDs:", athleteIds)

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", athleteIds)

      if (profilesError) throw profilesError
      console.log("[v0] Profiles data:", profilesData)

      // Combine the data
      const formattedAthletes =
        athletesData?.map((a: any) => {
          const profile = profilesData?.find((p) => p.id === a.id)
          return {
            id: a.id,
            full_name: profile?.full_name || profile?.email || "Sin nombre",
            email: profile?.email || "",
            created_at: a.created_at,
          }
        }) || []

      console.log("[v0] Formatted athletes:", formattedAthletes)
      setAthletes(formattedAthletes)

      // Load invitations
      const { data: invitationsData, error: invError } = await supabase
        .from("coach_invitations")
        .select("*")
        .eq("coach_id", user.user.id)
        .order("created_at", { ascending: false })

      if (invError) throw invError

      setInvitations(invitationsData || [])
    } catch (err: any) {
      console.error("[v0] Error loading data:", err)
      setError(err.message)
    }
  }

  async function sendInvitation() {
    if (!email) {
      setError("Por favor ingresa un email")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("No autenticado")

      const { error: insertError } = await supabase.from("coach_invitations").insert({
        coach_id: user.user.id,
        athlete_email: email,
        message: message || null,
      })

      if (insertError) throw insertError

      setSuccess(`Invitación enviada a ${email}`)
      setEmail("")
      setMessage("")
      await loadData()
    } catch (err: any) {
      console.error("[v0] Error sending invitation:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Send Invitation Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            <CardTitle>Invitar Atleta</CardTitle>
          </div>
          <CardDescription>Envía una invitación a un atleta para que se una a tu equipo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email del Atleta</Label>
            <Input
              id="email"
              type="email"
              placeholder="atleta@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensaje (opcional)</Label>
            <Textarea
              id="message"
              placeholder="Escribe un mensaje personalizado..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <Button onClick={sendInvitation} disabled={loading} className="w-full">
            <Mail className="mr-2 h-4 w-4" />
            {loading ? "Enviando..." : "Enviar Invitación"}
          </Button>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.filter((i) => i.status === "pending").length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <CardTitle>Invitaciones Pendientes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invitations
                .filter((i) => i.status === "pending")
                .map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{inv.athlete_email}</p>
                      <p className="text-sm text-muted-foreground">
                        Enviada {new Date(inv.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Athletes */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Mis Atletas ({athletes.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {athletes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aún no tienes atletas. Envía una invitación para comenzar.
            </p>
          ) : (
            <div className="space-y-2">
              {athletes.map((athlete) => (
                <div key={athlete.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{athlete.full_name}</p>
                    <p className="text-sm text-muted-foreground">{athlete.email}</p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
