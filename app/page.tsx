import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">

        <h1 className="text-4xl font-bold text-slate-800 mb-2">
          Employment Site
        </h1>
        <p className="text-slate-500 mb-12">
          ¿Cómo quieres usar la plataforma?
        </p>

        <div className="grid grid-cols-2 gap-6">

          {/* Tarjeta Candidato */}
          <Link href="/auth?role=candidate">
            <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center gap-4 hover:border-teal-400 hover:shadow-md transition-all cursor-pointer">
              <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Soy candidato</h2>
                <p className="text-sm text-slate-500 mt-1">Busco empleo y quiero mejorar mi CV</p>
              </div>
            </div>
          </Link>

          {/* Tarjeta Empresa */}
          <Link href="/auth?role=company">
            <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center gap-4 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer">
              <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Soy empresa</h2>
                <p className="text-sm text-slate-500 mt-1">Busco candidatos para mis vacantes</p>
              </div>
            </div>
          </Link>

        </div>
      </div>
    </main>
  )
}