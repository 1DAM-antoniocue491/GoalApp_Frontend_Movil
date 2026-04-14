// Recibe todas las props de TextInput para ser flexible (secureTextEntry, etc.)

// Cada campo del formulario tiene: ícono izquierdo + label + TextInput + elemento derecho opcional.
// En vez de repetir esa estructura 4 veces, la encapsulamos.

import React from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import { styles } from '../../styles';

interface FormFieldProps extends TextInputProps {
    label: string;
    icon: React.ReactNode; // acepta cualquier ícono (Ionicons, SVG, etc.)
    rightElement?: React.ReactNode; // elemento opcional a la derecha (ej: icono de ojo)
}

export function FormField({ label, icon, rightElement, ...inputProps }: FormFieldProps) {
    return (
        // ¿Por qué gap-1 en el wrapper? Espaciado consistente entre label e input
        // sin necesidad de marginBottom en cada elemento hijo.
        <View className={styles.fieldWrapper}>
            <Text className={styles.label}>{label}</Text>

            <View className={styles.inputRow}>
                {/* El ícono va fuera del TextInput pero dentro del row visual */}
                <View className={styles.inputIcon}>{icon}</View>

                <TextInput
                    className={styles.input}
                    placeholderTextColor={styles.inputPlaceholder}
                    // Spread de todas las props extra: secureTextEntry, keyboardType, etc.
                    {...inputProps}
                />

                {/* Elemento derecho opcional (ej: icono de ojo para mostrar contraseña) */}
                {rightElement && (
                    <View className="pr-3 justify-center">
                        {rightElement}
                    </View>
                )}
            </View>
        </View>
    );
}