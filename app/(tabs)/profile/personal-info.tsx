import { View, StyleSheet } from 'react-native';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Input, Card } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/design-system';

export default function PersonalInfoScreen() {
  const { user } = useAuth();

  const fullName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Valued User';
  const phoneNumber = user?.phone || user?.mobile || 'Not provided';
  const emailAddress = user?.email || '';

  return (
    <View style={styles.container}>
      <AppBar title="Personal Information" showBack />
      <ScreenContainer scroll padded>
        <Card>
          <Input label="Full Name" value={fullName} editable={false} leftIcon="person-outline" />
          <Input label="Phone Number" value={phoneNumber} editable={false} leftIcon="call-outline" />
          <Input label="Email Address" value={emailAddress} editable={false} leftIcon="mail-outline" />
        </Card>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
