import { AuthGuard } from "@/components/auth-guard"
import { CoachBlockCreator } from "@/components/coach-block-creator"

export default function CoachBlockCreatePage() {
  return (
    <AuthGuard requiredRole="coach">
      <CoachBlockCreator />
    </AuthGuard>
  )
}
