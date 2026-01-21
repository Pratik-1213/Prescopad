import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';

export default function AuthScreen({ navigation }) {
  const [step, setStep] = useState(1); 
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const { setUserRole } = useContext(AppContext);

  const handleRoleSelect = (role) => {
    setUserRole(role);
    setStep(2);
  };

  const handleSendOtp = () => {
    if (mobile === '9876543210') {
      setStep(3);
    } else {
      Alert.alert("Error", "Unregistered number. Use 9876543210 for demo.");
    }
  };

  const handleLogin = () => {
    if (otp === '1234') {
      navigation.replace('Home');
    } else {
      Alert.alert("Error", "Invalid OTP. Use 1234.");
    }
  };

  if (step === 1) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Who are you?</Text>
          <Text style={styles.subtitle}>Select your role to configure your dashboard.</Text>
        </View>
        <TouchableOpacity style={styles.card} onPress={() => handleRoleSelect('DOCTOR')}>
          <View style={styles.iconCircle}>
            <Ionicons name="medkit-outline" size={28} color="#0077B6" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>I'm a Doctor</Text>
            <Text style={styles.cardDesc}>Create prescriptions & manage patients.</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => handleRoleSelect('NURSE')}>
          <View style={styles.iconCircle}>
            <Ionicons name="clipboard-outline" size={28} color="#0077B6" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>I'm a Nurse</Text>
            <Text style={styles.cardDesc}>Vitals & queue management.</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <View style={[styles.iconCircle, { width: 60, height: 60, backgroundColor: '#E0F7FA' }]}>
           <Ionicons name="link-outline" size={32} color="#0077B6" />
        </View>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Enter 9876543210 to login.</Text>
      </View>

      {step === 2 ? (
        <>
           <Text style={styles.label}>Mobile Number</Text>
           <TextInput 
             style={styles.input} 
             placeholder="98765 43210" 
             keyboardType="phone-pad"
             value={mobile}
             onChangeText={setMobile}
           />
           <TouchableOpacity style={styles.btnPrimary} onPress={handleSendOtp}>
             <Text style={styles.btnText}>Send OTP</Text>
             <Ionicons name="arrow-forward" size={20} color="#fff" />
           </TouchableOpacity>
        </>
      ) : (
        <>
           <Text style={{textAlign:'center', color:'#666', marginBottom:20}}>Code sent to +91 {mobile}</Text>
           <TextInput 
             style={[styles.input, { textAlign: 'center', letterSpacing: 8, fontSize: 24 }]} 
             placeholder="1234" 
             keyboardType="number-pad"
             maxLength={4}
             value={otp}
             onChangeText={setOtp}
           />
           <Text style={{textAlign:'center', color:'#94A3B8', marginBottom: 20}}>Use mock OTP: 1234</Text>
           <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin}>
             <Text style={styles.btnText}>Verify & Login</Text>
             <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
           </TouchableOpacity>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'center' },
  header: { marginBottom: 30, alignItems:'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 22 },
  card: { flexDirection: 'row', backgroundColor: '#F8FAFC', padding: 20, borderRadius: 16, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: '#EEF2F6' },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E0F7FA', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4, color: '#0F172A' },
  cardDesc: { fontSize: 13, color: '#64748B' },
  input: { height: 56, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, fontSize: 16, marginBottom: 20, backgroundColor: '#F8FAFC' },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  btnPrimary: { height: 56, backgroundColor: '#0077B6', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});