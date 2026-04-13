import React, { useState } from "react";
import { View, Text } from "react-native";
import { MatchesTab } from "@/src/types/auth";

import { styles } from "@/src/styles";
import { MatchesTabs } from "@/src/components/ui/MatchesTabs";
import Live from "../matches/Live";
import Programmed from "../matches/Programmed";
import Finished from "../matches/Finished";


interface TabContentProps {
  tab: MatchesTab;
}

function TabContent({ tab }: TabContentProps) {
  if (tab === 'live') return <Live />;
  if (tab === 'programmed') return <Programmed />;
  if (tab === 'finished') return <Finished />;
  return null;
}

export default function Matches() {
  const [activeTab, setActiveTab] = useState<MatchesTab>('live');

  return (
    <View className={styles.screenBase}>
      
      <View className=" pt-5">

        <Text className={`${styles.titleText} mb-6`}>
          Iniciar Sesión
        </Text>

        <MatchesTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <TabContent tab={activeTab} />

      </View>
    </View>
  );
}