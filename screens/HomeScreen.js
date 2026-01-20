import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, FlatList, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // FIX: Use correct SafeArea
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';

export default function HomeScreen({ navigation }) {
  const { walletBalance, prescriptions } = useContext(AppContext);

  const renderRecentItem = ({ item }) => (
    <TouchableOpacity style={styles.rxCard} onPress={() => navigation.navigate('PreviewPdf', { data: item })}>
      <View>
        <Text style={styles.rxName}>{item.name}</Text>
        <Text style={styles.rxDetails}>{item.diagnosis} • {item.date}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, Dr. A. Sharma</Text>
          <Text style={styles.clinicName}>City Care Clinic</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Settings')}>
          <Text style={{color:'#0077B6', fontWeight:'bold'}}>AS</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}> 
        {/* Main Action Card */}
        <View style={styles.blueCard}>
          <Text style={styles.blueCardTitle}>Start New Prescription</Text>
          <Text style={styles.blueCardDesc}>Create a digital prescription in less than 60 seconds.</Text>
          <TouchableOpacity 
            style={styles.whiteBtn} 
            onPress={() => navigation.navigate('CreateRx')}
          >
            <Ionicons name="add" size={20} color="#0077B6" />
            <Text style={styles.whiteBtnText}>Create Now</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="people-outline" size={20} color="#64748B" />
            <Text style={styles.statLabel}>Patients Today</Text>
            <Text style={styles.statValue}>12</Text>
          </View>
          <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Wallet')}>
            <Ionicons name="wallet-outline" size={20} color="#64748B" />
            <Text style={styles.statLabel}>Balance</Text>
            <Text style={styles.statValue}>₹{walletBalance}</Text>
          </TouchableOpacity>
        </View>

        {/* Recent List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Prescriptions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('PatientList')}>
            <Text style={styles.linkText}>View All</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={prescriptions}
          renderItem={renderRecentItem}
          keyExtractor={item => item.id}
          scrollEnabled={false}
        />
      </ScrollView>
      
      {/* Bottom Nav Simulation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
           <Ionicons name="home" size={24} color="#0077B6" />
           <Text style={[styles.navText, {color:'#0077B6'}]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CreateRx')}>
           <Ionicons name="add-circle-outline" size={24} color="#94A3B8" />
           <Text style={styles.navText}>New Rx</Text>
        </TouchableOpacity>
         <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Wallet')}>
           <Ionicons name="wallet-outline" size={24} color="#94A3B8" />
           <Text style={styles.navText}>Wallet</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' },
  greeting: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  clinicName: { color: '#64748B' },
  profileBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0F7FA', alignItems: 'center', justifyContent: 'center' },
  
  blueCard: { backgroundColor: '#0077B6', margin: 20, padding: 24, borderRadius: 20 },
  blueCardTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  blueCardDesc: { color: '#E0F2FE', marginBottom: 20, lineHeight: 20 },
  whiteBtn: { backgroundColor: '#fff', flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, alignSelf: 'flex-start', alignItems:'center', gap: 8 },
  whiteBtnText: { color: '#0077B6', fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 16, paddingHorizontal: 20, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  statLabel: { color: '#64748B', marginTop: 8, fontSize: 13 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#0F172A', marginTop: 4 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12, alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  linkText: { color: '#0077B6', fontWeight: '600' },

  rxCard: { backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, marginHorizontal: 20, marginBottom: 10, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  rxName: { fontSize: 16, fontWeight: '600', color: '#0F172A', marginBottom: 4 },
  rxDetails: { fontSize: 13, color: '#64748B' },

  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', elevation: 10 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navText: { fontSize: 11, marginTop: 4, color: '#94A3B8' }
});