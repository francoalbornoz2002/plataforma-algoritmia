import { useState, useEffect } from "react";

/**
 * Hook personalizado para "retrasar" la actualización de un valor.
 * Es útil para evitar llamadas excesivas a la API en campos de búsqueda.
 * @param value El valor que se quiere retrasar (ej: el 'searchTerm').
 * @param delay El tiempo de retraso en milisegundos (ej: 500).
 * @returns El valor 'value' después de que 'delay' ms hayan pasado sin cambios.
 */
export function useDebounce<T>(value: T, delay: number): T {
  // Estado para guardar el valor "retrasado"
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // 1. Inicia un temporizador
    const handler = setTimeout(() => {
      // 2. Después del 'delay', actualiza el estado al valor más reciente
      setDebouncedValue(value);
    }, delay);

    // 3. Función de limpieza:
    // Si 'value' cambia (el usuario tecleó de nuevo) o el componente se desmonta,
    // se limpia el temporizador anterior ANTES de crear uno nuevo.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Solo se re-ejecuta si el valor o el delay cambian

  return debouncedValue;
}
