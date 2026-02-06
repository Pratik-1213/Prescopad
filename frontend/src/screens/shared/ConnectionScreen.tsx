import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar,
  ScrollView, Alert, ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { ConnectionRequest, TeamMember } from '../../types/connection.types';
import * as ConnectionService from '../../services/connectionService';
import { refreshSession } from '../../services/authService';

export default function ConnectionScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const { user, setUser } = useAuthStore();
  const isDoctor = user?.role === 'doctor';

  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Doctor: invite by phone
  const [invitePhone, setInvitePhone] = useState('');
  const [inviting, setInviting] = useState(false);

  // Assistant: join by code
  const [doctorCode, setDoctorCode] = useState('');
  const [requesting, setRequesting] = useState(false);

  // Expanded member details
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [requests, members] = await Promise.all([
        ConnectionService.getPendingRequests().catch(() => []),
        user?.clinicId ? ConnectionService.getTeamMembers().catch(() => []) : Promise.resolve([]),
      ]);
      setPendingRequests(requests);
      setTeamMembers(members);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.clinicId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCopyCode = async () => {
    if (user?.doctorCode) {
      await Clipboard.setStringAsync(user.doctorCode);
      Alert.alert('Copied', 'Doctor code copied to clipboard');
    }
  };

  const handleInvite = async () => {
    const phone = invitePhone.trim().replace(/\D/g, '');
    if (phone.length < 10) {
      Alert.alert('Invalid', 'Enter a valid 10-digit phone number');
      return;
    }

    setInviting(true);
    try {
      await ConnectionService.inviteAssistant(phone);
      Alert.alert('Sent', 'Invitation sent to assistant');
      setInvitePhone('');
      loadData();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to invite';
      Alert.alert('Error', msg);
    } finally {
      setInviting(false);
    }
  };

  const handleRequestToJoin = async () => {
    const code = doctorCode.trim().toUpperCase();
    if (code.length !== 6) {
      Alert.alert('Invalid', 'Enter a valid 6-character doctor code');
      return;
    }

    setRequesting(true);
    try {
      await ConnectionService.requestToJoin(code);
      Alert.alert('Sent', 'Join request sent to doctor');
      setDoctorCode('');
      loadData();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to request';
      Alert.alert('Error', msg);
    } finally {
      setRequesting(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      await ConnectionService.acceptRequest(requestId);

      // Refresh session to get updated clinicId in JWT
      const session = await refreshSession();
      await setUser(session.user, session.accessToken, session.refreshToken);

      Alert.alert('Connected', 'Connection established successfully');
      loadData();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to accept';
      Alert.alert('Error', msg);
    }
  };

  const handleReject = (requestId: string) => {
    Alert.alert('Reject Request', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            await ConnectionService.rejectRequest(requestId);
            loadData();
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Failed to reject';
            Alert.alert('Error', msg);
          }
        },
      },
    ]);
  };

  const handleDisconnect = (memberId: string, memberName: string) => {
    Alert.alert('Disconnect', `Remove ${memberName} from your clinic?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          try {
            await ConnectionService.disconnectAssistant(memberId);
            Alert.alert('Done', `${memberName} has been disconnected`);
            loadData();
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Failed to disconnect';
            Alert.alert('Error', msg);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.white} barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Team Connection</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {isDoctor ? renderDoctorView() : renderAssistantView()}
      </ScrollView>
    </View>
  );

  function renderDoctorView() {
    return (
      <>
        {/* Doctor Code Card */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your Doctor Code</Text>
          <Text style={styles.codeValue}>{user?.doctorCode || '------'}</Text>
          <Text style={styles.codeHint}>Share this code with your assistant to connect</Text>
          <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
            <Ionicons name="copy-outline" size={18} color={COLORS.white} />
            <Text style={styles.copyButtonText}>Copy Code</Text>
          </TouchableOpacity>
        </View>

        {/* Invite by Phone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invite Assistant</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.inputFlex}
              value={invitePhone}
              onChangeText={setInvitePhone}
              placeholder="Assistant phone number"
              placeholderTextColor={COLORS.textLight}
              keyboardType="phone-pad"
              maxLength={10}
            />
            <TouchableOpacity
              style={[styles.sendButton, invitePhone.trim().length < 10 && styles.sendButtonDisabled]}
              onPress={handleInvite}
              disabled={inviting || invitePhone.trim().length < 10}
            >
              {inviting ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Ionicons name="send" size={18} color={COLORS.white} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Requests</Text>
            {pendingRequests.map(renderRequestCard)}
          </View>
        )}

        {/* Team Members */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Team</Text>
          {teamMembers.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="people-outline" size={40} color={COLORS.textLight} />
              <Text style={styles.emptyText}>No team members yet</Text>
              <Text style={styles.emptySubtext}>Invite an assistant using their phone number or share your code</Text>
            </View>
          ) : (
            teamMembers
              .filter((m) => m.id !== user?.id)
              .map(renderTeamMemberCard)
          )}
        </View>
      </>
    );
  }

  function renderAssistantView() {
    const connectedDoctor = teamMembers.find((m) => m.role === 'doctor');

    return (
      <>
        {/* Connection Status */}
        <View style={styles.statusCard}>
          <Ionicons
            name={connectedDoctor ? 'checkmark-circle' : 'alert-circle-outline'}
            size={40}
            color={connectedDoctor ? COLORS.success : COLORS.warning}
          />
          <Text style={styles.statusTitle}>
            {connectedDoctor ? 'Connected' : 'Not Connected'}
          </Text>
          <Text style={styles.statusSubtitle}>
            {connectedDoctor
              ? `Working with ${connectedDoctor.name}`
              : 'Enter a doctor code below to connect'}
          </Text>
        </View>

        {/* Join by Code */}
        {!connectedDoctor && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Join by Doctor Code</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.inputFlex, styles.codeInput]}
                value={doctorCode}
                onChangeText={(text) => setDoctorCode(text.toUpperCase())}
                placeholder="Enter 6-char code"
                placeholderTextColor={COLORS.textLight}
                autoCapitalize="characters"
                maxLength={6}
              />
              <TouchableOpacity
                style={[styles.sendButton, doctorCode.trim().length !== 6 && styles.sendButtonDisabled]}
                onPress={handleRequestToJoin}
                disabled={requesting || doctorCode.trim().length !== 6}
              >
                {requesting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.sendButtonText}>Join</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending</Text>
            {pendingRequests.map(renderRequestCard)}
          </View>
        )}
      </>
    );
  }

  function renderRequestCard(request: ConnectionRequest) {
    const isIncoming = isDoctor
      ? request.initiatedBy === 'assistant'
      : request.initiatedBy === 'doctor';
    const otherName = isDoctor ? request.assistantName : request.doctorName;

    return (
      <View key={request.id} style={styles.requestCard}>
        <View style={styles.requestInfo}>
          <View style={styles.requestBadge}>
            <Text style={styles.requestBadgeText}>
              {isIncoming ? 'Incoming' : 'Sent'}
            </Text>
          </View>
          <Text style={styles.requestName}>{otherName || 'Unknown'}</Text>
          {request.clinicName && (
            <Text style={styles.requestClinic}>{request.clinicName}</Text>
          )}
        </View>
        {isIncoming && (
          <View style={styles.requestActions}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleAccept(request.id)}
            >
              <Ionicons name="checkmark" size={20} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => handleReject(request.id)}
            >
              <Ionicons name="close" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        )}
        {!isIncoming && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>Waiting...</Text>
          </View>
        )}
      </View>
    );
  }

  function renderTeamMemberCard(member: TeamMember) {
    const isExpanded = expandedMemberId === member.id;
    const hasDetails = member.qualification || member.experienceYears || member.city || member.profileAddress || member.specialty || member.regNumber;

    return (
      <View key={member.id}>
        <TouchableOpacity
          style={[styles.memberCard, isExpanded && styles.memberCardExpanded]}
          onPress={() => setExpandedMemberId(isExpanded ? null : member.id)}
          activeOpacity={0.7}
        >
          <View style={styles.memberAvatar}>
            <Text style={styles.memberAvatarText}>
              {member.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{member.name}</Text>
            <Text style={styles.memberRole}>
              {member.role === 'doctor' ? 'Doctor' : 'Assistant'} · {member.phone}
            </Text>
          </View>
          {hasDetails && (
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={COLORS.textLight}
            />
          )}
          {isDoctor && member.role === 'assistant' && (
            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={() => handleDisconnect(member.id, member.name)}
            >
              <Ionicons name="remove-circle-outline" size={22} color={COLORS.error} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {isExpanded && hasDetails && (
          <View style={styles.memberDetails}>
            {member.role === 'assistant' && (
              <>
                {member.qualification ? (
                  <View style={styles.detailRow}>
                    <Ionicons name="school-outline" size={16} color={COLORS.textMuted} />
                    <Text style={styles.detailLabel}>Qualification:</Text>
                    <Text style={styles.detailValue}>{member.qualification}</Text>
                  </View>
                ) : null}
                {member.experienceYears ? (
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color={COLORS.textMuted} />
                    <Text style={styles.detailLabel}>Experience:</Text>
                    <Text style={styles.detailValue}>{member.experienceYears} years</Text>
                  </View>
                ) : null}
                {member.city ? (
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={16} color={COLORS.textMuted} />
                    <Text style={styles.detailLabel}>City:</Text>
                    <Text style={styles.detailValue}>{member.city}</Text>
                  </View>
                ) : null}
                {member.profileAddress ? (
                  <View style={styles.detailRow}>
                    <Ionicons name="home-outline" size={16} color={COLORS.textMuted} />
                    <Text style={styles.detailLabel}>Address:</Text>
                    <Text style={styles.detailValue}>{member.profileAddress}</Text>
                  </View>
                ) : null}
              </>
            )}
            {member.role === 'doctor' && (
              <>
                {member.specialty ? (
                  <View style={styles.detailRow}>
                    <Ionicons name="medkit-outline" size={16} color={COLORS.textMuted} />
                    <Text style={styles.detailLabel}>Specialty:</Text>
                    <Text style={styles.detailValue}>{member.specialty}</Text>
                  </View>
                ) : null}
                {member.regNumber ? (
                  <View style={styles.detailRow}>
                    <Ionicons name="document-text-outline" size={16} color={COLORS.textMuted} />
                    <Text style={styles.detailLabel}>Reg No:</Text>
                    <Text style={styles.detailValue}>{member.regNumber}</Text>
                  </View>
                ) : null}
              </>
            )}
            {member.lastActiveAt && (
              <View style={styles.detailRow}>
                <Ionicons name="pulse-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.detailLabel}>Last active:</Text>
                <Text style={styles.detailValue}>
                  {new Date(member.lastActiveAt).toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  backBtn: { padding: SPACING.xs },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSpacer: { width: 32 },
  scrollView: { flex: 1 },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },

  // Doctor Code Card
  codeCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.xxl,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.lg,
  },
  codeLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  codeValue: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 8,
    marginVertical: SPACING.md,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  codeHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: SPACING.lg,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: SPACING.sm,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },

  // Status Card (Assistant)
  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.xxl,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.md,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  statusSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },

  // Sections
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  // Input Row
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  inputFlex: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
  },
  codeInput: {
    letterSpacing: 4,
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 18,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Request Card
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  requestInfo: {
    flex: 1,
  },
  requestBadge: {
    backgroundColor: COLORS.primarySurface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
    marginBottom: SPACING.xs,
  },
  requestBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  requestName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  requestClinic: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  acceptButton: {
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.full,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.full,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingBadge: {
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.warning,
  },

  // Team Member Card
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  memberRole: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  memberCardExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
  },
  disconnectButton: {
    padding: SPACING.sm,
  },

  // Member Details (expanded)
  memberDetails: {
    backgroundColor: COLORS.surfaceSecondary,
    borderBottomLeftRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: COLORS.borderLight,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  detailValue: {
    fontSize: 13,
    color: COLORS.text,
    flex: 1,
  },

  // Empty State
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.xxl,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});
