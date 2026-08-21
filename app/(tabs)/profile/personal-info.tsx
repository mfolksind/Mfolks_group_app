import { View, StyleSheet } from 'react-native';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Input, Card } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/design-system';

export default function PersonalInfoScreen() {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <AppBar title="Personal Information" showBack />
      <ScreenContainer scroll padded>
        <Card>
          <Input label="First Name" value={user?.firstName ?? ''} editable={false} />
          <Input label="Last Name" value={user?.lastName ?? ''} editable={false} />
          <Input label="Mobile Number" value={user?.mobile ?? ''} editable={false} leftIcon="call-outline" />
          <Input label="Email Address" value={user?.email ?? ''} editable={false} leftIcon="mail-outline" />
        </Card>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
