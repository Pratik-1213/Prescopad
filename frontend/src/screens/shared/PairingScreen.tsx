import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { UserRole } from '../../types/auth.types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/native';
import api from '../../services/api';

interface PairingScreenProps {
  navigation: NativeStackNavigationProp<ParamListBase>;
}

export default function PairingScreen({ navigation }: PairingScreenProps): React.JSX.Element {
  const { user } = useAuthStore();
  const isDoctor = user?.role === UserRole.DOCTOR;
  const [phoneInput, setPhoneInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const isConnected = Boolean(user?.clinicId);

  const handleConnect = async () => {
    if (!phoneInput.trim()) {
      Alert.alert('Required', "Please enter the doctor's phone number");
      return;
    }

    setIsConnecting(true);
    try {
      const response = await api.post('/clinic/join', {
        doctorPhone: phoneInput.trim(),
      });

      if (response.data.clinic) {
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, clinicId: response.data.clinic.id };
          const token = useAuthStore.getState().accessToken || '';
          const refreshToken = useAuthStore.getState().refreshToken || '';
          await useAuthStore.getState().setUser(updatedUser, token, refreshToken);
        }

        Alert.alert('Connected!', `Joined clinic: ${response.data.clinic.name || "Doctor's Clinic"}`);
      }
    } catch (error: unknown) {
      let msg = 'Failed to connect. Please try again.';
      if (error instanceof Error) msg = error.message;
      const axiosErr = error as { response?: { data?: { error?: string } } };
      if (axiosErr.response?.data?.error) msg = axiosErr.response.data.error;
      Alert.alert('Error', msg);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.white} barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Clinic Connection</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Connection Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: isConnected ? COLORS.success : COLORS.textLight }]} />
            <Ionicons
              name={isConnected ? 'checkmark-circle' : 'remove-circle-outline'}
              size={20}
              color={isConnected ? COLORS.success : COLORS.textLight}
            />
            <Text style={[styles.statusText, { color: isConnected ? COLORS.success : COLORS.textLight }]}>
              {isConnected ? 'Connected to Clinic' : 'Not Connected'}
            </Text>
          </View>
          {isConnected && user?.clinicId ? (
            <View style={styles.connectedInfo}>
              <Text style={styles.connectedLabel}>Clinic ID: {user.clinicId.slice(0, 8)}...</Text>
            </View>
          ) : null}
        </View>

        {/* Doctor View */}
        {isDoctor ? (
          <View style={styles.roleSection}>
            <View style={styles.roleBanner}>
              <Ionicons name="medkit" size={20} color={COLORS.primary} />
              <Text style={styles.roleBannerText}>Doctor Device</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Share with Assistant</Text>
              <Text style={styles.infoSubtitle}>
                Give your phone number to your assistant so they can join your clinic
              </Text>

              <View style={styles.phoneDisplay}>
                <Ionicons name="call" size={20} color={COLORS.primary} />
                <Text style={styles.phoneValue}>{user?.phone || 'N/A'}</Text>
              </View>
              <Text style={styles.phoneHint}>
                Assistant enters this number to join your clinic
              </Text>
            </View>
          </View>
        ) : null}

        {/* Assistant View */}
        {!isDoctor ? (
          <View style={styles.roleSection}>
            <View style={styles.roleBanner}>
              <Ionicons name="people" size={20} color="#059669" />
              <Text style={[styles.roleBannerText, { color: '#059669' }]}>
                Assistant Device
              </Text>
            </View>

            <View style={styles.connectCard}>
              <Text style={styles.connectTitle}>Join Doctor's Clinic</Text>
              <Text style={styles.connectSubtitle}>
                Enter the doctor's phone number to pair and share clinic data
              </Text>

              <Text style={styles.inputLabel}>Doctor's Phone Number</Text>
              <TextInput
                style={styles.phoneInput}
                value={phoneInput}
                onChangeText={setPhoneInput}
                placeholder="e.g., 9876543210"
                placeholderTextColor={COLORS.textLight}
                keyboardType="phone-pad"
                autoCapitalize="none"
                maxLength={10}
              />

              <TouchableOpacity
                style={[styles.connectBtn, (!phoneInput.trim() || isConnecting) && styles.buttonDisabled]}
                onPress={handleConnect}
                disabled={!phoneInput.trim() || isConnecting}
                activeOpacity={0.8}
              >
                {isConnecting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="link" size={20} color={COLORS.white} />
                    <Text style={styles.connectBtnText}>Join Clinic</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: 50,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
  },
  connectedInfo: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  connectedLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  roleSection: {
    marginBottom: SPACING.xl,
  },
  roleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  roleBannerText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.xxl,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  infoSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  phoneDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  phoneValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1,
  },
  phoneHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  connectCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.xxl,
    ...SHADOWS.md,
  },
  connectTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  connectSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: SPACING.xl,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  phoneInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: 18,
    color: COLORS.text,
    backgroundColor: COLORS.surfaceSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: SPACING.lg,
    letterSpacing: 1,
  },
  connectBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  connectBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
