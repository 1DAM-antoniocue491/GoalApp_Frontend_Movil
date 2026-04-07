import { Text, View } from "react-native";
import { Screen } from "../../components/layout/Screen";
import { Button } from "../../components/ui/Button";
import React from "react";
import { styles } from "@/src/styles";
import { Ionicons } from '@expo/vector-icons';

import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
    return (

        <View className={styles.screenBase}>
            <SafeAreaView className="flex-1 m-3">
                <View className="flex flex-row justify-between items-center">
                    <View className="flex flex-row gap-4 m-5 items-center">
                        <Text className="text-white text-2xl font-black">Mi Perfil</Text>
                        <Ionicons name="create-outline" size={30} color="#FFFFFF" className="bg-[#0F0F13] justify-center items-center rounded-4xl p-2 border border-[#262626]" />
                    </View>
                    <Ionicons name="cog-outline" size={30} color="#FFFFFF" className="mr-3"/>
                </View>
                <View className="bg-[#161616] rounded-t-2xl items-center gap-3">
                    <Text className="text-white text-3xl font-black">Pepe Luis</Text>
                    <Text className="bg-[#2e3d06] rounded-2xl pl-2 pr-2 text-[#C8F558]">Delegado</Text>
                    <View className="bg-[#211F21] border border-[#595959]">
                        <Text className="text-[#C8F558]"> Información Personal</Text>
                        <View>
                            <Text>Email</Text>
                            <Text className="text-white">john.doe@goalapp.com</Text>
                        </View>
                    </View>
                </View>


            </SafeAreaView>
        </View >

    );
}