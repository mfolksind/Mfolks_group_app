import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Input, Button, Dropdown } from '@/components/ui';
import { colors, layout, spacing, typography } from '@/design-system';
import { UserType } from '@/types';
import { getFamilies, FamilyItem } from '@/api/families.api';
import { createAddress } from '@/api/addresses.api';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [families, setFamilies] = useState<FamilyItem[]>([]);
  const [form, setForm] = useState({
    companyName: '',
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    password: '',
    userType: 'buyer' as UserType,
    address: '',
    city: '',
    state: '',
    pincode: '',
    industryType: '', // Holds family ID
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchFamiliesList = async () => {
      const res = await getFamilies();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const list = res.data;
        setFamilies(list);
        setForm((prev) => ({ ...prev, industryType: list[0]._id }));
      }
    };
    fetchFamiliesList();
  }, []);

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handlePasswordBlur = () => {
    if (form.password && form.password.length < 8) {
      setErrors((prev) => ({ ...prev, password: 'Password must be at least 8 characters' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.companyName) newErrors.companyName = 'Required';
    if (!form.firstName) newErrors.firstName = 'Required';
    if (!form.lastName) newErrors.lastName = 'Required';
    if (!form.mobile || form.mobile.length < 10) newErrors.mobile = 'Valid phone required';
    if (!form.email || !form.email.includes('@')) newErrors.email = 'Valid email required';
    if (!form.password) {
      newErrors.password = 'Required';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (!form.userType) newErrors.userType = 'Required';
    if (!form.industryType) newErrors.industryType = 'Required';
    if (!form.address) newErrors.address = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    const res = await register({
      name: `${form.firstName} ${form.lastName}`.trim(),
      email: form.email,
      password: form.password,
      phone: form.mobile,
      family: form.industryType,
    } as any);

    if (res.success) {
      // Save address entered during registration
      if (form.address && form.city && form.state) {
        try {
          await createAddress({
            fullName: `${form.firstName} ${form.lastName}`.trim(),
            phone: form.mobile,
            addressLine1: form.address,
            city: form.city,
            state: form.state,
            country: 'India',
            postalCode: form.pincode,
            addressType: 'HOME',
            isDefault: true,
          });
        } catch (addrErr) {
          console.error('Failed to save address during registration:', addrErr);
        }
      }
      setLoading(false);
      if (res.isPending) {
        router.replace('/(auth)/waiting-approval');
      } else {
        router.replace('/(tabs)/home');
      }
    } else {
      setLoading(false);
      setErrors({ form: res.message || 'Registration failed' });
    }
  };

  const familyOptions = families.map((f) => ({
    label: `${f.name}${f.requiresAdminApproval ? ' (Requires Admin Approval)' : ''}`,
    value: f._id,
  }));

  return (
    <View style={styles.container}>
      <AppBar title="Register" showBack />
      <ScreenContainer scroll padded>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Text style={styles.heading}>Create Enterprise Account</Text>
          <Text style={styles.description}>
            Select your Industry Family to access specialized marketplace categories and product lines.
          </Text>

          {errors.form ? <Text style={styles.globalError}>{errors.form}</Text> : null}

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
          <Input
            label="Password"
            value={form.password}
            onChangeText={(v) => updateField('password', v)}
            onBlur={handlePasswordBlur}
            placeholder="Create password (min. 8 characters)"
            secureTextEntry={!showPassword}
            leftIcon="lock-closed-outline"
            rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => setShowPassword(!showPassword)}
            hint="Minimum 8 characters required"
            required
            error={errors.password}
          />

          <Dropdown
            label="Industry Type (Family)"
            placeholder="Select your industry family"
            value={form.industryType}
            onChange={(v) => updateField('industryType', v)}
            options={familyOptions.length > 0 ? familyOptions : [
              { label: 'Geotrix', value: 'Geotrix' },
              { label: 'Thermox', value: 'Thermox' },
              { label: 'Buildrix', value: 'Buildrix' },
            ]}
            required
            error={errors.industryType}
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

          <View style={styles.legalContainer}>
            <Text style={styles.legalText}>
              By registering, you agree to MFolks{' '}
              <Text
                style={styles.legalLink}
                onPress={() => Linking.openURL('https://mfolks.com/app-terms-and-conditions/')}
              >
                Terms & Conditions
              </Text>
              {' '}and{' '}
              <Text
                style={styles.legalLink}
                onPress={() => Linking.openURL('https://mfolks.com/app-privacy-policy/')}
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </View>

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
  globalError: {
    ...typography.caption,
    color: colors.error,
    backgroundColor: '#FEE2E2',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
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
  legalContainer: {
    marginVertical: spacing.md,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  legalText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
