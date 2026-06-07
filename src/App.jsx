// ============================================================
// NUBA INCIDENCIAS — App Root v2
// ============================================================
import { useState, useEffect } from "react";
import { useAuth } from "./lib/AuthContext";
import { supabase } from "./lib/supabase";
import { APARTAMENTOS_LISTA } from "./data/data";
import Login from "./components/auth/Login";
import Sidebar from "./components/layout/Sidebar";
import Prevenciones from "./components/tabs/Prevenciones";
import Averias from "./components/tabs/Averias";
import Pendientes from "./components/tabs/Pendientes";
import Reparaciones from "./components/tabs/Reparaciones";
import Calendario from "./components/tabs/Calendario";

export default function App() {
  const { user } = useAuth();
  const [apartamentos, setApartamentos] = useState([]);
  const [activo, setActivo]             = useState(null);
  const [pestana, setPestana]           = useState("averias");
  const [alertas, setAlertas]           = useState({});

  useEffect(() => { if (user) { cargarApartamentos(); solicitarNotificaciones(); } }, [user]);

  const solicitarNotificaciones = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  const cargarApartamentos = async () => {
    const { data } = await supabase.from("apartamentos").select("*").order("nombre");
    if (!data || data.length === 0) {
      for (const nombre of APARTAMENTOS_LISTA) {
        await supabase.from("apartamentos").insert({ nombre, capacidad: 2 });
      }
      const { data: d2 } = await supabase.from("apartamentos").select("*").order("nombre");
      setApartamentos(d2 || []);
      setActivo(d2?.[0] || null);
    } else {
      setApartamentos(data);
      if (!activo) setActivo(data[0]);
    }
  };

  if (!user) return <Login />;

  const renderTab = () => {
    switch (pestana) {
      case "prevenciones": return <Prevenciones apartamento={activo} />;
      case "averias":      return <Averias apartamento={activo} apartamentos={apartamentos} />;
      case "pendientes":   return <Pendientes apartamento={activo} alertas={alertas} setAlertas={setAlertas} />;
      case "reparaciones": return <Reparaciones apartamentos={apartamentos} />;
      case "calendario":   return <Calendario apartamento={activo} apartamentos={apartamentos} />;
      default: return null;
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-page font-sans">
      <Sidebar
        apartamentos={apartamentos}
        activo={activo}
        onSelect={setActivo}
        pestana={pestana}
        onPestana={setPestana}
        alertas={alertas}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="md:hidden h-16 flex-shrink-0" />
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          {renderTab()}
        </main>
      </div>
    </div>
  );
}
