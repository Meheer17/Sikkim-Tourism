import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLanguageTranslations } from '@/constants/translations';

export interface BookingModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (bookingData: BookingData) => Promise<void>;
    serviceId: string;
    serviceName: string;
    servicePrice: number;
    businessId: string;
}

export interface BookingData {
    service_id: string;
    business_id: string;
    amount: number;
    metadata: {
        from_time?: string;
        to_time?: string;
        quantity: number;
        notes?: string;
    };
}

export default function BookingModal({
    visible,
    onClose,
    onConfirm,
    serviceId,
    serviceName,
    servicePrice,
    businessId,
}: BookingModalProps) {
    const { language } = useLanguage();
    const t = getLanguageTranslations(language);

    const screenBg = useThemeColor('background');
    const cardBg = useThemeColor('card');
    const text = useThemeColor('text');
    const mutedText = useThemeColor('mutedText');
    const tint = useThemeColor('tint');
    const border = useThemeColor('border');

    const [quantity, setQuantity] = useState('1');
    const [notes, setNotes] = useState('');
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date(Date.now() + 3600000)); // +1 hour
    const [loading, setLoading] = useState(false);
    const [searchId, setSearchId] = useState('');
    const [searchNotes, setSearchNotes] = useState('');

    const handleFromDateChange = () => {
        // For now, set to tomorrow same time
        const tomorrow = new Date(fromDate);
        tomorrow.setDate(tomorrow.getDate() + 1);
        setFromDate(tomorrow);
        const newToDate = new Date(tomorrow.getTime() + 3600000);
        setToDate(newToDate);
    };

    const handleToDateChange = () => {
        // Add 1 hour to current end time
        const newToDate = new Date(toDate.getTime() + 3600000);
        setToDate(newToDate);
    };

    const calculateTotal = () => {
        return (servicePrice * parseInt(quantity || '1')).toFixed(2);
    };

    const handleBooking = async () => {
        try {
            // Validate quantity
            if (!quantity || parseInt(quantity) < 1) {
                Alert.alert(t.invalid_quantity || 'Invalid Quantity', t.quantity_positive || 'Quantity must be at least 1');
                return;
            }

            // Validate dates are set
            if (!fromDate) {
                Alert.alert(t.error || 'Error', t.startTimeRequired || 'Start time is required');
                return;
            }

            if (!toDate) {
                Alert.alert(t.error || 'Error', t.endTimeRequired || 'End time is required');
                return;
            }

            // Validate that to date is after from date
            if (toDate <= fromDate) {
                Alert.alert(t.error || 'Error', t.endTimeAfterStart || 'End time must be after start time');
                return;
            }

            setLoading(true);

            const bookingData: BookingData = {
                service_id: serviceId,
                business_id: businessId,
                amount: parseFloat(calculateTotal()),
                metadata: {
                    from_time: fromDate.toISOString(),
                    to_time: toDate.toISOString(),
                    quantity: parseInt(quantity),
                    notes: notes.trim() || undefined,
                },
            };

            await onConfirm(bookingData);

            // Reset form on success
            setQuantity('1');
            setNotes('');
            setSearchId('');
            setSearchNotes('');
            setFromDate(new Date());
            setToDate(new Date(Date.now() + 3600000));
            onClose();
        } catch (error: any) {
            console.error('Booking error:', error);
            Alert.alert(t.booking_failed || 'Booking Failed', error?.message || t.try_again || 'Please try again');
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (date: Date) => {
        return date.toLocaleString(language === 'hi' ? 'hi-IN' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                <View style={[styles.content, { backgroundColor: cardBg }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: text }]}>{t.book_service || 'Book Service'}</Text>
                        <TouchableOpacity onPress={onClose} disabled={loading}>
                            <IconSymbol name="xmark.circle.fill" size={28} color={mutedText as string} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                        {/* Service Info */}
                        <View style={styles.section}>
                            <Text style={[styles.label, { color: text }]}>{t.service || 'Service'}</Text>
                            <View style={[styles.infoBox, { backgroundColor: 'rgba(0,0,0,0.02)', borderColor: border }]}>
                                <Text style={[styles.serviceName, { color: text }]}>{serviceName}</Text>
                                <Text style={[styles.servicePrice, { color: tint }]}>
                                    ₹{servicePrice.toFixed(2)} {t.per_unit || 'per unit'}
                                </Text>
                            </View>
                        </View>

                        {/* Search Bars */}
                        <View style={styles.searchSection}>
                            <Text style={[styles.label, { color: text }]}>{t.search || 'Search'}</Text>
                            <TextInput
                                style={[styles.searchInput, { color: text, borderColor: border }]}
                                placeholder={t.search_by_id || 'Search by ID...'}
                                placeholderTextColor={mutedText as string}
                                value={searchId}
                                onChangeText={setSearchId}
                                editable={!loading}
                            />
                            <TextInput
                                style={[styles.searchInput, { color: text, borderColor: border }]}
                                placeholder={t.search_by_details || 'Search by details...'}
                                placeholderTextColor={mutedText as string}
                                value={searchNotes}
                                onChangeText={setSearchNotes}
                                editable={!loading}
                            />
                        </View>

                        {/* Quantity */}
                        <View style={styles.section}>
                            <Text style={[styles.label, { color: text }]}>{t.quantity || 'Quantity'}</Text>
                            <View style={styles.quantityContainer}>
                                <TouchableOpacity
                                    style={[styles.quantityBtn, { backgroundColor: tint }]}
                                    onPress={() => setQuantity(Math.max(1, parseInt(quantity || '1') - 1).toString())}
                                    disabled={loading}
                                >
                                    <IconSymbol name="minus" size={20} color="#fff" />
                                </TouchableOpacity>
                                <TextInput
                                    style={[styles.quantityInput, { color: text, borderColor: border }]}
                                    value={quantity}
                                    onChangeText={setQuantity}
                                    keyboardType="number-pad"
                                    editable={!loading}
                                    maxLength={3}
                                />
                                <TouchableOpacity
                                    style={[styles.quantityBtn, { backgroundColor: tint }]}
                                    onPress={() => setQuantity((parseInt(quantity || '1') + 1).toString())}
                                    disabled={loading}
                                >
                                    <IconSymbol name="plus" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* From Date/Time */}
                        <View style={styles.section}>
                            <Text style={[styles.label, { color: text }]}>{t.start_time || 'Start Time'}</Text>
                            <TouchableOpacity
                                style={[styles.dateButton, { borderColor: border, backgroundColor: 'rgba(0,0,0,0.02)' }]}
                                onPress={handleFromDateChange}
                                disabled={loading}
                            >
                                <IconSymbol name="calendar" size={20} color={tint as string} />
                                <Text style={[styles.dateButtonText, { color: text }]}>
                                    {formatDateTime(fromDate)}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* To Date/Time */}
                        <View style={styles.section}>
                            <Text style={[styles.label, { color: text }]}>{t.end_time || 'End Time'}</Text>
                            <TouchableOpacity
                                style={[styles.dateButton, { borderColor: border, backgroundColor: 'rgba(0,0,0,0.02)' }]}
                                onPress={handleToDateChange}
                                disabled={loading}
                            >
                                <IconSymbol name="calendar" size={20} color={tint as string} />
                                <Text style={[styles.dateButtonText, { color: text }]}>
                                    {formatDateTime(toDate)}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Notes */}
                        <View style={styles.section}>
                            <Text style={[styles.label, { color: text }]}>{t.notes || 'Notes'} ({t.optional || 'Optional'})</Text>
                            <TextInput
                                style={[styles.notesInput, { color: text, borderColor: border }]}
                                placeholder={t.add_special_requests || 'Add any special requests...'}
                                placeholderTextColor={mutedText as string}
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                editable={!loading}
                                maxLength={500}
                            />
                        </View>

                        {/* Total */}
                        <View style={[styles.totalSection, { backgroundColor: 'rgba(0,0,0,0.02)', borderColor: border }]}>
                            <View style={styles.totalRow}>
                                <Text style={[styles.totalLabel, { color: mutedText }]}>
                                    {t.unit_price || 'Unit Price'}
                                </Text>
                                <Text style={[styles.totalValue, { color: text }]}>
                                    ₹{servicePrice.toFixed(2)}
                                </Text>
                            </View>
                            <View style={styles.totalRow}>
                                <Text style={[styles.totalLabel, { color: mutedText }]}>
                                    {t.quantity || 'Quantity'}
                                </Text>
                                <Text style={[styles.totalValue, { color: text }]}>
                                    {quantity}
                                </Text>
                            </View>
                            <View style={[styles.divider, { backgroundColor: border }]} />
                            <View style={styles.totalRow}>
                                <Text style={[styles.grandTotal, { color: text }]}>
                                    {t.total || 'Total'}
                                </Text>
                                <Text style={[styles.grandTotalAmount, { color: tint }]}>
                                    ₹{calculateTotal()}
                                </Text>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.cancelBtn, { backgroundColor: border }]}
                            onPress={onClose}
                            disabled={loading}
                        >
                            <Text style={[styles.btnText, { color: text }]}>{t.cancel || 'Cancel'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.confirmBtn, { backgroundColor: tint }]}
                            onPress={handleBooking}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.confirmBtnText}>
                                    {t.confirm_booking || 'Confirm Booking'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    content: {
        minHeight: '95%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    infoBox: {
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    servicePrice: {
        fontSize: 14,
        fontWeight: '600',
    },
    searchSection: {
        marginBottom: 24,
        gap: 10,
    },
    searchInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        height: 44,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    quantityBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityInput: {
        flex: 1,
        height: 44,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },
    dateButtonText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    notesInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    totalSection: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 20,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    totalLabel: {
        fontSize: 14,
    },
    totalValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        marginVertical: 8,
    },
    grandTotal: {
        fontSize: 16,
        fontWeight: '700',
    },
    grandTotalAmount: {
        fontSize: 18,
        fontWeight: '700',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    cancelBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnText: {
        fontSize: 16,
        fontWeight: '600',
    },
    confirmBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
