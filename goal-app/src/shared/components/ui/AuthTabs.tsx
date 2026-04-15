import { styles } from "@/src/shared/styles";
import { AuthTab } from "@/src/shared/types/auth";
import { router } from "expo-router";
import React from "react";
import {
    View, TouchableOpacity, Text
} from "react-native";
import { useRouter } from 'expo-router';


interface AuthTabsProps {
    activeTab: AuthTab
}

export function AuthTabs({ activeTab }: AuthTabsProps) {
    const router = useRouter();

    // navegamos entre rutas. Login y Registro.

    return (
        <View className={styles.tabContainer}>
            <TouchableOpacity
                className={activeTab === 'login' ? styles.tabActive : styles.tabInactive}
                onPress={() => router.push('/auth/login')}
            // Cambiamos a push, se sobreescribe una encima de otra para reducir el flash.
            >
                <Text className={activeTab === 'login' ? styles.tabActiveText : styles.tabInactiveText}>
                    Iniciar Sesión
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                className={activeTab === 'register' ? styles.tabActive : styles.tabInactive}
                onPress={() => router.push('/auth/register')}
            >
                <Text className={activeTab === 'register' ? styles.tabActiveText : styles.tabInactiveText}>
                    Registrarse
                </Text>
            </TouchableOpacity>
        </View>
    );
}