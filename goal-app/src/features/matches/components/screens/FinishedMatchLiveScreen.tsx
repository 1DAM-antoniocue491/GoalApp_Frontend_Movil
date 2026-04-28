/**
 * FinishedMatchLiveScreen
 * Vista detallada de un partido (en directo o finalizado).
 * Muestra marcador, eventos y tabs de estadísticas/alineaciones.
 * TODO: conectar con datos reales cuando la API esté disponible.
 */

import React, { useState } from 'react';
import { Text, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, RelativePathString } from 'expo-router';
import { styles } from '@/src/shared/styles';
import { StatisticTabs } from '@/src/shared/types/auth';
import { MatchesLive } from '@/src/features/matches/components/MatchesLive';
// Tabs de contenido dentro de la misma pantalla
import { FinishedMatchStatisticsScreen } from './FinishedMatchStatisticsScreen';
import { FinishedMatchAlignmentScreen } from './FinishedMatchAlignmentScreen';

interface TabContentProps {
    tab: StatisticTabs;
}

function TabContent({ tab }: TabContentProps) {
    if (tab === 'statistics') return <FinishedMatchStatisticsScreen />;
    if (tab === 'alignment') return <FinishedMatchAlignmentScreen />;
    return null;
}

export function FinishedMatchLiveScreen() {
    const [activeTab, setActiveTab] = useState<StatisticTabs>('statistics');
    return (
        <View className={styles.screenBase}>
            <SafeAreaView className="flex-1">
                <View className="p-7 justify-center ">
                    <View className="flex flex-row justify-between">
                        <View className="flex flex-row items-center gap-2">
                            <Link href={'../../(tabs)/calendar' as RelativePathString}>
                                <Ionicons name="chevron-back-circle-outline" size={25} color="#FFFFFF" className="bg-[#0F0F13] justify-center items-center rounded-4xl p-1 border border-[#262626]" />
                            </Link>
                            <Text className="text-3xl font-bold text-white">Partido</Text>
                        </View>
                        <Ionicons name="ellipsis-vertical-outline" size={35} color="#FFFFFF" />
                    </View>
                    <Text className="text-[#ADAEA9] ml-8 pb-10">Partido en directo</Text>
                    <View className="flex flex-col justify-between items-center border border-[#C8F558] rounded-2xl m-3 bg-[#161616] shadow-sm shadow-[#C8F558] p-8">
                        <View className="flex flex-row">
                            <View className="flex flex-col items-center justify-center">
                                <Image source={require('../../../../../assets/images/betis.png')} className="w-30 h-30" resizeMode="contain" />
                                <Text className="text-white font-black text-2xl">Real Betis</Text>
                                <Text className="text-[#ADAEA9] text-xs mt-4">Cucho Hernández 61' 70'</Text>
                            </View>
                            <View className="flex flex-col items-center justify-center">
                                <View className="flex flex-row gap-3">
                                    <Text className="text-white text-4xl font-black">2</Text>
                                    <Text className="text-white text-4xl font-black">-</Text>
                                    <Text className="text-white text-4xl font-black">1</Text>
                                </View>
                                <Text className="text-white bg-[#010103] rounded-2xl p-2">59:00</Text>
                            </View>
                            <View className="flex flex-col items-center justify-center">
                                <Image source={require('../../../../../assets/images/realMadrid.png')} className="w-30 h-30" resizeMode="contain" />
                                <Text className="text-white font-black text-2xl">Real Madrid</Text>
                                <Text className="text-[#ADAEA9] text-xs mt-4">Kyliam Mbappé 10'</Text>
                            </View>
                        </View>
                        <View className="flex flex-row justify-center items-center gap-2 mt-4">
                            <Ionicons name="location-outline" size={18} color="#C8F558" className="items-center" />
                            <Text className="text-[#C8F558]">Estadio La Cartuja</Text>
                        </View>
                    </View>
                </View>
                <MatchesLive activeTab={activeTab} setActiveTab={setActiveTab} />
                <TabContent tab={activeTab} />
            </SafeAreaView>
        </View>
    );
}
