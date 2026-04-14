import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FormField } from './FormField';

interface PasswordFieldProps {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    placeholder?: string;
}

export function PasswordField({ label, value, onChangeText, placeholder }: PasswordFieldProps) {
    const [isVisible, setIsVisible] = useState(false);

    const toggleVisibility = () => setIsVisible(!isVisible);

    return (
        <FormField
            label={label}
            icon={<Ionicons name="lock-closed-outline" size={18} color="#8A9AA4" />}
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={!isVisible}
            rightElement={
                <TouchableOpacity
                    onPress={toggleVisibility}
                    accessibilityRole="button"
                    accessibilityLabel={isVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons
                        name={isVisible ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#8A9AA4"
                    />
                </TouchableOpacity>
            }
        />
    );
}
