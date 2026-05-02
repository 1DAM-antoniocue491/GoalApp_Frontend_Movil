/**
 * NotificationsScreen
 *
 * Centro de notificaciones del usuario dentro de la liga.
 *
 * Header: mismo patrón visual que UsersRolesScreen:
 *   - SafeAreaView con bg.base
 *   - Botón volver (arrow-back)
 *   - Título "Notificaciones" + subtítulo de no leídas
 *   - Botón ⋮ arriba derecha (marcar todas como leídas)
 *
 * Contenido:
 *   - SearchInput reutilizable
 *   - NotificationFilterTabs (horizontal, restringido por rol)
 *   - Lista de NotificationCard o empty state
 *   - ScrollEdgeButton para navegación rápida
 *
 * Action sheet: Modal propio que se abre desde el ⋮ de la tarjeta
 * o desde onLongPress — patrón mobile-first en lugar de hover.
 */

import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Modal,
    Alert,
    ActivityIndicator,
    RefreshControl,
    StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SearchInput } from '@/src/shared/components/ui/SearchInput';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { ScrollEdgeButton } from '@/src/shared/components/navigation/ScrollEdgeButton';
import { NotificationFilterTabs } from '@/src/features/notifications/components/NotificationFilterTabs';
import { NotificationCard } from '@/src/features/notifications/components/NotificationCard';
import { useNotifications } from '@/src/features/notifications/hooks/useNotifications';
import type { AppNotification } from '@/src/features/notifications/types/notifications.types';

// ─── Componente ──────────────────────────────────────────────────────────────

export function NotificationsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // TODO: obtener el rol del estado global de sesión
    const {
        notifications,
        unreadCount,
        isLoading,
        isRefreshing,
        error,
        refresh,
        activeFilter,
        setActiveFilter,
        search,
        setSearch,
        availableCategories,
        markAsRead,
        markAllAsRead,
        deleteNotification,
    } = useNotifications('admin');

    // Notificación objetivo del action sheet (⋮ o long press)
    const [actionTarget, setActionTarget] = useState<AppNotification | null>(null);

    // Refs para ScrollEdgeButton
    const scrollRef = useRef<ScrollView>(null);
    const [scrollY, setScrollY] = useState(0);
    const [contentHeight, setContentHeight] = useState(0);
    const [viewportHeight, setViewportHeight] = useState(0);

    // ── Pulsar tarjeta: marca como leída + navega ───────────────────────────

    function handleCardPress(notification: AppNotification) {
        // Marcar como leída antes de salir de la pantalla
        markAsRead(notification.id);

        if (!notification.targetRoute) return;

        // router.push acepta string directamente; los params van como query string
        // o como segundo argumento según la versión de expo-router
        if (notification.targetParams) {
            router.push({
                pathname: notification.targetRoute as never,
                params: notification.targetParams,
            });
        } else {
            router.push(notification.targetRoute as never);
        }
    }

    // ── Acciones del header ──────────────────────────────────────────────────

    function handleHeaderMenu() {
        // Opciones del ⋮ del header: solo "marcar todas como leídas"
        Alert.alert(
            'Notificaciones',
            undefined,
            [
                {
                    text: 'Marcar todas como leídas',
                    onPress: markAllAsRead,
                },
                { text: 'Cancelar', style: 'cancel' },
            ],
            { cancelable: true }
        );
    }

    // ── Acciones del action sheet de tarjeta ────────────────────────────────

    function handleMarkRead() {
        if (!actionTarget) return;
        markAsRead(actionTarget.id);
        setActionTarget(null);
    }

    function handleDelete() {
        if (!actionTarget) return;
        deleteNotification(actionTarget.id);
        setActionTarget(null);
    }

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.base }}>

            {/* ── Header — mismo patrón que UsersRolesScreen ── */}
            <View
                className="flex-row items-center justify-between px-6 py-4"
                style={{ borderBottomWidth: 1, borderBottomColor: Colors.bg.surface2 }}
            >
                {/* Izquierda: botón volver + título + subtítulo */}
                <View className="flex-row items-center gap-3" style={{ flex: 1 }}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
                    </TouchableOpacity>

                    {/* Título y subtítulo apilados */}
                    <View>
                        <Text
                            style={{
                                color: Colors.text.primary,
                                fontSize: theme.fontSize.xl,
                                fontWeight: '700',
                                lineHeight: 24,
                            }}
                        >
                            Notificaciones
                        </Text>
                        {/* Subtítulo con conteo de no leídas */}
                        <Text
                            style={{
                                color: unreadCount > 0 ? Colors.brand.primary : Colors.text.disabled,
                                fontSize: theme.fontSize.xs,
                                fontWeight: unreadCount > 0 ? '600' : '400',
                            }}
                        >
                            {unreadCount > 0
                                ? `${unreadCount} nueva${unreadCount !== 1 ? 's' : ''}`
                                : 'Todo al día'}
                        </Text>
                    </View>
                </View>

                {/* Derecha: botón 3 puntos */}
                <TouchableOpacity
                    onPress={handleHeaderMenu}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                    style={{
                        // style: padding exacto y alineación — no representable con className solo
                        width: 36,
                        height: 36,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: Colors.bg.surface1,
                        borderRadius: theme.borderRadius.lg,
                        borderWidth: 1,
                        borderColor: Colors.bg.surface2,
                    }}
                >
                    <Ionicons name="ellipsis-vertical" size={18} color={Colors.text.secondary} />
                </TouchableOpacity>
            </View>

            {/* ── Estado de carga inicial ── */}
            {isLoading && (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={Colors.brand.primary} />
                </View>
            )}

            {/* ── Estado de error ── */}
            {!isLoading && error && (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                    <Ionicons name="alert-circle-outline" size={48} color={Colors.semantic.error} />
                    <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm, marginTop: 12, textAlign: 'center' }}>
                        {error}
                    </Text>
                    <TouchableOpacity
                        onPress={refresh}
                        activeOpacity={0.8}
                        style={{
                            marginTop: 16,
                            paddingHorizontal: 20,
                            paddingVertical: 10,
                            backgroundColor: Colors.bg.surface1,
                            borderRadius: theme.borderRadius.lg,
                            borderWidth: 1,
                            borderColor: Colors.bg.surface2,
                        }}
                    >
                        <Text style={{ color: Colors.text.primary, fontSize: theme.fontSize.sm }}>
                            Reintentar
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* ── Contenido scrollable ── */}
            {!isLoading && !error && (
            <ScrollView
                ref={scrollRef}
                className="flex-1"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                scrollEventThrottle={16}
                onScroll={e => setScrollY(e.nativeEvent.contentOffset.y)}
                onContentSizeChange={(_, h) => setContentHeight(h)}
                onLayout={e => setViewportHeight(e.nativeEvent.layout.height)}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={refresh}
                        tintColor={Colors.brand.primary}
                        colors={[Colors.brand.primary]}
                    />
                }
            >
                {/* Buscador */}
                <View
                    style={{
                        paddingHorizontal: theme.spacing.xl,
                        paddingTop: theme.spacing.xl,
                        paddingBottom: theme.spacing.md,
                    }}
                >
                    <SearchInput
                        value={search}
                        placeholder="Buscar notificaciones..."
                        onChangeText={setSearch}
                        onClear={() => setSearch('')}
                    />
                </View>

                {/* Filtros por categoría */}
                <NotificationFilterTabs
                    available={availableCategories}
                    active={activeFilter}
                    onChange={setActiveFilter}
                />

                {/* Separador y conteo de resultados */}
                <View
                    style={{
                        paddingHorizontal: theme.spacing.xl,
                        paddingTop: theme.spacing.lg,
                        paddingBottom: theme.spacing.sm,
                    }}
                >
                    <Text style={{ color: Colors.text.disabled, fontSize: theme.fontSize.xs }}>
                        {notifications.length} notificación{notifications.length !== 1 ? 'es' : ''}
                    </Text>
                </View>

                {/* Lista de tarjetas o empty state */}
                <View style={{ paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing.xxl }}>
                    {notifications.length > 0 ? (
                        notifications.map((notification, index) => (
                            <NotificationCard
                                key={notification.id || `notification-${index}`}
                                notification={notification}
                                onPress={handleCardPress}
                                onDelete={deleteNotification}
                                onOpenMenu={setActionTarget}
                            />
                        ))
                    ) : (
                        // Empty state
                        <View className="items-center py-16">
                            <Ionicons name="notifications-off-outline" size={48} color={Colors.text.disabled} />
                            <Text
                                style={{
                                    color: Colors.text.disabled,
                                    fontSize: theme.fontSize.sm,
                                    marginTop: theme.spacing.md,
                                    textAlign: 'center',
                                }}
                            >
                                {search
                                    ? 'No hay resultados para tu búsqueda'
                                    : 'No tienes notificaciones en esta categoría'}
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
            )}

            {/* Botón flotante de scroll — fuera del ScrollView para posicionamiento correcto */}
            <ScrollEdgeButton
                scrollRef={scrollRef}
                scrollY={scrollY}
                contentHeight={contentHeight}
                viewportHeight={viewportHeight}
            />

            {/* ── Action Sheet de tarjeta ── */}
            <Modal
                visible={!!actionTarget}
                transparent
                animationType="slide"
                onRequestClose={() => setActionTarget(null)}
            >
                <View style={styles.sheetOverlay}>
                    {/* Backdrop — toca para cerrar */}
                    <TouchableOpacity
                        style={StyleSheet.absoluteFillObject}
                        activeOpacity={1}
                        onPress={() => setActionTarget(null)}
                    />

                    {/* Panel inferior */}
                    <View
                        style={[
                            styles.sheetPanel,
                            { paddingBottom: Math.max(insets.bottom, theme.spacing.xl) },
                        ]}
                    >
                        {/* Indicador visual de arrastre */}
                        <View style={styles.sheetHandle} />

                        {/* Título de la acción */}
                        {actionTarget && (
                            <Text
                                style={{
                                    color: Colors.text.secondary,
                                    fontSize: theme.fontSize.xs,
                                    paddingHorizontal: theme.spacing.xl,
                                    paddingBottom: theme.spacing.md,
                                }}
                                numberOfLines={1}
                            >
                                {actionTarget.title}
                            </Text>
                        )}

                        {/* Opción: Marcar como leída — solo si no está leída */}
                        {actionTarget && !actionTarget.isRead && (
                            <TouchableOpacity
                                onPress={handleMarkRead}
                                activeOpacity={0.8}
                                style={styles.sheetOption}
                            >
                                <Ionicons
                                    name="checkmark-circle-outline"
                                    size={22}
                                    color={Colors.brand.primary}
                                />
                                <Text style={[styles.sheetOptionText, { color: Colors.brand.primary }]}>
                                    Marcar como leída
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* Opción: Eliminar */}
                        <TouchableOpacity
                            onPress={handleDelete}
                            activeOpacity={0.8}
                            style={styles.sheetOption}
                        >
                            <Ionicons name="trash-outline" size={22} color={Colors.semantic.error} />
                            <Text style={[styles.sheetOptionText, { color: Colors.semantic.error }]}>
                                Eliminar notificación
                            </Text>
                        </TouchableOpacity>

                        {/* Separador */}
                        <View
                            style={{
                                height: 1,
                                backgroundColor: Colors.bg.surface2,
                                marginHorizontal: theme.spacing.xl,
                                marginVertical: theme.spacing.sm,
                            }}
                        />

                        {/* Cancelar */}
                        <TouchableOpacity
                            onPress={() => setActionTarget(null)}
                            activeOpacity={0.8}
                            style={styles.sheetOption}
                        >
                            <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.md }}>
                                Cancelar
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// ─── Estilos del action sheet ─────────────────────────────────────────────

const styles = StyleSheet.create({
    sheetOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        // El backdrop se pone como absoluteFill sobre este View
        backgroundColor: '#0000008c',
    },
    sheetPanel: {
        backgroundColor: Colors.bg.surface1,
        borderTopLeftRadius: theme.borderRadius.xl,
        borderTopRightRadius: theme.borderRadius.xl,
        paddingTop: theme.spacing.md,
        // Evita que el backdrop cubra el panel
        zIndex: 1,
    },
    sheetHandle: {
        width: 36,
        height: 4,
        borderRadius: theme.borderRadius.full,
        backgroundColor: Colors.bg.surface2,
        alignSelf: 'center',
        marginBottom: theme.spacing.lg,
    },
    sheetOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.lg,
    },
    sheetOptionText: {
        fontSize: theme.fontSize.md,
        fontWeight: '500',
    },
});
