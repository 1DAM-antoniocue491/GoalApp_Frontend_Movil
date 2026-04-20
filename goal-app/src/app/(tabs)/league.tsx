import { Text, View } from "react-native";
import React, { useState } from "react";
import { styles } from "@/src/shared/styles";
import { MatchesTabs } from "@/src/features/matches/components/MatchesTabs";
import { LeagueTab, MatchesTab } from "@/src/shared/types/auth";
import Live from "../matches/Live";
import Programmed from "../matches/Programmed";
import Finished from "../matches/Finished";
import Match from "../league/match";
import Teams from "../league/teams";
import Classification from "../league/classification";
import { LeagueTabs } from "@/src/features/leagues/components/LeagueTabs";

interface TabContentProps {
  tab: LeagueTab;
}

function TabContent({ tab }: TabContentProps) {
  if (tab === 'match') return <Match />;
  if (tab === 'teams') return <Teams />;
  if (tab === 'classification') return <Classification />;
  return null;
}

export default function HomeScreen() {
     const [activeTab, setActiveTab] = useState<LeagueTab>('match');
    return (
         <View className={styles.screenBase}>
              
              <View className="">
        
                <Text className={`${styles.titleText} mb-6`}>
                  Iniciar Sesión
                </Text>
        
                <LeagueTabs
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
                <TabContent tab={activeTab} />
        
              </View>
            </View>
    );
}