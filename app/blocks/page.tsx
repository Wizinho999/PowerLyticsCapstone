import { TrainingBlocks } from "@/components/training-blocks"
import { AuthGuard } from "@/components/auth-guard"

export default function BlocksPage() {
  return (
    <AuthGuard>
      <main className="min-h-screen bg-muted">
        <TrainingBlocks />
      </main>
    </AuthGuard>
  )
}
