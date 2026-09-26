import { View, Text, StyleSheet, ScrollView, Modal, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect, useCallback } from 'react';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Card, StatusTag, Input, Button, Dropdown, Dialog, ErrorState, EmptyState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, radius, spacing, typography } from '@/design-system';
import { getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } from '@/api/addresses.api';
import { Address } from '@/types/backend';

export default function AddressesScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { refreshUser } = useAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null); // Null = Create, String = Update
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
    addressType: 'HOME' as 'HOME' | 'OFFICE' | 'OTHER',
    isDefault: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm Dialog state
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [addressToDeleteId, setAddressToDeleteId] = useState<string | null>(null);

  const loadAddresses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAddresses();
      if (res.success) {
        setAddresses(res.data || []);
      } else {
        setError(res.message || 'Failed to load addresses');
      }
    } catch (err) {
      console.error('Load addresses error:', err);
      setError('An error occurred while loading addresses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (form.phone.trim().length < 10) {
      newErrors.phone = 'Enter a valid 10-digit phone number';
    }
    if (!form.addressLine1.trim()) newErrors.addressLine1 = 'Address Line 1 is required';
    if (!form.city.trim()) newErrors.city = 'City is required';
    if (!form.state.trim()) newErrors.state = 'State is required';
    if (!form.country.trim()) newErrors.country = 'Country is required';
    if (!form.postalCode.trim()) {
      newErrors.postalCode = 'Postal Code is required';
    } else if (form.postalCode.trim().length < 5) {
      newErrors.postalCode = 'Enter a valid postal code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenAddForm = () => {
    setEditingAddressId(null);
    setForm({
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      landmark: '',
      city: '',
      state: '',
      country: 'India',
      postalCode: '',
      addressType: 'HOME',
      isDefault: addresses.length === 0, // Default to true if first address
    });
    setErrors({});
    setModalVisible(true);
  };

  const handleOpenEditForm = (addr: Address) => {
    setEditingAddressId(addr._id || addr.id || null);
    setForm({
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      addressLine1: addr.addressLine1 || '',
      addressLine2: addr.addressLine2 || '',
      landmark: addr.landmark || '',
      city: addr.city || '',
      state: addr.state || '',
      country: addr.country || 'India',
      postalCode: addr.postalCode || '',
      addressType: addr.addressType || 'HOME',
      isDefault: !!addr.isDefault,
    });
    setErrors({});
    setModalVisible(true);
  };

  const handleSaveAddress = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);
      let response;

      if (editingAddressId) {
        response = await updateAddress(editingAddressId, form);
      } else {
        response = await createAddress(form);
      }

      if (response.success) {
        setModalVisible(false);
        await loadAddresses();
        await refreshUser(); // Update user profile in context
        
        if (from === 'cart') {
          router.replace('/cart');
        }
      } else {
        setErrors({ form: response.message || 'Failed to save address' });
      }
    } catch (err) {
      console.error('Save address error:', err);
      setErrors({ form: 'An error occurred while saving address' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (id?: string) => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await setDefaultAddress(id);
      if (res.success) {
        await loadAddresses();
        await refreshUser();
      } else {
        Alert.alert('Error', res.message || 'Failed to set default address');
      }
    } catch (err) {
      console.error('Set default error:', err);
      Alert.alert('Error', 'An error occurred while setting default address');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteConfirm = (id?: string) => {
    if (!id) return;
    setAddressToDeleteId(id);
    setDeleteConfirmVisible(true);
  };

  const handleDeleteAddress = async () => {
    if (!addressToDeleteId) return;

    try {
      setDeleteConfirmVisible(false);
      setLoading(true);
      const res = await deleteAddress(addressToDeleteId);
      if (res.success) {
        await loadAddresses();
        await refreshUser();
      } else {
        Alert.alert('Error', res.message || 'Failed to delete address');
      }
    } catch (err) {
      console.error('Delete address error:', err);
      Alert.alert('Error', 'An error occurred while deleting address');
    } finally {
      setAddressToDeleteId(null);
      setLoading(false);
    }
  };

  const addressTypeOptions = [
    { label: 'Home', value: 'HOME' },
    { label: 'Office', value: 'OFFICE' },
    { label: 'Other', value: 'OTHER' },
  ];

  if (modalVisible) {
    return (
      <View style={styles.modalContainer}>
        <AppBar
          title={editingAddressId ? 'Edit Address' : 'Add New Address'}
          showBack
          onBack={() => setModalVisible(false)}
        />

        <ScrollView contentContainerStyle={styles.formScroll}>
          {errors.form ? <Text style={styles.globalError}>{errors.form}</Text> : null}

          <Input
            label="Receiver Full Name"
            value={form.fullName}
            onChangeText={(v) => setForm((prev) => ({ ...prev, fullName: v }))}
            placeholder="e.g. John Doe"
            required
            error={errors.fullName}
          />

          <Input
            label="Contact Phone Number"
            value={form.phone}
            onChangeText={(v) => setForm((prev) => ({ ...prev, phone: v }))}
            placeholder="10-digit mobile number"
            keyboardType="phone-pad"
            required
            error={errors.phone}
          />

          <Input
            label="Address Line 1 (Flat, House No., Building)"
            value={form.addressLine1}
            onChangeText={(v) => setForm((prev) => ({ ...prev, addressLine1: v }))}
            placeholder="House/Office details"
            required
            error={errors.addressLine1}
          />

          <Input
            label="Address Line 2 (Area, Street, Sector)"
            value={form.addressLine2}
            onChangeText={(v) => setForm((prev) => ({ ...prev, addressLine2: v }))}
            placeholder="Street or locality details"
          />

          <Input
            label="Landmark"
            value={form.landmark}
            onChangeText={(v) => setForm((prev) => ({ ...prev, landmark: v }))}
            placeholder="e.g. Near Apollo Hospital"
          />

          <View style={styles.row}>
            <View style={styles.half}>
              <Input
                label="City"
                value={form.city}
                onChangeText={(v) => setForm((prev) => ({ ...prev, city: v }))}
                placeholder="City"
                required
                error={errors.city}
              />
            </View>
            <View style={styles.half}>
              <Input
                label="State"
                value={form.state}
                onChangeText={(v) => setForm((prev) => ({ ...prev, state: v }))}
                placeholder="State"
                required
                error={errors.state}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.half}>
              <Input
                label="Postal Code"
                value={form.postalCode}
                onChangeText={(v) => setForm((prev) => ({ ...prev, postalCode: v }))}
                placeholder="Pin code"
                keyboardType="number-pad"
                required
                error={errors.postalCode}
              />
            </View>
            <View style={styles.half}>
              <Input
                label="Country"
                value={form.country}
                onChangeText={(v) => setForm((prev) => ({ ...prev, country: v }))}
                placeholder="Country"
                required
                error={errors.country}
              />
            </View>
          </View>

          <Dropdown
            label="Address Type"
            options={addressTypeOptions}
            value={form.addressType}
            onChange={(val) => setForm((prev) => ({ ...prev, addressType: val as any }))}
          />

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Set as Default Address</Text>
            <Pressable
              style={[styles.checkbox, form.isDefault && styles.checkboxChecked]}
              onPress={() => setForm((prev) => ({ ...prev, isDefault: !prev.isDefault }))}
            >
              {form.isDefault && <Ionicons name="checkmark" size={16} color={colors.surface} />}
            </Pressable>
          </View>

          <View style={styles.formActions}>
            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => setModalVisible(false)}
              style={styles.formBtn}
            />
            <Button
              title={submitting ? 'Saving...' : 'Save Address'}
              onPress={handleSaveAddress}
              loading={submitting}
              style={styles.formBtn}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppBar title="My Addresses" showBack />

      {loading && addresses.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading saved addresses...</Text>
        </View>
      ) : error ? (
        <View style={styles.contentContainer}>
          <ErrorState title="Failed to Load Addresses" message={error} onRetry={loadAddresses} />
          <View style={styles.floatingButtonContainer}>
            <Button
              title="Add New Address"
              onPress={handleOpenAddForm}
              icon="add-outline"
            />
          </View>
        </View>
      ) : addresses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            title="No Saved Addresses"
            message="Please add a shipping address to place orders."
          />
          <Button
            title="Add Shipping Address"
            onPress={handleOpenAddForm}
            style={styles.addBtn}
            icon="add-outline"
          />
        </View>
      ) : (
        <View style={styles.contentContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {addresses.map((address) => (
              <Card key={address._id || address.id} style={styles.addressCard}>
                <View style={styles.header}>
                  <View style={styles.badgeRow}>
                    <StatusTag
                      label={address.addressType || 'HOME'}
                      variant={address.addressType === 'HOME' ? 'info' : address.addressType === 'OFFICE' ? 'success' : 'warning'}
                    />
                    {address.isDefault && <StatusTag label="Default" variant="success" />}
                  </View>

                  <View style={styles.actionButtons}>
                    <Pressable
                      style={styles.iconAction}
                      onPress={() => handleOpenEditForm(address)}
                      hitSlop={8}
                    >
                      <Ionicons name="create-outline" size={20} color={colors.primary} />
                    </Pressable>
                    <Pressable
                      style={styles.iconAction}
                      onPress={() => handleOpenDeleteConfirm(address._id || address.id)}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </Pressable>
                  </View>
                </View>

                <Text style={styles.fullName}>{address.fullName}</Text>
                <Text style={styles.phoneText}>
                  <Ionicons name="call-outline" size={14} color={colors.textSecondary} /> {address.phone}
                </Text>

                <View style={styles.addressTextContainer}>
                  <Text style={styles.line}>{address.addressLine1}</Text>
                  {address.addressLine2 ? <Text style={styles.line}>{address.addressLine2}</Text> : null}
                  {address.landmark ? <Text style={styles.landmarkText}>Landmark: {address.landmark}</Text> : null}
                  <Text style={styles.line}>
                    {address.city}, {address.state} - {address.postalCode}
                  </Text>
                  <Text style={styles.country}>{address.country}</Text>
                </View>

                {!address.isDefault && (
                  <Button
                    title="Set as Default Address"
                    variant="outline"
                    size="sm"
                    onPress={() => handleSetDefault(address._id || address.id)}
                    style={styles.defaultBtn}
                  />
                )}
              </Card>
            ))}
          </ScrollView>

          <View style={styles.floatingButtonContainer}>
            <Button
              title="Add New Address"
              onPress={handleOpenAddForm}
              icon="add-outline"
            />
          </View>
        </View>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        visible={deleteConfirmVisible}
        title="Delete Address"
        message="Are you sure you want to remove this shipping address permanently?"
        confirmLabel="Delete"
        cancelLabel="Keep"
        onConfirm={handleDeleteAddress}
        onCancel={() => setDeleteConfirmVisible(false)}
        destructive
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  loadingText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  addBtn: { marginTop: spacing.lg, minWidth: 200 },
  contentContainer: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: 100 },
  addressCard: { marginBottom: spacing.md, padding: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  badgeRow: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
  actionButtons: { flexDirection: 'row', gap: spacing.sm },
  iconAction: { padding: spacing.xs },
  fullName: { ...typography.heading3, color: colors.textPrimary, marginTop: spacing.xs },
  phoneText: { ...typography.body, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.sm },
  addressTextContainer: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  line: { ...typography.body, color: colors.textPrimary, marginBottom: 2 },
  landmarkText: { ...typography.body, color: colors.textSecondary, fontStyle: 'italic', marginBottom: 2 },
  country: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  defaultBtn: { marginTop: spacing.md, alignSelf: 'flex-start' },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  formScroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  switchLabel: { ...typography.body, color: colors.textPrimary },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  formActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  formBtn: { flex: 1 },
  globalError: { ...typography.body, color: colors.error, textAlign: 'center', marginBottom: spacing.md },
});
