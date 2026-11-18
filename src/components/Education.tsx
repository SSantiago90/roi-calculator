import { BookOpen } from "lucide-react";
import type { FinancialResult } from "@/lib/types";
import { money, percentValue } from "@/lib/format";
import { Card, Expandable, SectionHeader } from "./ui";

export function Education({ r }: { r: FinancialResult }) {
  return (
    <Card className="p-5">
      <SectionHeader
        icon={
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
            <BookOpen className="h-4 w-4" />
          </span>
        }
        title="Conceptos clave"
        subtitle="Explicaciones breves con ejemplos basados en tus números."
      />
      <div className="mt-4 space-y-2.5">
        <Expandable title="¿Qué es el ROI?" defaultOpen>
          <p>
            El <strong>retorno de inversión (ROI)</strong> compara el beneficio económico
            de un proyecto con la inversión total requerida, expresado como porcentaje.
          </p>
          <Example>
            En tu caso, el ROI potencial a 12 meses es {percentValue(r.firstYearPotentialROI)}:
            por cada dólar invertido en el primer año se estima un retorno de{" "}
            {money((r.firstYearPotentialNetValue ?? 0) / Math.max(1, 1))} netos sobre un TCO de{" "}
            {money(r.firstYearTCO)}.
          </Example>
        </Expandable>

        <Expandable title="¿Qué es el TCO?">
          <p>
            El <strong>costo total de propiedad (TCO)</strong> suma implementar, operar y
            mantener una solución durante un período definido.
          </p>
          <Example>
            Tu TCO mensual operativo es {money(r.monthlyTCO)} y el TCO del primer año
            (con la inversión inicial incluida) es {money(r.firstYearTCO)}.
          </Example>
        </Expandable>

        <Expandable title="¿Qué es el payback?">
          <p>
            El <strong>período de recuperación</strong> estima cuánto tiempo lleva recuperar
            la inversión inicial con los beneficios netos recurrentes.
          </p>
          <Example>
            Es teórico salvo que la capacidad liberada se convierta en valor real del negocio.
          </Example>
        </Expandable>

        <Expandable title="¿Por qué automatizar no siempre es ahorrar?">
          <p>
            Automatizar tareas libera tiempo sin necesariamente reducir la nómina. Ese tiempo
            puede destinarse a atender más clientes, mejorar la calidad o aumentar la capacidad.
          </p>
          <Example>
            Estás liberando alrededor de {money(r.releasedCapacityValue)} por mes en capacidad
            equivalente; cuánto se transforma en ahorro depende del % de captura que definas.
          </Example>
        </Expandable>

        <Expandable title="ROI potencial vs. ROI realizado">
          <p>
            El <strong>ROI potencial</strong> valora toda la capacidad operativa liberada. El{" "}
            <strong>ROI realizado</strong> considera solo el valor que podés justificar como
            efectivamente capturado.
          </p>
          <Example>
            Potencial: {percentValue(r.firstYearPotentialROI)} · Realizado:{" "}
            {r.captureConfigured ? percentValue(r.realizedFirstYearROI) : "sin configurar (captura 0%)"}.
          </Example>
        </Expandable>

        <Expandable title="¿Por qué importan los supuestos?">
          <p>
            La calculadora proyecta resultados potenciales. Los resultados reales dependerán de
            la adopción, la precisión real de la automatización, el desempeño operativo, el
            mantenimiento y el valor de negocio medido.
          </p>
        </Expandable>
      </div>
    </Card>
  );
}

function Example({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs leading-relaxed text-blue-900">
      <strong className="font-semibold">Con tus números:</strong> {children}
    </p>
  );
}
