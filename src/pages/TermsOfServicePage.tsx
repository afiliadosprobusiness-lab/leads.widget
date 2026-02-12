import LegalLayout from "@/components/legal/LegalLayout";

export default function TermsOfServicePage() {
  return (
    <LegalLayout
      title="Términos de Servicio"
      subtitle="Estos términos regulan el uso de Lead Widget y los derechos y responsabilidades de las cuentas registradas."
      updatedAt="12/02/2026"
    >
      <section className="space-y-3">
        <h2 className="text-xl font-bold">1. Uso del servicio</h2>
        <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
          Lead Widget se ofrece para captación y gestión de leads. El usuario se compromete a usar la plataforma de
          manera lícita y respetando normativa aplicable.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">2. Cuenta y seguridad</h2>
        <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
          Eres responsable de la confidencialidad de tus credenciales. Cualquier actividad realizada con tu cuenta se
          presume autorizada por el titular.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">3. Planes, pagos y renovaciones</h2>
        <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
          Los planes pueden incluir periodos de prueba y renovación periódica. Las condiciones comerciales vigentes se
          muestran en la sección de facturación al momento de contratar.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">4. Restricciones y suspensión</h2>
        <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
          Podemos suspender o limitar cuentas ante uso abusivo, fraude, ataques, incumplimiento legal o riesgo para la
          plataforma o terceros.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">5. Propiedad intelectual</h2>
        <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
          El software, marca y contenidos de Lead Widget son propiedad de sus titulares. No se autoriza copia,
          ingeniería inversa ni explotación no permitida por escrito.
        </p>
      </section>
    </LegalLayout>
  );
}

