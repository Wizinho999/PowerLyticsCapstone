import { CalendarView } from "@/components/calendar-view"
import { AuthGuard } from "@/components/auth-guard"

export default function CalendarPage() {
  return (
    <AuthGuard>
      <main className="min-h-screen bg-muted">
        <CalendarView />
      </main>
    </AuthGuard>
  )
}
