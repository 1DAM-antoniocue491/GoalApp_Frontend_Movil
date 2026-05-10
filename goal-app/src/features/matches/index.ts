// Tabs — fuente de verdad semántica para cada contexto de navegación interna
export { MatchStatusTabs } from "@/src/features/matches/components/tabs/MatchStatusTabs";
export { ProgrammedMatchDetailTabs } from "@/src/features/matches/components/tabs/ProgrammedMatchDetailTabs";

// Cards reutilizables — fuente de verdad visual para cada estado de partido
export { LiveMatchCard } from "@/src/features/matches/components/cards/LiveMatchCard";
export { ProgrammedMatchCard } from "@/src/features/matches/components/cards/ProgrammedMatchCard";
export { FinishedMatchCard } from "@/src/features/matches/components/cards/FinishedMatchCard";

// Screens de plantilla/convocatoria/alineación — cada caso de uso tiene su pantalla
export { LiveMatchSquadsScreen } from "@/src/features/matches/components/screens/LiveMatchSquadsScreen";
export { ProgrammedMatchConvocationScreen } from "@/src/features/matches/components/screens/ProgrammedMatchConvocationScreen";
export { ProgrammedMatchLineupScreen } from "@/src/features/matches/components/screens/ProgrammedMatchLineupScreen";

// Modales operativos de partido — reutilizables desde calendar, dashboard y matches
export { RegisterEventModal } from "@/src/features/matches/components/modals/RegisterEventModal";
export { EndMatchModal } from "@/src/features/matches/components/modals/EndMatchModal";
export { StartMatchModal } from "@/src/features/matches/components/modals/StartMatchModal";
export { EditScheduledMatchModal } from "@/src/features/matches/components/modals/EditScheduledMatchModal";
export { GoalEventModal } from "@/src/features/matches/components/modals/GoalEventModal";
export { YellowCardModal } from "@/src/features/matches/components/modals/YellowCardModal";
export { RedCardModal } from "@/src/features/matches/components/modals/RedCardModal";
export { SubstitutionModal } from "@/src/features/matches/components/modals/SubstitutionModal";
export type {
  MatchEventType,
  LiveMatchContext,
} from "@/src/features/matches/components/modals/RegisterEventModal";
export type {
  LiveMatchSummary,
  EndMatchData,
} from "@/src/features/matches/components/modals/EndMatchModal";
export type { ProgrammedMatchContext } from "@/src/features/matches/components/modals/StartMatchModal";
export type { EditScheduledMatchData } from "@/src/features/matches/components/modals/EditScheduledMatchModal";
export type { GoalEventData } from "@/src/features/matches/components/modals/GoalEventModal";
export type { YellowCardEventData } from "@/src/features/matches/components/modals/YellowCardModal";
export type {
  RedCardType,
  RedCardEventData,
} from "@/src/features/matches/components/modals/RedCardModal";
export type { SubstitutionEventData } from "@/src/features/matches/components/modals/SubstitutionModal";
