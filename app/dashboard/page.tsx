import { Dashboard } from "@/components/dashboard"
import { AuthGuard } from "@/components/auth-guard"

export default function DashboardPage() {
  return (
    <AuthGuard requiredRole="athlete">
      <main className="min-h-screen bg-muted">
        <Dashboard />
      </main>
    </AuthGuard>
  )
}
