import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Input, Button, Dropdown } from '@/components/ui';
import { colors, layout, spacing, typography } from '@/design-system';
import { UserType } from '@/types';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    userType: '' as UserType | '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    industryType: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.companyName) newErrors.companyName = 'Required';
    if (!form.firstName) newErrors.firstName = 'Required';
    if (!form.lastName) newErrors.lastName = 'Required';
    if (!form.mobile || form.mobile.length < 10) newErrors.mobile = 'Valid phone required';
    if (!form.email || !form.email.includes('@')) newErrors.email = 'Valid email required';
    if (!form.userType) newErrors.userType = 'Required';
    if (!form.industryType) newErrors.industryType = 'Required';
    if (!form.address) newErrors.address = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    await register({
      companyName: form.companyName,
      firstName: form.firstName,
      lastName: form.lastName,
      mobile: form.mobile,
      email: form.email,
      userType: form.userType as UserType,
      industryType: form.industryType,
    });
    setLoading(false);
    router.replace('/(auth)/pending-approval');
  };

  return (
    <View style={styles.container}>
      <AppBar title="Register" showBack />
      <ScreenContainer scroll padded>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Text style={styles.heading}>Create Enterprise Account</Text>
          <Text style={styles.description}>
            Register as an industrial buyer, seller, or both. Your account will be reviewed by our admin team.
          </Text>

          <Input
            label="Company Name"
            value={form.companyName}
            onChangeText={(v) => updateField('companyName', v)}
            placeholder="Your company name"
            leftIcon="business-outline"
            required
            error={errors.companyName}
          />
          <View style={styles.row}>
            <View style={styles.half}>
              <Input
                label="First Name"
                value={form.firstName}
                onChangeText={(v) => updateField('firstName', v)}
                placeholder="First name"
                required
                error={errors.firstName}
              />
            </View>
            <View style={styles.half}>
              <Input
                label="Last Name"
                value={form.lastName}
                onChangeText={(v) => updateField('lastName', v)}
                placeholder="Last name"
                required
                error={errors.lastName}
              />
            </View>
          </View>
          <Input
            label="Mobile Number"
            value={form.mobile}
            onChangeText={(v) => updateField('mobile', v)}
            placeholder="+91 XXXXX XXXXX"
            keyboardType="phone-pad"
            leftIcon="call-outline"
            required
            error={errors.mobile}
          />
          <Input
            label="Email Address"
            value={form.email}
            onChangeText={(v) => updateField('email', v)}
            placeholder="company@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
            required
            error={errors.email}
          />
          <Dropdown
            label="User Type"
            placeholder="Select user type"
            value={form.userType}
            onChange={(v) => updateField('userType', v)}
            options={[
              { label: 'Buyer', value: 'buyer' },
              { label: 'Seller', value: 'seller' },
              { label: 'Both', value: 'both' },
            ]}
            required
            error={errors.userType}
          />
          <Dropdown
            label="Industry Type"
            placeholder="Select industry type"
            value={form.industryType}
            onChange={(v) => updateField('industryType', v)}
            options={[
              { label: 'Buildrix', value: 'Buildrix' },
              { label: 'Geotrix', value: 'Geotrix' },
              { label: 'Thermox', value: 'Thermox' },
            ]}
            required
            error={errors.industryType}
          />

              

          <Text style={styles.sectionTitle}>Address</Text>
          <Input
            label="Street Address"
            value={form.address}
            onChangeText={(v) => updateField('address', v)}
            placeholder="Plot, Street, Area"
            leftIcon="location-outline"
            required
            error={errors.address}
          />
          <View style={styles.row}>
            <View style={styles.half}>
              <Input label="City" value={form.city} onChangeText={(v) => updateField('city', v)} placeholder="City" />
            </View>
            <View style={styles.half}>
              <Input label="State" value={form.state} onChangeText={(v) => updateField('state', v)} placeholder="State" />
            </View>
          </View>
          <Input
            label="Pincode"
            value={form.pincode}
            onChangeText={(v) => updateField('pincode', v)}
            placeholder="PIN Code"
            keyboardType="number-pad"
          />

          <Button
            title="Submit Registration"
            onPress={handleRegister}
            loading={loading}
            fullWidth
            icon="person-add-outline"
            style={styles.submitButton}
          />
        </KeyboardAvoidingView>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heading: {
    ...typography.heading1,
    marginTop: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.heading3,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  half: {
    flex: 1,
  },
  submitButton: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
});
