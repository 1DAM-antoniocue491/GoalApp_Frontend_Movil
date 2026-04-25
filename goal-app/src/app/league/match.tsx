import React, { useState } from "react";
import { View, Text } from "react-native";
import { styles } from "@/src/shared/styles";
import { MatchesTab } from "@/src/shared/types/auth";
import Live from "../matches/Live";
import Programmed from "../matches/Programmed";
import Finished from "../matches/Finished";
import { MatchesTabs } from "@/src/features/matches/components/MatchesTabs";

interface TabContentProps {
    tab: MatchesTab;
}

function TabContent({ tab }: TabContentProps) {
    if (tab === 'live') return <Live />;
    if (tab === 'programmed') return <Programmed />;
    if (tab === 'finished') return <Finished />;
    return null;
}

export default function Match() {
    const [activeTab, setActiveTab] = useState<MatchesTab>('live');
    return (
        <View className="mt-10">
            <MatchesTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />
            <TabContent tab={activeTab} />
        </View>
    );
}