// Aparece tanto en Login como en Registro. 
// Para no repetir código se crea un componente propio
// Si cambias el logo, solo lo cambia aquí.

import React from 'react';
import { View, Image, Text } from 'react-native';

export function AppLogo() {
    return (
        <View className="items-center mb-6">
            <Image
                source={require('../../../../assets/images/logo.png')}
                className="w-24 h-24 rounded-2xl mb-4"
                resizeMode="contain"
            />
        </View>
    );
}