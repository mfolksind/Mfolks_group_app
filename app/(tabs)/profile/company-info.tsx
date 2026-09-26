import { View, StyleSheet } from 'react-native';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Input, Card } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/design-system';

export default function CompanyInfoScreen() {
  const { user } = useAuth();

  const companyName = user?.companyName || user?.name || 'MFolks Member';
  const userType = (user?.userType || user?.role || 'Customer').toUpperCase();
  const status = (user?.status || 'Active').toUpperCase();

  return (
    <View style={styles.container}>
      <AppBar title="Company Information" showBack />
      <ScreenContainer scroll padded>
        <Card>
          <Input label="Company Name" value={companyName} editable={false} leftIcon="business-outline" />
          <Input label="User Type" value={userType} editable={false} />
          <Input label="Account Status" value={status} editable={false} />
        </Card>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
