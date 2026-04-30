import React, { useState } from "react";
import { View, Text, Image } from "react-native";
import { LeagueStatisticsTabs } from "@/src/shared/types/auth";

import { styles } from "@/src/shared/styles";
import Match from "../statistics/match";
import Players from "../statistics/players";
import { Colors } from "@/src/shared/constants/colors";


export default function Matches() {
  const [activeTab, setActiveTab] = useState<LeagueStatisticsTabs>('match');

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.bg.surface1 }}>
      <Text>Hola desde C:\Users\Usuario\Desktop\GoalApp_Frontend_Movil\goal-app\src\app\(tabs)\statistics.tsx</Text>
    </View>
  );
}