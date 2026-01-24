import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Simulated Database of Medicines
const MEDICINE_DB = [
  { id: 1, name: 'Augmentin 625', type: 'Tablet' },
  { id: 2, name: 'Azithromycin 500', type: 'Tablet' },
  { id: 3, name: 'Paracetamol 650', type: 'Tablet' },
  { id: 4, name: 'Pantop 40', type: 'Capsule' },
  { id: 5, name: 'Ascoril LS', type: 'Syrup' },
  { id: 6, name: 'Cetirizine 10mg', type: 'Tablet' },
  { id: 7, name: 'Amoxyclav', type: 'Tablet' },
  { id: 8, name: 'Ibuprofen 400', type: 'Tablet' },
];

export default function CreateRxScreen({ navigation }) {
  const [formData, setFormData] = useState({
    name: '', age: '', weight: '', phone: '', diagnosis: '',
    medicines: [] 
  });

  // Modal State
  const [isModalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMed, setSelectedMed] = useState(null);
  const [dosage, setDosage] = useState('');
  const [duration, setDuration] = useState('');

  // Add Medicine Logic
  const handleAddMedicine = () => {
    if (selectedMed && dosage) {
      const newMed = {
        id: Date.now(), // Unique ID for list
        name: selectedMed.name,
        type: selectedMed.type,
        dosage: dosage,
        duration: duration || '3 days'
      };
      setFormData({ ...formData, medicines: [...formData.medicines, newMed] });
      // Reset Modal
      setModalVisible(false);
      setSelectedMed(null);
      setDosage('');
      setDuration('');
      setSearchQuery('');
    }
  };

  const removeMedicine = (id) => {
    setFormData({
      ...formData,
      medicines: formData.medicines.filter((m) => m.id !== id)
    });
  };

  const handlePreview = () => {
    const mockData = {
      ...formData,
      date: new Date().toISOString().split('T')[0],
      id: 'RX-' + Math.floor(Math.random() * 10000)
    };
    navigation.navigate('PreviewPdf', { data: mockData });
  };

  // Filter medicines based on search
  const filteredMeds = MEDICINE_DB.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Section 1: Patient Details */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>PATIENT DETAILS</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Patient Name (e.g. Rahul Verma)" 
            value={formData.name}
            onChangeText={(t) => setFormData({...formData, name: t})}
          />
          <TextInput 
            style={styles.input} 
            placeholder="Mobile Number (e.g. 9876543210)" 
            keyboardType="phone-pad"
            maxLength={10}
            value={formData.phone}
            onChangeText={(t) => setFormData({...formData, phone: t})}
          />
          <View style={styles.row}>
            <TextInput 
              style={[styles.input, {flex: 1}]} 
              placeholder="Age (Yrs)" 
              keyboardType="numeric" 
              value={formData.age}
              onChangeText={(t) => setFormData({...formData, age: t})}
            />
            <TextInput 
              style={[styles.input, {flex: 1}]} 
              placeholder="Weight (kg)" 
              keyboardType="numeric"
              value={formData.weight}
              onChangeText={(t) => setFormData({...formData, weight: t})}
            />
          </View>
        </View>

        {/* Section 2: Clinical */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>CLINICAL NOTES</Text>
          <TextInput 
            style={[styles.input, {height: 80, textAlignVertical: 'top'}]} 
            placeholder="Diagnosis (e.g. Acute Bronchitis)" 
            multiline
            value={formData.diagnosis}
            onChangeText={(t) => setFormData({...formData, diagnosis: t})}
          />
        </View>

        {/* Section 3: Medicines */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>MEDICINES</Text>
          
          {/* List of Added Medicines */}
          {formData.medicines.map((med, index) => (
            <View key={med.id} style={styles.medCard}>
              <View style={{flex: 1}}>
                <Text style={styles.medName}>{index + 1}. {med.name} ({med.type})</Text>
                <Text style={styles.medDose}>{med.dosage} • {med.duration}</Text>
              </View>
              <TouchableOpacity onPress={() => removeMedicine(med.id)}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="add-circle" size={24} color="#0077B6" />
            <Text style={styles.addBtnText}>Add Medicine</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handlePreview}>
          <Text style={styles.primaryBtnText}>Preview & Share</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* --- Medicine Selection Modal --- */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Medicine</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Step 1: Select Medicine */}
            {!selectedMed ? (
              <>
                <TextInput 
                  style={styles.searchInput}
                  placeholder="Search medicine..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
                <FlatList 
                  data={filteredMeds}
                  keyExtractor={item => item.id.toString()}
                  renderItem={({item}) => (
                    <TouchableOpacity style={styles.medItem} onPress={() => setSelectedMed(item)}>
                      <Ionicons name="medkit-outline" size={20} color="#64748B" />
                      <Text style={styles.medItemName}>{item.name}</Text>
                      <Text style={styles.medItemType}>{item.type}</Text>
                    </TouchableOpacity>
                  )}
                />
              </>
            ) : (
              /* Step 2: Enter Dosage */
              <View>
                <Text style={styles.selectedLabel}>Selected: <Text style={{fontWeight:'bold', color:'#0077B6'}}>{selectedMed.name}</Text></Text>
                
                <Text style={styles.label}>Dosage (Frequency)</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="e.g. 1-0-1 (After Food)" 
                  value={dosage}
                  onChangeText={setDosage}
                />

                <Text style={styles.label}>Duration</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="e.g. 5 Days" 
                  value={duration}
                  onChangeText={setDuration}
                />

                <TouchableOpacity style={styles.primaryBtn} onPress={handleAddMedicine}>
                  <Text style={styles.primaryBtnText}>Save Medicine</Text>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => setSelectedMed(null)} style={{marginTop: 15, alignSelf:'center'}}>
                   <Text style={{color:'#64748B'}}>Change Medicine</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  scrollContent: { padding: 20 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionHeader: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 12, letterSpacing: 0.5 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12 },
  
  // Medicine List Styles
  medCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9FF', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#BAE6FD' },
  medName: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  medDose: { fontSize: 13, color: '#0369A1' },
  
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, marginTop: 8 },
  addBtnText: { color: '#0077B6', fontWeight: '600', marginLeft: 8, fontSize: 16 },

  footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#E2E8F0' },
  primaryBtn: { backgroundColor: '#0077B6', height: 50, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  searchInput: { backgroundColor: '#F1F5F9', padding: 14, borderRadius: 10, marginBottom: 16, fontSize: 16 },
  medItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  medItemName: { flex: 1, fontSize: 16, marginLeft: 12, color: '#334155' },
  medItemType: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  selectedLabel: { fontSize: 16, marginBottom: 16, color: '#334155' },
  label: { fontSize: 12, color: '#64748B', marginBottom: 4, fontWeight:'600' }
});