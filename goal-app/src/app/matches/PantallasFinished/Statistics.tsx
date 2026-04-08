import { Text, View, Image } from "react-native";
import React from "react";
import { styles } from "@/src/styles";
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from "react-native-safe-area-context";
import { StatisticTabs } from "@/src/types/auth";


export default function Statistics() {
    return (
        <View className={styles.screenBase}>
            <SafeAreaView className="flex-1">
                <Text>Hola</Text>
                    
            </SafeAreaView>
        </View>
    );
}