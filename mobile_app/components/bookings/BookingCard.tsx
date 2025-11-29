import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

export interface Booking {
    id: string;
    serviceName: string;
    bookingDate: string;
    status: 'active' | 'upcoming' | 'completed' | 'cancelled';
    serviceType: string;
    price: number;
    bookingCode?: string;
}

interface BookingCardProps {
    booking: Booking;
    onPress?: (booking: Booking) => void;
}

const statusConfig = {
    active: { color: '#10b981', icon: 'checkmark.circle.fill', label: 'Active' },
    upcoming: { color: '#3b82f6', icon: 'clock.fill', label: 'Upcoming' },
    completed: { color: '#687076', icon: 'checkmark.circle', label: 'Completed' },
    cancelled: { color: '#ef4444', icon: 'xmark.circle.fill', label: 'Cancelled' },
};

export default function BookingCard({ booking, onPress }: BookingCardProps) {
    const status = statusConfig[booking.status];
    const card = useThemeColor('card');
    const text = useThemeColor('text');
    const muted = useThemeColor('mutedText');
    const border = useThemeColor('border');

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: card }]}
            onPress={() => onPress?.(booking)}
            activeOpacity={0.7}
        >
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={[styles.serviceName, { color: text }]}>{booking.serviceName}</Text>
                    <Text style={[styles.serviceType, { color: muted }]}>{booking.serviceType}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${status.color}15` }]}>
                    {/* <IconSymbol name={status.icon} size={14} color={status.color} /> */}
                    <Text style={[styles.statusText, { color: status.color }]}>
                        {status.label}
                    </Text>
                </View>
            </View>

            <View style={[styles.divider, { backgroundColor: border }]} />

            <View style={styles.details}>
                <View style={styles.detailRow}>
                    <IconSymbol name="calendar" size={16} color={muted} />
                    <Text style={[styles.detailText, { color: muted }]}>{booking.bookingDate}</Text>
                </View>
                {booking.bookingCode && (
                    <View style={styles.detailRow}>
                        <IconSymbol name="number" size={16} color={muted} />
                        <Text style={[styles.detailText, { color: muted }]}>{booking.bookingCode}</Text>
                    </View>
                )}
                <View style={styles.detailRow}>
                    <IconSymbol name="indianrupeesign" size={16} color={muted} />
                    <Text style={[styles.detailText, { color: muted }]}>₹{booking.price}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    headerLeft: {
        flex: 1,
        marginRight: 12,
    },
    serviceName: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    serviceType: {
        fontSize: 13,
        textTransform: 'capitalize',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        marginBottom: 12,
    },
    details: {
        gap: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailText: {
        fontSize: 14,
    },
});
