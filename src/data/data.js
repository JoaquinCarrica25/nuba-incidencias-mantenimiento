// ============================================================
// NUBA INCIDENCIAS — Datos estáticos v2
// ============================================================

export const APARTAMENTOS_LISTA = [
  "ALMADEN", "CARRETAS", "CAVA ALTA", "CONCEPCIÓN", "COSTANILLA",
  "FOMENTO", "IMPERIAL", "Mayor", "MONTERA", "MORATIN", "MORERIA",
  "MORENO NIETO", "NAVAS", "SAN BARTOLOME", "SAN MIGUEL", "TETUAN",
  "TORRECILLA", "VIRGEN DE LA PALOMA", "VALENCIA", "OLIVAR", "INFANTE",
  "ZURBANO", "ROBLEDO", "MOSTENSES", "ANTONIO LOPES"
];

export const RESPONSABLES = ["Joaquín", "Oscar", "Vanessa", "Técnico Externo"];

export const URGENCIAS = [
  { value: "baja",  label: "Baja",  color: "bg-green-500",  text: "text-green-700",  bg: "bg-green-50",  border: "border-green-200" },
  { value: "media", label: "Media", color: "bg-yellow-400", text: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200" },
  { value: "alta",  label: "Alta",  color: "bg-red-500",    text: "text-red-700",    bg: "bg-red-50",    border: "border-red-200" },
];

export const TAREAS_PREVENTIVAS_BASE = [
  "Limpieza de filtros de Aire Acondicionado",
  "Desatascar y limpiar bote sifónico",
];

export const ALERTA_HORAS = [24, 48, 72];

export const USUARIOS = {
  "logistica@nubagestion.es": {
    password: "Nuba2026",
    nombre: "Oscar / Vanessa",
    rol: "logistica",
  },
  "joaquin.carrica20@gmail.com": {
    password: "Nuba2026",
    nombre: "Joaquín",
    rol: "admin",
  },
};
