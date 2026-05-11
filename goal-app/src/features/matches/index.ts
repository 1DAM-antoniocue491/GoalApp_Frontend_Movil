// Tabs
export { MatchStatusTabs } from "@/src/features/matches/components/tabs/MatchStatusTabs";
export { ProgrammedMatchDetailTabs } from "@/src/features/matches/components/tabs/ProgrammedMatchDetailTabs";

// Cards
export { LiveMatchCard } from "@/src/features/matches/components/cards/LiveMatchCard";
export { ProgrammedMatchCard } from "@/src/features/matches/components/cards/ProgrammedMatchCard";
export { FinishedMatchCard } from "@/src/features/matches/components/cards/FinishedMatchCard";

// Screens
export { LiveMatchesScreen } from "@/src/features/matches/components/screens/LiveMatchesScreen";
export { FinishedMatchesScreen } from "@/src/features/matches/components/screens/FinishedMatchesScreen";
export { ProgrammedMatchesScreen } from "@/src/features/matches/components/screens/ProgrammedMatchesScreen";
export { LiveMatchSquadsScreen } from "@/src/features/matches/components/screens/LiveMatchSquadsScreen";
export { ProgrammedMatchConvocationScreen } from "@/src/features/matches/components/screens/ProgrammedMatchConvocationScreen";
export { ProgrammedMatchLineupScreen } from "@/src/features/matches/components/screens/ProgrammedMatchLineupScreen";
export { ProgrammedMatchSquadScreen } from "@/src/features/matches/components/screens/ProgrammedMatchSquadScreen";
export { ProgrammedMatchDetailScreen } from "@/src/features/matches/components/screens/ProgrammedMatchDetailScreen";
export { ProgrammedMatchPreviousMeetingsScreen } from "@/src/features/matches/components/screens/ProgrammedMatchPreviousMeetingsScreen";
export { FinishedMatchAlignmentScreen } from "@/src/features/matches/components/screens/FinishedMatchAlignmentScreen";
export { FinishedMatchDetailScreen } from "@/src/features/matches/components/screens/FinishedMatchDetailScreen";
export { FinishedMatchStatisticsScreen } from "@/src/features/matches/components/screens/FinishedMatchStatisticsScreen";

// Modales
export { RegisterEventModal } from "@/src/features/matches/components/modals/RegisterEventModal";
export { EndMatchModal } from "@/src/features/matches/components/modals/EndMatchModal";
export { StartMatchModal } from "@/src/features/matches/components/modals/StartMatchModal";
export { GoalEventModal } from "@/src/features/matches/components/modals/GoalEventModal";
export { YellowCardModal } from "@/src/features/matches/components/modals/YellowCardModal";
export { RedCardModal } from "@/src/features/matches/components/modals/RedCardModal";
export { SubstitutionModal } from "@/src/features/matches/components/modals/SubstitutionModal";
export { EditScheduledMatchModal } from "@/src/features/matches/components/modals/EditScheduledMatchModal";

export type {
  MatchEventType,
  LiveMatchContext,
} from "@/src/features/matches/components/modals/RegisterEventModal";
export type {
  LiveMatchSummary,
  EndMatchData,
} from "@/src/features/matches/components/modals/EndMatchModal";
export type { ProgrammedMatchContext } from "@/src/features/matches/components/modals/StartMatchModal";
export type { GoalEventData } from "@/src/features/matches/components/modals/GoalEventModal";
export type { YellowCardEventData } from "@/src/features/matches/components/modals/YellowCardModal";
export type {
  RedCardType,
  RedCardEventData,
} from "@/src/features/matches/components/modals/RedCardModal";
export type { SubstitutionEventData } from "@/src/features/matches/components/modals/SubstitutionModal";
export type { EditScheduledMatchData } from "@/src/features/matches/components/modals/EditScheduledMatchModal";
