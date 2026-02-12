import { useState } from "react";

import LegalLayout from "@/components/legal/LegalLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ClaimsFormData = {
  fullName: string;
  email: string;
  detail: string;
};

const initialState: ClaimsFormData = {
  fullName: "",
  email: "",
  detail: "",
};

export default function ClaimsBookPage() {
  const [form, setForm] = useState<ClaimsFormData>(initialState);
  const [sent, setSent] = useState(false);
  const [claimCode, setClaimCode] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setClaimCode(`LW-${Date.now().toString().slice(-8)}`);
    setSent(true);
    setForm(initialState);
  };

  return (
    <LegalLayout
      title="Libro de Reclamaciones"
      subtitle="Registra aquí una queja o reclamo asociado al servicio. Te responderemos por los canales de contacto que proporciones."
      updatedAt="12/02/2026"
    >
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Registro de reclamo</h2>
        <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
          Completa el formulario con información veraz. Al enviar, se generará un código de referencia para seguimiento.
        </p>

        {sent ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            Reclamo registrado correctamente. Código de referencia: <strong>{claimCode}</strong>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/40 p-5">
          <div className="space-y-2">
            <Label htmlFor="claim-full-name">Nombres y apellidos</Label>
            <Input
              id="claim-full-name"
              value={form.fullName}
              onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
              placeholder="Ej. Juan Pérez"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="claim-email">Correo de contacto</Label>
            <Input
              id="claim-email"
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="correo@dominio.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="claim-detail">Detalle de la queja o reclamo</Label>
            <Textarea
              id="claim-detail"
              value={form.detail}
              onChange={(event) => setForm((prev) => ({ ...prev, detail: event.target.value }))}
              placeholder="Describe los hechos y el resultado que esperas."
              required
              className="min-h-32"
            />
          </div>

          <Button type="submit" className="w-full sm:w-auto">
            Enviar registro
          </Button>
        </form>
      </section>
    </LegalLayout>
  );
}
