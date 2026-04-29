// Tabs — fuente de verdad semántica para cada contexto de navegación interna
export { MatchStatusTabs } from './tabs/MatchStatusTabs';
export { ProgrammedMatchDetailTabs } from './tabs/ProgrammedMatchDetailTabs';
export { FinishedMatchDetailTabs } from './tabs/FinishedMatchDetailTabs';

// Cards reutilizables — fuente de verdad visual para cada estado de partido
export { LiveMatchCard } from './cards/LiveMatchCard';
export { ProgrammedMatchCard } from './cards/ProgrammedMatchCard';
export { FinishedMatchCard } from './cards/FinishedMatchCard';

// Screens de plantilla/convocatoria/alineación — cada caso de uso tiene su pantalla
export { LiveMatchSquadsScreen } from './screens/LiveMatchSquadsScreen';
export { ProgrammedMatchConvocationScreen } from './screens/ProgrammedMatchConvocationScreen';
export { ProgrammedMatchLineupScreen } from './screens/ProgrammedMatchLineupScreen';

// Modales operativos de partido — reutilizables desde calendar, dashboard y matches
export { RegisterEventModal } from './modals/RegisterEventModal';
export { EndMatchModal } from './modals/EndMatchModal';
export { StartMatchModal } from './modals/StartMatchModal';
export { GoalEventModal } from './modals/GoalEventModal';
export { YellowCardModal } from './modals/YellowCardModal';
export { RedCardModal } from './modals/RedCardModal';
export { SubstitutionModal } from './modals/SubstitutionModal';
export type { MatchEventType, LiveMatchContext } from './modals/RegisterEventModal';
export type { LiveMatchSummary, EndMatchData } from './modals/EndMatchModal';
export type { ProgrammedMatchContext } from './modals/StartMatchModal';
export type { GoalEventData } from './modals/GoalEventModal';
export type { YellowCardEventData } from './modals/YellowCardModal';
export type { RedCardType, RedCardEventData } from './modals/RedCardModal';
export type { SubstitutionEventData } from './modals/SubstitutionModal';