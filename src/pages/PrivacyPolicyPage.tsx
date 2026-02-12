import LegalLayout from "@/components/legal/LegalLayout";

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Política de Privacidad"
      subtitle="En Lead Widget tratamos tus datos con medidas de seguridad y uso limitado al servicio contratado."
      updatedAt="12/02/2026"
    >
      <section className="space-y-3">
        <h2 className="text-xl font-bold">1. Datos que recopilamos</h2>
        <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
          Podemos recopilar datos de cuenta (correo, nombre de negocio), configuración del widget, eventos de uso,
          y datos de leads capturados mediante tu widget.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">2. Finalidad del tratamiento</h2>
        <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
          Usamos esta información para operar el servicio, mejorar rendimiento, prevenir abuso y mostrar métricas
          en tu dashboard.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">3. Seguridad y almacenamiento</h2>
        <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
          Aplicamos controles técnicos y organizativos para proteger la información. Los datos se almacenan en
          infraestructura cloud con acceso restringido.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">4. Compartición de datos</h2>
        <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
          No vendemos tus datos. Solo se comparten con proveedores necesarios para operar la plataforma (por ejemplo,
          infraestructura y servicios de mensajería o pago), bajo obligaciones de confidencialidad.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">5. Derechos del titular</h2>
        <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
          Puedes solicitar acceso, corrección o eliminación de datos desde los canales de soporte oficiales de Lead
          Widget. También puedes cancelar tu cuenta cuando lo necesites.
        </p>
      </section>
    </LegalLayout>
  );
}

