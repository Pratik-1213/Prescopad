import React, { useState, useEffect } from 'react';
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
import QRCode from 'react-native-qrcode-svg';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useSyncStore } from '../../store/useSyncStore';
import { ConnectionStatus, PairingData } from '../../types/sync.types';
import { UserRole } from '../../types/auth.types';
import {
  generatePairingQR,
  serializePairingData,
  getLocalIPAddress,
  parsePairingQR,
} from '../../services/sync/pairingService';

export default function PairingScreen({ navigation }: any): React.JSX.Element {
  const { user } = useAuthStore();
  const {
    connectionStatus,
    pairedDevice,
    setConnectionStatus,
    setPairedDevice,
    disconnect,
  } = useSyncStore();

  const isDoctor = user?.role === UserRole.DOCTOR;
  const [pairingData, setPairingData] = useState<PairingData | null>(null);
  const [qrValue, setQrValue] = useState('');
  const [ipInput, setIpInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (isDoctor) {
      generateQRData();
    }
  }, [isDoctor]);

  const generateQRData = () => {
    const ipAddress = getLocalIPAddress();
    const data = generatePairingQR(
      user?.name || 'Doctor Device',
      UserRole.DOCTOR,
      user?.clinicId || '',
      ipAddress,
    );
    setPairingData(data);
    setQrValue(serializePairingData(data));
  };

  const handleConnect = async () => {
    if (!ipInput.trim()) {
      Alert.alert('Required', 'Please enter the doctor device IP address');
      return;
    }

    setIsConnecting(true);
    setConnectionStatus(ConnectionStatus.CONNECTING);

    try {
      // Simulate connection attempt
      // In production, this would use WebSocket connection via lanSync
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const device: PairingData = {
        deviceId: 'doctor-device',
        deviceName: 'Doctor Device',
        ipAddress: ipInput.trim(),
        port: 8765,
        role: UserRole.DOCTOR,
        clinicId: user?.clinicId || '',
      };

      setPairedDevice(device);
      setConnectionStatus(ConnectionStatus.CONNECTED);
      Alert.alert('Connected', `Successfully paired with ${device.deviceName}`);
    } catch (error: any) {
      setConnectionStatus(ConnectionStatus.ERROR);
      Alert.alert('Error', error.message || 'Failed to connect. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect',
      'Are you sure you want to disconnect from the paired device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => {
            disconnect();
          },
        },
      ],
    );
  };

  const handleScanQR = () => {
    Alert.alert(
      'Scan QR Code',
      'Camera-based QR scanning will be available in a future update. Please enter the IP address manually for now.',
    );
  };

  const getStatusColor = (): string => {
    switch (connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return COLORS.success;
      case ConnectionStatus.CONNECTING:
        return COLORS.warning;
      case ConnectionStatus.ERROR:
        return COLORS.error;
      default:
        return COLORS.textLight;
    }
  };

  const getStatusLabel = (): string => {
    switch (connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return 'Connected';
      case ConnectionStatus.CONNECTING:
        return 'Connecting...';
      case ConnectionStatus.ERROR:
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };

  const getStatusIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return 'checkmark-circle';
      case ConnectionStatus.CONNECTING:
        return 'sync';
      case ConnectionStatus.ERROR:
        return 'alert-circle';
      default:
        return 'remove-circle-outline';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.white} barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Device Pairing</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Connection Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Ionicons name={getStatusIcon()} size={20} color={getStatusColor()} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusLabel()}
            </Text>
          </View>
          {pairedDevice && connectionStatus === ConnectionStatus.CONNECTED ? (
            <View style={styles.pairedInfo}>
              <Text style={styles.pairedDeviceName}>
                {pairedDevice.deviceName}
              </Text>
              <Text style={styles.pairedDeviceIp}>
                {pairedDevice.ipAddress}:{pairedDevice.port}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Doctor View - Show QR Code */}
        {isDoctor ? (
          <View style={styles.roleSection}>
            <View style={styles.roleBanner}>
              <Ionicons name="medkit" size={20} color={COLORS.primary} />
              <Text style={styles.roleBannerText}>Doctor Device</Text>
            </View>

            <View style={styles.qrCard}>
              <Text style={styles.qrTitle}>Scan to Pair</Text>
              <Text style={styles.qrSubtitle}>
                Show this QR code to the assistant device
              </Text>

              {qrValue ? (
                <View style={styles.qrWrapper}>
                  <QRCode
                    value={qrValue}
                    size={200}
                    color={COLORS.text}
                    backgroundColor={COLORS.white}
                  />
                </View>
              ) : (
                <ActivityIndicator size="large" color={COLORS.primary} />
              )}

              <View style={styles.ipDisplay}>
                <Ionicons name="wifi" size={18} color={COLORS.primary} />
                <Text style={styles.ipLabel}>Device IP Address</Text>
              </View>
              <Text style={styles.ipValue}>
                {pairingData?.ipAddress || 'Detecting...'}:{pairingData?.port || ''}
              </Text>

              <Text style={styles.instructionText}>
                Open PrescoPad on the assistant device and scan this code, or enter the IP address manually.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={generateQRData}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={18} color={COLORS.primary} />
              <Text style={styles.refreshBtnText}>Regenerate QR Code</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Assistant View - Input or Scan */}
        {!isDoctor ? (
          <View style={styles.roleSection}>
            <View style={styles.roleBanner}>
              <Ionicons name="people" size={20} color="#059669" />
              <Text style={[styles.roleBannerText, { color: '#059669' }]}>
                Assistant Device
              </Text>
            </View>

            <View style={styles.connectCard}>
              <Text style={styles.connectTitle}>Connect to Doctor</Text>
              <Text style={styles.connectSubtitle}>
                Enter the doctor device IP address or scan the QR code
              </Text>

              <TouchableOpacity
                style={styles.scanQRBtn}
                onPress={handleScanQR}
                activeOpacity={0.7}
              >
                <Ionicons name="qr-code-outline" size={24} color={COLORS.primary} />
                <Text style={styles.scanQRBtnText}>Scan QR Code</Text>
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <Text style={styles.inputLabel}>Doctor Device IP Address</Text>
              <TextInput
                style={styles.ipInput}
                value={ipInput}
                onChangeText={setIpInput}
                placeholder="e.g., 192.168.1.100"
                placeholderTextColor={COLORS.textLight}
                keyboardType="decimal-pad"
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[
                  styles.connectBtn,
                  (!ipInput.trim() || isConnecting) && styles.buttonDisabled,
                ]}
                onPress={handleConnect}
                disabled={!ipInput.trim() || isConnecting}
                activeOpacity={0.8}
              >
                {isConnecting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="link" size={20} color={COLORS.white} />
                    <Text style={styles.connectBtnText}>Connect</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Disconnect Button */}
        {connectionStatus === ConnectionStatus.CONNECTED ? (
          <TouchableOpacity
            style={styles.disconnectBtn}
            onPress={handleDisconnect}
            activeOpacity={0.7}
          >
            <Ionicons name="unlink" size={20} color={COLORS.error} />
            <Text style={styles.disconnectBtnText}>Disconnect</Text>
          </TouchableOpacity>
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

  // Status Card
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
  pairedInfo: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  pairedDeviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  pairedDeviceIp: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Role sections
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

  // QR Card (Doctor)
  qrCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.xxl,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  qrSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  qrWrapper: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
  },
  ipDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  ipLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  ipValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: SPACING.lg,
  },
  instructionText: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    marginTop: SPACING.md,
  },
  refreshBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Connect Card (Assistant)
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
  scanQRBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  scanQRBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 12,
    color: COLORS.textLight,
    paddingHorizontal: SPACING.md,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  ipInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.surfaceSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: SPACING.lg,
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

  // Disconnect
  disconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.error,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  disconnectBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.error,
  },
});
