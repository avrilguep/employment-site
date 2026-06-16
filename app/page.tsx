import Link from "next/link"
import styles from "./page.module.css"

export default function Home() {
  return (
    <main className={styles.main}>
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: "url('/fondo-inicio.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: -1,
        }}
      />

      <div className={styles.logoWrapper}>
        <img src="/logo.png" alt="Employment Site IA" className={styles.logo} />
      </div>
      <p className={styles.subtitle}>¿Cómo quieres usar la plataforma?</p>

      <div className={styles.grid}>

        {/* Candidato */}
        <Link href="/auth?role=candidate" className={styles.card}>
          <div className={`${styles.iconWrap} ${styles.iconWrapTeal}`}>
            <svg className={styles.iconTeal} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p className={styles.cardTitle}>Soy candidato</p>
            <p className={styles.cardDesc}>Busco empleo y quiero mejorar mi CV</p>
          </div>
        </Link>

        {/* Empresa */}
        <Link href="/auth?role=company" className={styles.card}>
          <div className={`${styles.iconWrap} ${styles.iconWrapPurple}`}>
            <svg className={styles.iconPurple} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <p className={styles.cardTitle}>Soy empresa</p>
            <p className={styles.cardDesc}>Busco candidatos para mis vacantes</p>
          </div>
        </Link>

      </div>
    </main>
  )
}