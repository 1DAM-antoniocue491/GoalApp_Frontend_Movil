import React, { memo } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';

interface SearchInputProps {
  value: string;
  placeholder?: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
}

function SearchInputComponent({
  value,
  placeholder = 'Buscar...',
  onChangeText,
  onClear,
}: SearchInputProps) {
  return (
    <View
      className="flex-row items-center h-14 px-4 rounded-[18px] border"
      style={{
        backgroundColor: Colors.bg.surface1,
        borderColor: Colors.bg.surface2,
      }}
    >
      <Ionicons name="search" size={20} color={Colors.text.disabled} />

      <TextInput
        className="flex-1 ml-3 text-white"
        style={{
          fontSize: theme.fontSize.md,
          lineHeight: 20,
          color: Colors.text.primary,
        }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.text.disabled}
      />

      {!!value && (
        <TouchableOpacity activeOpacity={0.85} onPress={onClear}>
          <Ionicons
            name="close-circle"
            size={20}
            color={Colors.text.disabled}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

export const SearchInput = memo(SearchInputComponent);