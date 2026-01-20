import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const options = [
    { icon: 'business-outline', label: 'Clinic Details' },
    { icon: 'person-outline', label: 'Personal Info' },
    { icon: 'print-outline', label: 'Prescription Layout' },
    { icon: 'help-circle-outline', label: 'Help & Support' },
  ];

  return (
    <View style={styles.container}>
       <View style={styles.profileHeader}>
          <View style={styles.avatar}><Text style={styles.avatarText}>DA</Text></View>
          <View>
            <Text style={styles.name}>Dr. A. Sharma</Text>
            <Text style={styles.role}>Chief Physician</Text>
          </View>
       </View>

       <View style={styles.section}>
         {options.map((opt, index) => (
           <TouchableOpacity key={index} style={styles.row}>
             <Ionicons name={opt.icon} size={22} color="#475569" />
             <Text style={styles.label}>{opt.label}</Text>
             <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
           </TouchableOpacity>
         ))}
       </View>
       
       <TouchableOpacity style={styles.logoutBtn}>
         <Text style={styles.logoutText}>Log Out</Text>
       </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9', padding: 20 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, backgroundColor: '#fff', padding: 20, borderRadius: 16 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#E0F7FA', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#0077B6' },
  name: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  role: { color: '#64748B' },
  section: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', padding: 16, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  label: { flex: 1, marginLeft: 16, fontSize: 16, color: '#334155' },
  logoutBtn: { marginTop: 30, backgroundColor: '#FEE2E2', padding: 16, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: '#DC2626', fontWeight: 'bold', fontSize: 16 }
});