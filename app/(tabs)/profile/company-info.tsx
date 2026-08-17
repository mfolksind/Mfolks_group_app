import { View, StyleSheet } from 'react-native';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Input, Card } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/design-system';

export default function CompanyInfoScreen() {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <AppBar title="Company Information" showBack />
      <ScreenContainer scroll padded>
        <Card>
          <Input label="Company Name" value={user?.companyName ?? ''} editable={false} leftIcon="business-outline" />
          <Input label="User Type" value={user?.userType?.toUpperCase() ?? ''} editable={false} />
          <Input label="Account Status" value={user?.status?.toUpperCase() ?? ''} editable={false} />
        </Card>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 30 },
});
