/**
 * EditProfileScreen
 *
 * Pantalla de edición de perfil del usuario autenticado.
 * TODO: conectar campos a estado real y servicio de actualización cuando la API esté disponible.
 */

import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, RelativePathString, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '@/src/shared/styles';

import { useAuth } from '@/src/app/auth/hooks/useAuth';
import { routes } from '@/src/shared/config/routes';

export function EditProfileScreen() {

    const router = useRouter();
    const { logout, user } = useAuth();
    const [nombre, setNombre] = useState(user?.nombre || 'Pepe Luis');
    const [email, setEmail] = useState(user?.email || 'Pepe Luis');
    const [telefono, setTelefono] = useState(user?.telefono || 'Pepe Luis');
    const [fechaNacimiento, setFechaNacimiento] = useState(user?.fecha_nacimiento || 'Pepe Luis');
    const [genero, setGenero] = useState(user?.genero || 'Pepe Luis');

    return (
        <View className={styles.screenBase}>
            <SafeAreaView className="flex-1">
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}>
                    <View className="flex-row justify-between items-center px-5 mt-2 mb-3">
                        <Text className="text-white text-2xl font-extrabold">
                            Mi Perfil
                        </Text>
                        <View className=" bg-[#1A1A1D] rounded-2xl p-4 border border-[#2A2A2A] items-center">
                            <Link href={'../(tabs)/profile'}>
                                <Ionicons name="close-outline" size={20} color="#8A9AA4" />
                            </Link>

                        </View>

                    </View>

                    {/* PERFIL */}
                    <View className="items-center px-5 mb-6">
                        <View className="bg-[#1A1A1D] p-5 rounded-full border border-[#2A2A2A] mb-3">
                            <Ionicons name="person" size={50} color="#C8F558" />
                        </View>

                        <Text className="text-white text-2xl font-bold">
                            {user?.nombre || 'Pepe Luis'}
                        </Text>

                        <Text className="mt-2 text-[#C8F558] bg-[#2e3d06] px-3 py-1 rounded-full text-sm">
                            Administrador
                        </Text>
                    </View>

                    {/* CARD INFO */}
                    <View className="mx-5 bg-[#1A1A1D] rounded-3xl p-5 border border-[#2A2A2A] mb-6">
                        <Text className="text-[#C8F558] text- mb-4 font-semibold">
                            Información Personal
                        </Text>
                        {[
                            { icon: "create-outline", label: "Nombre", value: nombre, setter: setNombre },
                            { icon: "mail-outline", label: "Email", value: email, setter: setEmail },
                            { icon: "call-outline", label: "Teléfono", value: telefono, setter: setTelefono },
                            { icon: "calendar-clear-outline", label: "Fecha de Nacimiento", value: fechaNacimiento, setter: setFechaNacimiento },
                            { icon: "transgender-outline", label: "Género", value: genero, setter: setGenero },
                        ].map((item, index) => (
                            <View key={index} className="flex-row items-center mb-4">
                                <View className="bg-[#0F0F13] p-3 rounded-xl mr-3">
                                    <Ionicons name={item.icon as any} size={18} color="#8A9AA4" />
                                </View>

                                <View className="flex-1">
                                    <Text className="text-gray-400 text-sm">
                                        {item.label}
                                    </Text>
                                    <TextInput
                                        value={item.value}
                                        onChangeText={item.setter}
                                        className="text-white pl-4 bg-[#0F0F13] border border-[#262626] rounded-xl px-4 py-3"
                                    />
                                </View>
                            </View>
                        ))}
                    </View>


                    <View className="flex-row w-full px-5 gap-3 mb-6">

                        {/* CANCELAR */}
                        <View className="flex-1 bg-[#1A1A1D] rounded-3xl p-4 border border-[#2A2A2A] items-center">
                            <Link href={'../(tabs)/profile'}>
                                <View className="items-center justify-center">
                                    <Text className="text-white font-black">
                                        Cancelar
                                    </Text>
                                </View>
                            </Link>
                        </View>

                        {/* GUARDAR */}
                        <View className="flex-1 bg-[#C8F558] rounded-3xl p-4 border border-[#C8F558] items-center">
                            <Link href={'../(tabs)/profile'}>
                                <View className="flex-row items-center justify-center gap-2">
                                    <Ionicons name="save-outline" size={20} color="#000" />
                                    <Text className="text-black font-black">
                                        Guardar
                                    </Text>
                                </View>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
