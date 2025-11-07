import { StatsView } from "@/components/stats-view"
import { AuthGuard } from "@/components/auth-guard"

export default function StatsPage() {
  return (
    <AuthGuard>
      <main className="min-h-screen bg-muted">
        <StatsView />
      </main>
    </AuthGuard>
  )
}
