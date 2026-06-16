"use client"

interface PrivacyModalProps {
  onAccept: () => void
  onReject: () => void
}

export default function PrivacyModal({ onAccept, onReject }: PrivacyModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800">Aviso de Privacidad</h2>
          </div>
          <p className="text-sm text-slate-500">
            Antes de continuar, lee y acepta nuestras políticas de privacidad y tratamiento de datos.
          </p>
        </div>

        {/* Contenido scrolleable */}
        <div className="overflow-y-auto p-6 flex flex-col gap-5 text-sm text-slate-600">

          <div>
            <h3 className="font-semibold text-slate-800 mb-2">1. Datos que recopilamos</h3>
            <p>Al usar Employment Site recopilamos la siguiente información personal:</p>
            <ul className="list-disc pl-5 mt-2 flex flex-col gap-1 text-slate-500">
              <li>Nombre completo y correo electrónico</li>
              <li>Información profesional: puesto deseado, área laboral, habilidades y ubicación</li>
              <li>Contenido completo de tu Currículum Vitae (CV) en formato de texto</li>
              <li>Preferencias de modalidad de trabajo y expectativas laborales</li>
              <li>En caso de empresas: nombre, industria y descripción de la organización</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-800 mb-2">2. Uso de tus datos</h3>
            <p>Tu información será utilizada para:</p>
            <ul className="list-disc pl-5 mt-2 flex flex-col gap-1 text-slate-500">
              <li>Analizar tu CV mediante inteligencia artificial (IA) para generar recomendaciones de vacantes</li>
              <li>Mostrar tu perfil a empresas registradas en la plataforma si activas tu perfil público</li>
              <li>Permitir que empresas analicen tu compatibilidad con sus vacantes mediante IA</li>
              <li>Mejorar las recomendaciones del chat inteligente basándose en tu perfil</li>
              <li>Enviarse a servicios de terceros como Anthropic (proveedor de IA) para procesamiento</li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h3 className="font-semibold text-amber-800 mb-2">⚠ Riesgos que debes conocer</h3>
            <ul className="list-disc pl-5 flex flex-col gap-1.5 text-amber-700">
              <li>El contenido de tu CV, incluyendo datos personales, experiencia y habilidades, será procesado por modelos de inteligencia artificial externos</li>
              <li>Si activas tu perfil público, cualquier empresa registrada en la plataforma podrá ver tu información profesional y el contenido de tu CV</li>
              <li>Los datos se almacenan en servidores de Supabase (infraestructura en la nube). Aunque se aplican medidas de seguridad, ningún sistema es 100% invulnerable</li>
              <li>Esta plataforma es un proyecto en desarrollo. No garantizamos disponibilidad continua ni protección absoluta contra pérdida de datos</li>
              <li>No compartimos tu información con terceros con fines comerciales o publicitarios</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-800 mb-2">3. Tus derechos</h3>
            <ul className="list-disc pl-5 flex flex-col gap-1 text-slate-500">
              <li>Puedes desactivar tu perfil público en cualquier momento</li>
              <li>Puedes eliminar tu cuenta y datos contactando al administrador</li>
              <li>Puedes usar la plataforma sin subir tu CV, aunque las funciones serán limitadas</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-800 mb-2">4. Servicios de terceros</h3>
            <p className="text-slate-500">
              Esta plataforma utiliza los siguientes servicios externos que tienen sus propias políticas de privacidad:
            </p>
            <ul className="list-disc pl-5 mt-2 flex flex-col gap-1 text-slate-500">
              <li><span className="font-medium text-slate-600">Anthropic Claude</span> — procesamiento de IA y análisis de CVs</li>
              <li><span className="font-medium text-slate-600">Supabase</span> — almacenamiento de datos y autenticación</li>
              <li><span className="font-medium text-slate-600">Vercel</span> — infraestructura y hospedaje de la aplicación</li>
            </ul>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500">
              Al aceptar estas políticas confirmas que has leído, entendido y aceptas el tratamiento de tus datos personales tal como se describe en este aviso. Si rechazas, no podrás acceder a las funcionalidades de la plataforma.
            </p>
          </div>

        </div>

        {/* Botones */}
        <div className="p-6 border-t border-slate-100 flex flex-col gap-3">
          <button
            onClick={onAccept}
            className="w-full py-3 rounded-xl text-sm font-medium text-white bg-teal-600 hover:opacity-90 transition-opacity"
          >
            Acepto las políticas de privacidad
          </button>
          <button
            onClick={onReject}
            className="w-full py-3 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Rechazar
          </button>
        </div>

      </div>
    </div>
  )
}