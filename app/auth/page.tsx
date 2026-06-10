import { Suspense } from "react"
import AuthForm from "./AuthForm"

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-400">Cargando...</p>
    </div>}>
      <AuthForm />
    </Suspense>
  )
}