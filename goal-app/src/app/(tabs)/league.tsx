import { Text, View, Image } from "react-native";
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
      <View className="mt-10">
        <View className="flex flex-row items-center
        ">
          <Image source={require('../../../assets/images/liga.png')} className="w-15 h-15" resizeMode="contain" />
          <Text className={`${styles.titleText} ml-6`}>2025-2026</Text>

        </View>

        <LeagueTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabContent tab={activeTab} />
      </View>
    </View>
  );
}