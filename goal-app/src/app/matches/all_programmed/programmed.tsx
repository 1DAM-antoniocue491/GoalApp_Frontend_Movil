import { Text, View } from "react-native";
import React from "react";
import { styles } from "@/src/styles";
import { MatchesTabs } from "@/src/components/ui/MatchesTabs";

export default function Programmed() {
    return (
        <View className={styles.screenBase}>
            <View className="items-center pt-5">
                <Text className={`${styles.titleText} mb-6`}>Iniciar Sesión</Text>

            </View>
        </View>
    );
}