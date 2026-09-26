import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  Clipboard,
} from 'react-native';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AppBar, Card, Button, Dialog, SwipeButton } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/design-system';
import { createRazorpayOrder, verifyRazorpayPayment } from '@/api/payments.api';
import { bankDetails } from '@/data/mockData';
import { createOrder } from '@/api/orders.api';
import { useCart } from '@/context/CartContext';
import { useHardwareBack } from '@/hooks/useHardwareBack';

// Pure JS HMAC-SHA256 implementation
function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i: number, j: number;
  let result = '';
  const words: number[] = [];
  const asciiLength = ascii[lengthProperty] * 8;

  const hash: number[] = (sha256 as any).h = (sha256 as any).h || [];
  const k: number[] = (sha256 as any).k = (sha256 as any).k || [];
  let primeCounter = k[lengthProperty];

  const isPrime: Record<number, number> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isPrime[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isPrime[i] = i;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  const msgWords: number[] = [];
  for (i = 0; i < ascii[lengthProperty]; i++) {
    const code = ascii.charCodeAt(i);
    msgWords[i >> 2] |= (code & 0xff) << (24 - (i % 4) * 8);
  }

  const padLen = ascii[lengthProperty];
  msgWords[padLen >> 2] |= 0x80 << (24 - (padLen % 4) * 8);

  const wordCount = Math.ceil((padLen + 9) / 64) * 16;
  while (msgWords.length < wordCount) {
    msgWords.push(0);
  }
  msgWords[wordCount - 2] = Math.floor(asciiLength / maxWord);
  msgWords[wordCount - 1] = asciiLength;

  let hCurrent = hash.slice(0);

  for (j = 0; j < msgWords.length; j += 16) {
    const w = msgWords.slice(j, j + 16);
    const oldHash = hCurrent.slice(0);

    for (i = 0; i < 64; i++) {
      if (i >= 16) {
        const w15 = w[i - 15], w2 = w[i - 2];
        const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
        const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }

      const ch = (hCurrent[4] & hCurrent[5]) ^ (~hCurrent[4] & hCurrent[6]);
      const maj = (hCurrent[0] & hCurrent[1]) ^ (hCurrent[0] & hCurrent[2]) ^ (hCurrent[1] & hCurrent[2]);
      const temp1 = (hCurrent[7] + (rightRotate(hCurrent[4], 6) ^ rightRotate(hCurrent[4], 11) ^ rightRotate(hCurrent[4], 25)) + ch + k[i] + w[i]) | 0;
      const temp2 = ((rightRotate(hCurrent[0], 2) ^ rightRotate(hCurrent[0], 13) ^ rightRotate(hCurrent[0], 22)) + maj) | 0;

      hCurrent = [(temp1 + temp2) | 0].concat(hCurrent.slice(0, 7));
      hCurrent[4] = (hCurrent[4] + temp1) | 0;
    }

    for (i = 0; i < 8; i++) {
      hCurrent[i] = (hCurrent[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    const hex = (hCurrent[i] >>> 0).toString(16);
    result += ('00000000' + hex).slice(-8);
  }
  return result;
}

function hmacSha256(message: string, key: string): string {
  const blocksize = 64;
  let keyBytes: number[] = [];
  for (let i = 0; i < key.length; i++) {
    keyBytes.push(key.charCodeAt(i) & 0xff);
  }

  if (keyBytes.length > blocksize) {
    const hashedKey = sha256(key);
    keyBytes = [];
    for (let i = 0; i < hashedKey.length; i += 2) {
      keyBytes.push(parseInt(hashedKey.substr(i, 2), 16));
    }
  }

  while (keyBytes.length < blocksize) {
    keyBytes.push(0);
  }

  const ipad: number[] = [];
  const opad: number[] = [];
  for (let i = 0; i < blocksize; i++) {
    ipad.push(keyBytes[i] ^ 0x36);
    opad.push(keyBytes[i] ^ 0x5c);
  }

  const bytesToString = (bytes: number[]): string => {
    let str = '';
    for (let i = 0; i < bytes.length; i++) {
      str += String.fromCharCode(bytes[i]);
    }
    return str;
  };

  const innerMsg = bytesToString(ipad) + message;
  const innerHashHex = sha256(innerMsg);

  let innerHashStr = '';
  for (let i = 0; i < innerHashHex.length; i += 2) {
    innerHashStr += String.fromCharCode(parseInt(innerHashHex.substr(i, 2), 16));
  }

  const outerMsg = bytesToString(opad) + innerHashStr;
  return sha256(outerMsg);
}

const RAZORPAY_KEY_ID = 'rzp_test_TMSvHEUX9RHAtI';
const RAZORPAY_KEY_SECRET = 'MUwpkSL6GXuudP7Gc7sOuhbA';

export default function PaymentScreen() {
  const router = useRouter();
  useHardwareBack('/cart');
  const navigation = useNavigation();
  const { items, addressId, amount } = useLocalSearchParams<{
    items: string;
    addressId: string;
    amount: string;
  }>();

  const { clearCart } = useCart();
  const [swipeKey, setSwipeKey] = useState(0);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setSwipeKey((prev) => prev + 1);
    });
    return unsubscribe;
  }, [navigation]);

  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY' | 'BANK_TRANSFER'>('BANK_TRANSFER');
  const [loading, setLoading] = useState(false);
  const [showConfirmOffline, setShowConfirmOffline] = useState(false);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [razorpayOrderId, setRazorpayOrderId] = useState<string | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [selectedSimulatedOption, setSelectedSimulatedOption] = useState<'card' | 'upi' | 'netbanking'>('upi');
  const [copingText, setCopingText] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const amountNum = parseFloat(amount || '0');
  const baseSubtotal = Math.round((amountNum / 1.18) * 100) / 100;
  const totalTax = Math.round((amountNum - baseSubtotal) * 100) / 100;
  const cgst = Math.round((totalTax / 2) * 100) / 100;
  const sgst = Math.round((totalTax - cgst) * 100) / 100;
  const orderNo = 'Pending Confirmation';

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    setCopingText(label);
    setTimeout(() => setCopingText(null), 2000);
  };

  const handlePayNow = async () => {
    if (paymentMethod === 'BANK_TRANSFER') {
      setShowConfirmOffline(true);
      return;
    }

    // Start Razorpay payment flow (Create order on backend first as specified in backend spec)
    try {
      setLoading(true);
      const parsedItems = JSON.parse(items || '[]');
      const orderRes = await createOrder({
        items: parsedItems,
        addressId: addressId!,
        shippingAddressId: addressId!,
        paymentMethod: 'RAZORPAY',
      });

      if (!orderRes.success || !orderRes.data) {
        Alert.alert('Checkout Failed', orderRes.message || 'Failed to create order for Razorpay payment.');
        return;
      }

      const createdOrderId = orderRes.data._id;
      setActiveOrderId(createdOrderId);

      const tempReceipt = `rcpt_${createdOrderId.slice(-6)}`;
      const res = await createRazorpayOrder(amountNum, 'INR', tempReceipt, createdOrderId);
      
      if (res.success && res.data) {
        setRazorpayOrderId(res.data.id);
        setShowRazorpayModal(true);
      } else {
        Alert.alert('Error', res.message || 'Failed to create Razorpay transaction order.');
      }
    } catch (err) {
      console.error('Razorpay order creation error:', err);
      Alert.alert('Error', 'An error occurred while launching Razorpay payment.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePaymentSuccess = async () => {
    if (!razorpayOrderId || !activeOrderId) return;

    try {
      setShowRazorpayModal(false);
      setLoading(true);

      const localOrderId = activeOrderId;
      clearCart();

      // Attempt verification on backend with user test secret
      try {
        const mockPaymentId = `pay_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const signatureData = `${razorpayOrderId}|${mockPaymentId}`;
        const mockSignature = hmacSha256(signatureData, RAZORPAY_KEY_SECRET);

        await verifyRazorpayPayment({
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: mockPaymentId,
          razorpay_signature: mockSignature,
          orderId: localOrderId,
        });
      } catch (verifyErr) {
        console.log('Verification check result in test mode:', verifyErr);
      }

      router.replace({
        pathname: '/order-success',
        params: {
          orderId: localOrderId,
          orderNo: 'ORD-SUCCESS',
          total: amount,
          paymentMethod: 'RAZORPAY',
        },
      });
    } catch (err) {
      console.error('Simulated payment error:', err);
      Alert.alert('Error', 'An error occurred while processing payment verification.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOfflinePayment = async () => {
    try {
      setShowConfirmOffline(false);
      setLoading(true);

      const parsedItems = JSON.parse(items || '[]');
      const res = await createOrder({
        items: parsedItems,
        addressId: addressId!,
        shippingAddressId: addressId!,
        paymentMethod: 'BANK_TRANSFER',
      });

      if (res.success && res.data) {
        clearCart();
        router.replace({
          pathname: '/order-success',
          params: {
            orderId: res.data._id,
            orderNo: res.data.orderNumber || res.data.orderNo || 'ORD-SUCCESS',
            total: amount,
            paymentMethod: 'BANK_TRANSFER',
          },
        });
      } else {
        Alert.alert('Checkout Failed', res.message || 'Failed to place order.');
      }
    } catch (err) {
      console.error('Offline order creation error:', err);
      Alert.alert('Error', 'An error occurred while creating order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppBar title="Secure Checkout" showBack />
      <ScreenContainer scroll padded>
        {/* Order Details Header */}
        <Card style={styles.orderCard}>
          <View style={styles.orderRow}>
            <View>
              <Text style={styles.orderLabel}>Order Number</Text>
              <Text style={styles.orderNo}>{orderNo}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.orderLabel}>Total Payable</Text>
              <Text style={styles.orderAmount}>{formatPrice(amountNum)}</Text>
            </View>
          </View>
        </Card>

        {/* 18% GST Billing Breakup Card */}
        <Card style={styles.gstBreakupCard}>
          <View style={styles.gstHeaderRow}>
            <Ionicons name="receipt-outline" size={16} color={colors.primary} />
            <Text style={styles.gstCardTitle}>18% GST Tax Invoice Breakdown</Text>
          </View>
          <View style={styles.breakupDivider} />
          <View style={styles.breakupRow}>
            <Text style={styles.breakupLabel}>Taxable Value (Base Subtotal)</Text>
            <Text style={styles.breakupValue}>{formatPrice(baseSubtotal)}</Text>
          </View>
          <View style={styles.breakupRow}>
            <Text style={styles.breakupLabel}>CGST (9.0%)</Text>
            <Text style={styles.breakupValue}>+{formatPrice(cgst)}</Text>
          </View>
          <View style={styles.breakupRow}>
            <Text style={styles.breakupLabel}>SGST (9.0%)</Text>
            <Text style={styles.breakupValue}>+{formatPrice(sgst)}</Text>
          </View>
          <View style={styles.breakupRow}>
            <Text style={styles.breakupLabelBold}>Total GST (18.0%)</Text>
            <Text style={styles.breakupValueBold}>+{formatPrice(totalTax)}</Text>
          </View>
          <View style={styles.breakupDivider} />
          <View style={styles.breakupRowTotal}>
            <Text style={styles.totalPayableLabel}>Net Payable (Incl. of all taxes)</Text>
            <Text style={styles.totalPayableValue}>{formatPrice(amountNum)}</Text>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Select Payment Method</Text>

        {/* Payment options */}


        <Pressable
          onPress={() => setPaymentMethod('BANK_TRANSFER')}
          style={[
            styles.methodOption,
            paymentMethod === 'BANK_TRANSFER' && styles.methodOptionActive,
          ]}
        >
          <View style={[styles.radioCircle, paymentMethod === 'BANK_TRANSFER' && styles.radioCircleActive]}>
            {paymentMethod === 'BANK_TRANSFER' && <View style={styles.radioDot} />}
          </View>
          <View style={styles.methodDetails}>
            <Text style={styles.methodTitle}>Offline Bank Transfer (Wire / RTGS / NEFT)</Text>
            <Text style={styles.methodSubtitle}>
              Direct corporate transfer. Admin will verify receipt and mark PAID.
            </Text>
          </View>
          <Ionicons
            name="business"
            size={24}
            color={paymentMethod === 'BANK_TRANSFER' ? colors.primary : colors.textSecondary}
          />
        </Pressable>

        <Pressable
          onPress={() => setPaymentMethod('RAZORPAY')}
          style={[
            styles.methodOption,
            paymentMethod === 'RAZORPAY' && styles.methodOptionActive,
          ]}
        >
          <View style={[styles.radioCircle, paymentMethod === 'RAZORPAY' && styles.radioCircleActive]}>
            {paymentMethod === 'RAZORPAY' && <View style={styles.radioDot} />}
          </View>
          <View style={styles.methodDetails}>
            <Text style={styles.methodTitle}>Online Payment (Razorpay Gateway)</Text>
            <Text style={styles.methodSubtitle}>
              Credit / Debit Cards, UPI, Netbanking, Corporate Wallets.
            </Text>
          </View>
          <Ionicons
            name="card"
            size={24}
            color={paymentMethod === 'RAZORPAY' ? colors.primary : colors.textSecondary}
          />
        </Pressable>

        {/* Dynamic Payment Body */}
        {paymentMethod === 'BANK_TRANSFER' && (
          <View style={styles.offlineBody}>
            <Text style={styles.subSectionTitle}>Corporate Bank Details</Text>
            <Text style={styles.infoText}>
              Please transfer the total amount to the account below. After completing the payment, our admin will verify and approve your order.
            </Text>
            <Card style={styles.bankCard}>
              <BankDetailRow
                label="Account Name"
                value={bankDetails.accountName}
                onCopy={() => copyToClipboard(bankDetails.accountName, 'Account Name')}
              />
              <BankDetailRow
                label="Bank Name"
                value={bankDetails.bankName}
                onCopy={() => copyToClipboard(bankDetails.bankName, 'Bank Name')}
              />
              <BankDetailRow
                label="Account Number"
                value={bankDetails.accountNumber}
                onCopy={() => copyToClipboard(bankDetails.accountNumber, 'Account Number')}
              />
              <BankDetailRow
                label="IFSC Code"
                value={bankDetails.ifscCode}
                onCopy={() => copyToClipboard(bankDetails.ifscCode, 'IFSC Code')}
              />
              <BankDetailRow
                label="Branch"
                value={bankDetails.branch}
                onCopy={() => copyToClipboard(bankDetails.branch, 'Branch')}
              />
            </Card>
            {copingText && (
              <View style={styles.toastBox}>
                <Text style={styles.toastText}>{copingText} copied to Clipboard!</Text>
              </View>
            )}
          </View>
        )}

        {paymentMethod === 'RAZORPAY' && (
          <View style={styles.onlineBody}>
            <Text style={styles.infoText}>
              You will be redirected to the secure Razorpay payment gateway to complete your transaction online.
            </Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons name="shield-checkmark" size={16} color={colors.success || '#10B981'} />
                <Text style={styles.featureText}>Secure SSL encrypted payments</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="flash" size={16} color="#F59E0B" />
                <Text style={styles.featureText}>Instant order processing</Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Button */}
        <View style={styles.actionContainer}>
          <SwipeButton
            key={`${paymentMethod}_${swipeKey}`}
            title={paymentMethod === 'RAZORPAY' ? 'Swipe to Pay via Razorpay' : 'Swipe to Confirm Order'}
            onSwipeSuccess={handlePayNow}
            disabled={loading || amountNum <= 0}
            loading={loading}
            style={styles.payBtn}
          />
        </View>
      </ScreenContainer>

      {/* Offline Confirmation Dialog */}
      <Dialog
        visible={showConfirmOffline}
        title="Confirm Offline Payment"
        message={`Are you sure you want to confirm your order of ${formatPrice(amountNum)} via offline transfer? Please send payment to bank details provided.`}
        confirmLabel="Confirm"
        onConfirm={handleConfirmOfflinePayment}
        onCancel={() => setShowConfirmOffline(false)}
      />

      {/* Mock Razorpay Checkout Modal */}
      <Modal
        visible={showRazorpayModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowRazorpayModal(false);
          Alert.alert('Payment Cancelled', 'Razorpay transaction was cancelled by user.');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Razorpay Mock Header */}
            <View style={styles.rpHeader}>
              <View style={styles.rpBrandRow}>
                <View style={styles.rpLogo}>
                  <Text style={styles.rpLogoText}>R</Text>
                </View>
                <View>
                  <Text style={styles.rpBrandName}>Razorpay</Text>
                  <Text style={styles.rpSubBrand}>Test Key: {RAZORPAY_KEY_ID}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.rpAmountLabel}>Amount</Text>
                <Text style={styles.rpAmountVal}>{formatPrice(amountNum)}</Text>
              </View>
            </View>

            <View style={styles.rpBody}>
              <Text style={styles.rpSectionTitle}>Order ID: {razorpayOrderId}</Text>
              <Text style={styles.rpSectionTitle}>Choose a Simulated Method</Text>

              <Pressable
                onPress={() => setSelectedSimulatedOption('upi')}
                style={[styles.rpOption, selectedSimulatedOption === 'upi' && styles.rpOptionActive]}
              >
                <Ionicons name="logo-whatsapp" size={20} color="#10B981" />
                <Text style={styles.rpOptionText}>UPI / QR (Instant & Free)</Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedSimulatedOption('card')}
                style={[styles.rpOption, selectedSimulatedOption === 'card' && styles.rpOptionActive]}
              >
                <Ionicons name="card-outline" size={20} color="#3B82F6" />
                <Text style={styles.rpOptionText}>Credit / Debit Card</Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedSimulatedOption('netbanking')}
                style={[styles.rpOption, selectedSimulatedOption === 'netbanking' && styles.rpOptionActive]}
              >
                <Ionicons name="business-outline" size={20} color="#8B5CF6" />
                <Text style={styles.rpOptionText}>Netbanking</Text>
              </Pressable>

              <Text style={styles.rpSandboxWarning}>
                This is a simulated Sandbox transaction. Clicking 'Simulate Success' will invoke the backend secure verification APIs, compute the signature via SHA256 HMAC and mark your order as PAID.
              </Text>
            </View>

            <View style={styles.rpFooter}>
              <Button
                title="Cancel Payment"
                variant="ghost"
                onPress={() => {
                  setShowRazorpayModal(false);
                  Alert.alert('Payment Cancelled', 'Razorpay transaction was cancelled by user.');
                }}
                style={styles.rpFooterBtn}
              />
              <Button
                title="Simulate Success"
                onPress={handleSimulatePaymentSuccess}
                style={{ ...styles.rpFooterBtn, backgroundColor: '#3399FF' }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

interface BankDetailRowProps {
  label: string;
  value: string;
  onCopy: () => void;
}

function BankDetailRow({ label, value, onCopy }: BankDetailRowProps) {
  return (
    <View style={styles.bankDetailRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.bankDetailLabel}>{label}</Text>
        <Text style={styles.bankDetailValue}>{value}</Text>
      </View>
      <Pressable onPress={onCopy} style={styles.copyBtn} hitSlop={8}>
        <Ionicons name="copy-outline" size={18} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  orderCard: { marginTop: spacing.md, marginBottom: spacing.md, padding: spacing.md },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderLabel: { ...typography.caption, color: colors.textSecondary },
  orderNo: { ...typography.heading3, color: colors.primary },
  orderAmount: { ...typography.heading2, color: colors.secondary },
  sectionTitle: { ...typography.heading3, marginTop: spacing.md, marginBottom: spacing.sm },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: spacing.md,
  },
  methodOptionActive: {
    borderColor: colors.primary,
    backgroundColor: '#F5F3FF', // light primary tint
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  radioCircleActive: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  methodDetails: { flex: 1, paddingRight: spacing.sm },
  methodTitle: { ...typography.bodyMedium, color: colors.textPrimary },
  methodSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  offlineBody: { marginTop: spacing.md },
  onlineBody: { marginTop: spacing.md, paddingHorizontal: spacing.xs },
  subSectionTitle: { ...typography.bodyMedium, fontWeight: '700', marginBottom: spacing.xs },
  infoText: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 20 },
  bankCard: { padding: spacing.sm, marginBottom: spacing.md },
  bankDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  bankDetailLabel: { ...typography.caption, color: colors.textSecondary },
  bankDetailValue: { ...typography.bodyMedium, color: colors.textPrimary, marginTop: 2 },
  copyBtn: { padding: spacing.xs },
  toastBox: {
    backgroundColor: colors.successLight || '#D1FAE5',
    padding: 10,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  toastText: { ...typography.bodyMedium, color: colors.success || '#047857', fontSize: 13 },
  featuresList: { gap: spacing.sm, marginBottom: spacing.lg },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  featureText: { ...typography.body, color: colors.textPrimary },
  actionContainer: { marginTop: spacing.lg, marginBottom: spacing.xl },
  payBtn: { height: 50 },

  // Razorpay Checkout Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    minHeight: 480,
    paddingBottom: spacing.lg,
  },
  rpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#002C54', // Dark blue razorpay header
    padding: spacing.md,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  rpBrandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rpLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3399FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rpLogoText: { color: '#FFFFFF', fontWeight: '800', fontSize: 20 },
  rpBrandName: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  rpSubBrand: { color: '#B3C6D6', fontSize: 11 },
  rpAmountLabel: { color: '#B3C6D6', fontSize: 10 },
  rpAmountVal: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  rpBody: { padding: spacing.md },
  rpSectionTitle: { ...typography.bodyMedium, fontWeight: '700', marginTop: spacing.xs, marginBottom: spacing.sm, color: colors.textSecondary },
  rpOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  rpOptionActive: {
    borderColor: '#3399FF',
    backgroundColor: '#F0F7FF',
  },
  rpOptionText: { ...typography.bodyMedium, fontWeight: '600' },
  rpSandboxWarning: {
    ...typography.caption,
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
    lineHeight: 16,
  },
  rpFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
  },
  rpFooterBtn: { flex: 1 },

  // GST Breakup Styles
  gstBreakupCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  gstHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.xs,
  },
  gstCardTitle: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.primary,
  },
  breakupDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.xs,
  },
  breakupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  breakupLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  breakupValue: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  breakupLabelBold: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  breakupValueBold: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  breakupRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  totalPayableLabel: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  totalPayableValue: {
    ...typography.heading3,
    color: colors.secondary,
    fontWeight: '800',
  },
});
