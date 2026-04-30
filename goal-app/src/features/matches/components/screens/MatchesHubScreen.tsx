// /**
//  * MatchesHubScreen
//  * Hub de partidos dentro de una liga.
//  * Orquesta las tres vistas (En vivo, Programados, Finalizados) mediante tabs.
//  * TODO: conectar con datos reales cuando la API esté disponible.
//  */

// import React, { useState } from 'react';
// import { View } from 'react-native';
// import { MatchesTab } from '@/src/shared/types/auth';
// import { MatchStatusTabs } from '@src/features/matches/components/tabs/MatchStatusTabs';
// import { LiveMatchesScreen } from './LiveMatchesScreen';
// import { ProgrammedMatchesScreen } from './ProgrammedMatchesScreen';
// import { FinishedMatchesScreen } from './FinishedMatchesScreen';

// interface TabContentProps {
//     tab: MatchesTab;
// }

// function TabContent({ tab }: TabContentProps) {
//     if (tab === 'live') return <LiveMatchesScreen />;
//     if (tab === 'programmed') return <ProgrammedMatchesScreen />;
//     if (tab === 'finished') return <FinishedMatchesScreen />;
//     return null;
// }

// export function MatchesHubScreen() {
//     const [activeTab, setActiveTab] = useState<MatchesTab>('live');
//     return (
//         <View className="mt-10">
//             <MatchStatusTabs
//                 activeTab={activeTab}
//                 setActiveTab={setActiveTab}
//             />
//             <TabContent tab={activeTab} />
//         </View>
//     );
// }
