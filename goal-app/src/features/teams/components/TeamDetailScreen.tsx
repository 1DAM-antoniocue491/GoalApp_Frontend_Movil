/**
 * TeamDetailScreen
 * Pantalla de detalle de un equipo con tabs: Información y Plantilla.
 * TODO: conectar con datos reales cuando la API esté disponible.
 */

import React, { useState } from 'react';
import { View, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Link, RelativePathString } from 'expo-router';
import { styles } from '@/src/shared/styles';
import { TeamTabs } from '@/src/shared/types/auth';
import { TeamsTabs } from './TeamsTabs';
import { TeamInformationTab } from './TeamInformationTab';
import { TeamSquadTab } from './TeamSquadTab';

interface TabContentProps {
    tab: TeamTabs;
}

function TabContent({ tab }: TabContentProps) {
    if (tab === 'information') return <TeamInformationTab />;
    if (tab === 'squad') return <TeamSquadTab />;
    return null;
}

export function TeamDetailScreen() {
    const [activeTab, setActiveTab] = useState<TeamTabs>('information');
    return (
        <View className={styles.screenBase}>
            <SafeAreaView className="flex-1">
                <Link href={'../../(tabs)/calendar' as RelativePathString} className="m-3">
                    <View className="bg-[#0F0F13] justify-center items-center rounded-4xl p-1 border border-[#262626]">
                        <Ionicons name="chevron-back-circle-outline" size={25} color="#FFFFFF" />
                    </View>
                </Link>
                <View className="items-center">
                    <Image source={require('../../../../assets/images/betis.png')} className="w-30 h-30" resizeMode="contain" />
                    <Text className="text-white font-black text-2xl">Real Betis Balompié</Text>
                </View>
                <TeamsTabs activeTab={activeTab} setActiveTab={setActiveTab} />
                <TabContent tab={activeTab} />
            </SafeAreaView>
        </View>
    );
}
