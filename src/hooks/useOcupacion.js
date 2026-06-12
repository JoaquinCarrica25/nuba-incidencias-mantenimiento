// ============================================================
// NUBA INCIDENCIAS — Hook de ocupación por apartamento
// ============================================================
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useOcupacion(apartamentoId) {
  const [estado, setEstado] = useState(null);

  useEffect(() => {
    if (!apartamentoId) return;
    calcular();
  }, [apartamentoId]);

  const calcular = async () => {
    const ahora = new Date().toISOString().slice(0, 16);
    const { data } = await supabase
      .from("reservas").select("*")
      .eq("apartamento_id", apartamentoId)
      .order("fecha_entrada");

    const reservas = data || [];

    const ocupadaAhora = reservas.find(r =>
      (r.fecha_entrada || "").slice(0, 16) <= ahora &&
      (r.fecha_salida  || "").slice(0, 16) >= ahora
    );

    if (ocupadaAhora) {
      setEstado({ tipo: "ocupado", hasta: ocupadaAhora.fecha_salida, desde: ocupadaAhora.fecha_entrada, huespedes: ocupadaAhora.huespedes, notas: ocupadaAhora.notas });
      return;
    }

    const proxima = reservas
      .filter(r => (r.fecha_entrada || "").slice(0, 16) > ahora)
      .sort((a, b) => a.fecha_entrada.localeCompare(b.fecha_entrada))[0];

    setEstado({ tipo: "libre", proximaEntrada: proxima?.fecha_entrada || null, proximaHuespedes: proxima?.huespedes || null });
  };

  return estado;
}
