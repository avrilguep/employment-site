import { Suspense } from "react"
import AuthForm from "./AuthForm"

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p>Cargando...</p>
      </div>
    }>
      <AuthForm />
    </Suspense>
  )
}