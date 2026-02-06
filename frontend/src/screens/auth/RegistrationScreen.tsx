import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { completeRegistration } from '../../services/authService';
import { useAuthStore } from '../../store/useAuthStore';
import { AuthStackParamList } from '../../types/navigation.types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Registration'>;

export default function RegistrationScreen({ route }: Props): React.JSX.Element {
  const { role } = route.params;
  const isDoctor = role === 'doctor';
  const setUser = useAuthStore((s) => s.setUser);

  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = name.trim().length >= 2 && (!isDoctor || clinicName.trim().length >= 2);

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsLoading(true);
    try {
      const data: { name: string; specialty?: string; regNumber?: string; clinicName?: string } = {
        name: name.trim(),
      };

      if (isDoctor) {
        if (specialty.trim()) data.specialty = specialty.trim();
        if (regNumber.trim()) data.regNumber = regNumber.trim();
        data.clinicName = clinicName.trim();
      }

      const response = await completeRegistration(data);
      await setUser(response.user, response.accessToken, response.refreshToken);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Registration failed';
      Alert.alert('Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar backgroundColor={COLORS.white} barStyle="dark-content" />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Ionicons
            name={isDoctor ? 'medkit' : 'people'}
            size={48}
            color={COLORS.primary}
          />
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            {isDoctor
              ? 'Set up your doctor profile and clinic to get started'
              : 'Tell us your name to get started'}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={isDoctor ? 'Dr. John Smith' : 'Your full name'}
              placeholderTextColor={COLORS.textLight}
              autoFocus
            />
          </View>

          {isDoctor && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Specialty</Text>
                <TextInput
                  style={styles.input}
                  value={specialty}
                  onChangeText={setSpecialty}
                  placeholder="e.g. General Physician, Pediatrician"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Registration Number</Text>
                <TextInput
                  style={styles.input}
                  value={regNumber}
                  onChangeText={setRegNumber}
                  placeholder="Medical council registration number"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Clinic Name *</Text>
                <TextInput
                  style={styles.input}
                  value={clinicName}
                  onChangeText={setClinicName}
                  placeholder="Your clinic or hospital name"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>
            </>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, !canSubmit && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>Get Started</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xxl,
    paddingTop: 80,
    paddingBottom: SPACING.xxxl,
  },
  header: {
    marginBottom: SPACING.xxxl,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 22,
  },
  form: {
    marginBottom: SPACING.xxl,
  },
  inputGroup: {
    marginBottom: SPACING.xl,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surfaceSecondary,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});
