"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Clock } from "lucide-react"

interface Invitation {
  id: string
  coach_id: string
  coach_name: string
  coach_email: string
  message: string | null
  created_at: string
  status: string
}

export function AthleteInvitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    loadInvitations()
  }, [])

  async function loadInvitations() {
    try {
      console.log("[v0] Loading invitations...")
      const {
        data: { user },
      } = await supabase.auth.getUser()

      console.log("[v0] User:", user?.email)

      if (!user) {
        setInvitations([])
        setLoading(false)
        return
      }

      const { data: invitationsData, error: invError } = await supabase
        .from("coach_invitations")
        .select("id, coach_id, message, created_at, status, athlete_email")
        .eq("athlete_email", user.email)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      console.log("[v0] Invitations data:", invitationsData)
      if (invError) {
        console.error("[v0] Invitations error:", invError)
        throw invError
      }

      if (!invitationsData || invitationsData.length === 0) {
        console.log("[v0] No invitations found")
        setInvitations([])
        setLoading(false)
        return
      }

      const coachIds = invitationsData.map((inv) => inv.coach_id)
      console.log("[v0] Coach IDs:", coachIds)

      const { data: coachesData, error: coachesError } = await supabase
        .from("coaches")
        .select("id, business_name")
        .in("id", coachIds)

      console.log("[v0] Coaches data:", coachesData)
      if (coachesError) {
        console.error("[v0] Coaches error:", coachesError)
        throw coachesError
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", coachIds)

      console.log("[v0] Profiles data:", profilesData)
      if (profilesError) {
        console.error("[v0] Profiles error:", profilesError)
        throw profilesError
      }

      const formatted = invitationsData.map((inv) => {
        const coach = coachesData?.find((c) => c.id === inv.coach_id)
        const profile = profilesData?.find((p) => p.id === inv.coach_id)

        console.log("[v0] Formatting invitation:", {
          coach_id: inv.coach_id,
          coach,
          profile,
          business_name: coach?.business_name,
          email: profile?.email,
        })

        return {
          id: inv.id,
          coach_id: inv.coach_id,
          coach_name: coach?.business_name || profile?.email || "Coach",
          coach_email: profile?.email || "",
          message: inv.message,
          created_at: inv.created_at,
          status: inv.status,
        }
      })

      console.log("[v0] Formatted invitations:", formatted)
      setInvitations(formatted)
    } catch (err: any) {
      console.error("[v0] Error loading invitations:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAccept(invitationId: string) {
    try {
      const { error } = await supabase.rpc("accept_coach_invitation", {
        invitation_id: invitationId,
      })

      if (error) throw error

      await loadInvitations()

      window.location.reload()
    } catch (err: any) {
      console.error("[v0] Error accepting invitation:", err)
      setError(err.message)
    }
  }

  async function handleReject(invitationId: string) {
    try {
      const { error } = await supabase.rpc("reject_coach_invitation", {
        invitation_id: invitationId,
      })

      if (error) throw error

      await loadInvitations()
    } catch (err: any) {
      console.error("[v0] Error rejecting invitation:", err)
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invitaciones de Coach</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando invitaciones...</p>
        </CardContent>
      </Card>
    )
  }

  if (invitations.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {invitations.map((invitation) => (
        <Card key={invitation.id} className="border-primary my-3">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Nueva Invitación de Coach</CardTitle>
            </div>
            <CardDescription>
              {invitation.coach_name}
              {invitation.coach_email &&
                invitation.coach_name !== invitation.coach_email &&
                ` (${invitation.coach_email})`}{" "}
              te ha invitado a ser su atleta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {invitation.message && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm">{invitation.message}</p>
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={() => handleAccept(invitation.id)} className="flex-1">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Aceptar
              </Button>
              <Button onClick={() => handleReject(invitation.id)} variant="outline" className="flex-1">
                <XCircle className="mr-2 h-4 w-4" />
                Rechazar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
