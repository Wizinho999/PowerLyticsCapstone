import { CoachDashboard } from "@/components/coach-dashboard"
import { AuthGuard } from "@/components/auth-guard"

export default function CoachPage() {
  return (
    <AuthGuard requiredRole="coach">
      <main className="min-h-screen bg-background">
        <CoachDashboard />
      </main>
    </AuthGuard>
  )
}
