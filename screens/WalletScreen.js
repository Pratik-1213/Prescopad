import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';

export default function WalletScreen() {
  const { walletBalance, setWalletBalance } = useContext(AppContext);

  const transactions = [
    { id: 1, title: 'Prescription Fee (RX-1001)', date: 'Today, 10:23 AM', amt: '-₹1', type: 'debit' },
    { id: 2, title: 'Wallet Recharge', date: 'Yesterday', amt: '+₹500', type: 'credit' },
    { id: 3, title: 'Prescription Fee (RX-0992)', date: '2 days ago', amt: '-₹1', type: 'debit' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.darkCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balance}>₹{walletBalance}</Text>
        <View style={styles.row}>
          <TouchableOpacity style={styles.wBtn} onPress={() => setWalletBalance(prev => prev + 100)}>
             <Text style={styles.wBtnText}>Recharge</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.wBtn, {backgroundColor:'rgba(255,255,255,0.1)'}]}>
             <Text style={[styles.wBtnText, {color:'#fff'}]}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.listHeader}>Recent Transactions</Text>
        {transactions.map((t) => (
            <View key={t.id} style={styles.tItem}>
                <View style={[styles.iconBox, { backgroundColor: t.type === 'credit' ? '#DCFCE7' : '#F1F5F9' }]}>
                    <Ionicons 
                      name={t.type === 'credit' ? "arrow-up" : "document-text-outline"} 
                      size={20} 
                      color={t.type === 'credit' ? '#166534' : '#64748B'} 
                    />
                </View>
                <View style={{flex:1}}>
                    <Text style={styles.tTitle}>{t.title}</Text>
                    <Text style={styles.tDate}>{t.date}</Text>
                </View>
                <Text style={[styles.tAmt, {color: t.type === 'credit' ? '#16A34A' : '#0F172A'}]}>{t.amt}</Text>
            </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20 },
  darkCard: { backgroundColor: '#0F172A', padding: 24, borderRadius: 20, marginBottom: 24 },
  balanceLabel: { color: '#94A3B8', fontSize: 14 },
  balance: { color: '#fff', fontSize: 40, fontWeight: 'bold', marginVertical: 10 },
  row: { flexDirection: 'row', gap: 12 },
  wBtn: { flex: 1, backgroundColor: '#fff', padding: 12, borderRadius: 8, alignItems: 'center' },
  wBtnText: { fontWeight: '600', color: '#0F172A' },
  listContainer: { flex: 1 },
  listHeader: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 16 },
  tItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, alignItems: 'center' },
  iconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  tTitle: { fontSize: 14, fontWeight: '600', color: '#334155' },
  tDate: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  tAmt: { fontSize: 16, fontWeight: 'bold' }
});