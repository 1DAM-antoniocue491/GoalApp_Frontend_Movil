export const routes = {
  public: {
    landing: '/',
    login: '/auth/login',
    register: '/auth/register',
  },

  private: {
    onboarding: '/onboarding',
    dashboard: '/(tabs)',
    league: '/(tabs)/league',
    matches: '/(tabs)/matches',
    profile: '/(tabs)/profile',
    settings: '/(tabs)/settings',
    add: '/(tabs)/add',
  },

  league: {
    index: '/league',
    information: '/league/information',
    classification: '/league/classification',
    players: '/league/players',
    teams: '/league/teams',
    template: '/league/template',
  },

  matches: {
    live: '/matches/Live',
    finished: '/matches/Finished',
    programmed: '/matches/Programmed',
    allFinishedAlignment: '/matches/all_finished/alignment',
    allFinishedLive: '/matches/all_finished/live',
    allFinishedStatistics: '/matches/all_finished/statistics',
    allProgrammedPreviousMeetings: '/matches/all_programmed/previousMeetings',
    allProgrammedProgrammed: '/matches/all_programmed/programmed',
    allProgrammedSquad: '/matches/all_programmed/squad',
  },

  modal: '/modal',
  notFound: '/not-found',
} as const;