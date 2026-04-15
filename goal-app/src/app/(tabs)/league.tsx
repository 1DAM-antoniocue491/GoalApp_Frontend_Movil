import { Text, View } from "react-native";
import React from "react";
import { styles } from "@/src/shared/styles";
import { MatchesTabs } from "@/src/features/matches/components/MatchesTabs";

export default function HomeScreen() {
    return (
        <View className={styles.screenBase}>
            <View className="items-center pt-5">
                <Text className={`${styles.titleText} mb-6`}>Iniciar Sesión</Text>

            </View>
        </View>
    );
}