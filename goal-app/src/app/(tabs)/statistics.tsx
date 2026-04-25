import React, { useState } from "react";
import { View, Text, Image } from "react-native";
import { LeagueStatisticsTabs } from "@/src/shared/types/auth";

import { styles } from "@/src/shared/styles";
import { MatchesTabs } from "@/src/features/matches/components/MatchesTabs";
import Live from "../matches/Live";
import Programmed from "../matches/Programmed";
import Finished from "../matches/Finished";
import Match from "../statistics/match";
import Players from "../statistics/players";
import { StatisticsTabs } from "@/src/features/matches/components/StatisticsTabs";


/*
Todo esto se debe de modificar para que se ajuste a la nueva arquitectura de carpetas y rutas semánticas
*/ 
interface TabContentProps {
  tab: LeagueStatisticsTabs;
}

function TabContent({ tab }: TabContentProps) {
  if (tab === 'match') return <Match />;
  if (tab === 'players') return <Players />;
  return null;
}

export default function Matches() {
  const [activeTab, setActiveTab] = useState<LeagueStatisticsTabs>('match');

  return (
    <View className={styles.screenBase}>
      <View className="mt-10">
        <View className="flex flex-row items-center">
          <Image source={require('../../../assets/images/liga.png')} className="w-15 h-15" resizeMode="contain" />
          <Text className={`${styles.titleText} ml-6`}>2025-2026</Text>
        </View>

        <StatisticsTabs activeTab={activeTab} setActiveTab={setActiveTab}/>
        <TabContent tab={activeTab} />
      </View>
    </View>
  );
}