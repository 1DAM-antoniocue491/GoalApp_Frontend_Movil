import { Text, View } from "react-native";
import React from "react";
import { styles } from "@/src/shared/styles";
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
                    <Ionicons name="settings-outline" size={30} color="#FFFFFF" className="mr-3" />
                </View>
                <View className="bg-[#161616] rounded-t-3xl items-center gap-3 h-full">
                    <Text className="text-white text-3xl font-black">Pepe Luis</Text>
                    <Text className="bg-[#2e3d06] rounded-2xl pl-2 pr-2 text-[#C8F558]">Administrador</Text>
                    <View className="bg-[#211F21] border border-[#595959] p-10 rounded-2xl">
                        <Text className="text-[#C8F558]"> Información Personal</Text>
                        <View className="flex-row gap-4 items-start">
                            <View className="bg-[#0F0F13] rounded-2xl p-3 border border-[#262626]">
                                <Ionicons name="mail-outline" size={18} color="#8A9AA4" />
                            </View>

                            <View className="flex flex-col">
                                <Text className="text-gray-400">Email</Text>
                                <Text className="w-full text-white bg-[#0F0F13] rounded-2xl p-2 border border-[#262626]">john.doe@goalapp.com</Text>
                            </View>
                        </View>
                        

                        <View className="flex flex-row gap-4 items-start">
                            <View className="bg-[#0F0F13] rounded-2xl p-3 border border-[#262626]">
                                <Ionicons name="call-outline" size={18} color="#8A9AA4" />
                            </View>

                            <View className="flex flex-col">
                                <Text className="text-gray-400">Teléfono</Text>
                                <Text className="w-full text-white bg-[#0F0F13] rounded-2xl p-2 border border-[#262626]">+34 790 67 84 35</Text>
                            </View>
                        </View>

                        <View className=" flex flex-row gap-4 items-start">
                            <View className="bg-[#0F0F13] rounded-2xl p-3 border border-[#262626]">
                                <Ionicons name="calendar-clear-outline" size={18} color="#8A9AA4" />
                            </View>

                            <View className="flex flex-col">
                                <Text className="text-gray-400">Fecha de nacimiento</Text>
                                <Text className="text-white bg-[#0F0F13] rounded-2xl p-2 border border-[#262626]">15 de junio, 2025</Text>
                            </View>
                        </View>

                        <View className="flex flex-row gap-4 items-start">
                            <View className="bg-[#0F0F13] rounded-2xl p-3 border border-[#262626]">
                                <Ionicons name="transgender-outline" size={18} color="#8A9AA4" />
                            </View>

                            <View className="flex flex-col">
                                <Text className="text-gray-400">Género</Text>
                                <Text className="text-white bg-[#0F0F13] rounded-2xl p-2 border border-[#262626]">Masculino</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </View >
    );
}