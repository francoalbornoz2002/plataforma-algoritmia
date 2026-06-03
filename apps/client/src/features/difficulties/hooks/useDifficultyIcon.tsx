import { useMemo } from "react";
import BugReportIcon from "@mui/icons-material/BugReport";
import {
  AltRoute,
  BugReport,
  DisabledVisible,
  DoNotTouch,
  DragHandle,
  FilterListOff,
  Loop,
  MobiledataOff,
  ModelTraining,
  MoveUp,
  NearbyError,
  RemoveRoad,
  Replay5,
  RunningWithErrors,
  TravelExplore,
} from "@mui/icons-material";

export const useDifficultyIcon = (nombre: string) => {
  return useMemo(() => {
    switch (nombre) {
      case "Redundancia de instrucciones":
        return <Replay5 />;
      case "No valida un objeto antes de recogerlo":
        return <DisabledVisible />;
      case "Uso de instrucciones innecesarias":
        return <DoNotTouch />;
      case "Mal uso o confusión con operadores lógicos":
        return <AltRoute />;
      case "Mal uso o confusión con operadores relacionales":
        return <DragHandle />;
      case "Problemas para formular proposiciones compuestas":
        return <ModelTraining />;
      case "Bucles mal controlados o infinitos":
        return <Loop />;
      case "Uso incorrecto del bloque SI–SINO":
        return <BugReport />;
      case "Condicionales mal anidados":
        return <RemoveRoad />;
      case "Confusión entre variables locales y globales":
        return <TravelExplore />;
      case "Uso de variables sin inicializar":
        return <RunningWithErrors />;
      case "Uso inconsistente de variables":
        return <NearbyError />;
      case "Mal pasaje de parámetros":
        return <MoveUp />;
      case "No modifica el parámetro de entrada/salida":
        return <MobiledataOff />;
      case "No utiliza todos los parámetros del procedimiento":
        return <FilterListOff />;
      default:
        return <BugReportIcon />; // Ícono por defecto
    }
  }, [nombre]);
};
