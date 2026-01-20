import React, { useContext, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function PreviewPdfScreen({ route, navigation }) {
  const { data } = route.params || {};
  const { addPrescription } = useContext(AppContext);
  const [isSharing, setIsSharing] = useState(false);

  // --- 1. HTML Generator for PDF ---
  const generateHtml = () => {
    const medsRows = data.medicines.map((m, i) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 8px;">${i + 1}. ${m.name} <span style="font-size: 12px; color: #666;">(${m.type})</span></td>
        <td style="padding: 8px; text-align: right;">${m.dosage} | ${m.duration}</td>
      </tr>
    `).join('');

    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #0077B6; padding-bottom: 20px; }
            .clinic-name { font-size: 28px; font-weight: bold; color: #0077B6; }
            .doc-details { font-size: 14px; color: #555; margin-top: 5px; }
            .meta { text-align: right; }
            .label { font-size: 12px; font-weight: bold; color: #888; text-transform: uppercase; }
            .section { margin-top: 30px; }
            .section-title { font-size: 14px; font-weight: bold; color: #0077B6; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
            .info-grid { display: flex; justify-content: space-between; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; }
            .footer { margin-top: 50px; text-align: right; }
            .sig-line { display: inline-block; border-top: 1px solid #333; width: 200px; padding-top: 10px; text-align: center; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="clinic-name">City Care Clinic</div>
              <div class="doc-details">Dr. A. Sharma<br>MBBS, MD (General Medicine)</div>
            </div>
            <div class="meta">
              <div><span class="label">Date:</span> ${data.date}</div>
              <div style="margin-top:5px;"><span class="label">RX ID:</span> ${data.id}</div>
            </div>
          </div>
          <div class="section">
            <div class="section-title">PATIENT DETAILS</div>
            <div class="info-grid">
              <div><strong>Name:</strong> ${data.name}</div>
              <div><strong>Age/Sex:</strong> ${data.age} / Male</div>
            </div>
            <div class="info-grid">
              <div><strong>Phone:</strong> ${data.phone || 'N/A'}</div>
              <div><strong>Weight:</strong> ${data.weight} kg</div>
            </div>
          </div>
          <div class="section">
            <div class="section-title">DIAGNOSIS</div>
            <p>${data.diagnosis}</p>
          </div>
          <div class="section">
            <div class="section-title">MEDICINES</div>
            <table>${medsRows}</table>
          </div>
          <div class="footer">
            <div class="sig-line">Dr. A. Sharma</div>
          </div>
        </body>
      </html>
    `;
  };

  // --- 2. Share as PDF ---
  const sharePdf = async () => {
    try {
      setIsSharing(true);
      const { uri } = await Print.printToFileAsync({ html: generateHtml() });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Share Prescription PDF' });
    } catch (error) {
      Alert.alert("Error", "Could not generate PDF.");
    } finally {
      setIsSharing(false);
    }
  };

  // --- 3. Share as Text ---
  const shareText = async () => {
    const medsList = data.medicines.map((m, i) => `${i+1}. ${m.name} - ${m.dosage} (${m.duration})`).join('\n');
    const message = `*PRESCRIPTION - City Care Clinic*\n\n*Dr. A. Sharma*\n*Patient:* ${data.name}\n*Diagnosis:* ${data.diagnosis}\n\n*Medicines:*\n${medsList}\n\n_Get well soon!_`;

    let url = data.phone 
      ? `whatsapp://send?phone=91${data.phone}&text=${encodeURIComponent(message)}`
      : `whatsapp://send?text=${encodeURIComponent(message)}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert("Error", "WhatsApp not installed.");
    } catch (err) {
      Alert.alert("Error", "Could not open WhatsApp.");
    }
  };

  // --- 4. Main Share Handler (The Choice) ---
  const handleShareButton = () => {
    Alert.alert(
      "Share Prescription",
      "How would you like to send this prescription?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Send as Text", onPress: shareText },
        { text: "Share PDF", onPress: sharePdf },
      ]
    );
  };

  // --- 5. Final Issue Handler ---
  const handleIssue = () => {
    addPrescription({
      id: data.id,
      name: data.name || 'Unknown',
      diagnosis: data.diagnosis || 'General Checkup',
      date: data.date
    });
    navigation.replace('RxSuccess', { rxId: data.id });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#E2E8F0' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {/* Paper UI */}
        <View style={styles.paper}>
          <View style={styles.header}>
            <View>
              <Text style={styles.clinicTitle}>City Care Clinic</Text>
              <Text style={styles.docName}>Dr. A. Sharma</Text>
              <Text style={styles.degrees}>MBBS, MD (General Medicine)</Text>
            </View>
            <View style={{alignItems:'flex-end'}}>
               <Text style={styles.metaLabel}>DATE: {data?.date}</Text>
               <Text style={styles.metaLabel}>RX ID: {data?.id}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.patientRow}>
            <View style={{flex:1}}>
                <Text style={styles.ptText}><Text style={styles.bold}>Name:</Text> {data?.name || '--'}</Text>
                <Text style={styles.ptText}><Text style={styles.bold}>Phone:</Text> {data?.phone || 'Not Provided'}</Text>
            </View>
            <View style={{alignItems:'flex-end'}}>
                <Text style={styles.ptText}><Text style={styles.bold}>Age/Sex:</Text> {data?.age} / Male</Text>
                <Text style={styles.ptText}><Text style={styles.bold}>Weight:</Text> {data?.weight} kg</Text>
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.label}>DIAGNOSIS</Text>
            <Text style={styles.value}>{data?.diagnosis || '--'}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.label}>RX (MEDICINES)</Text>
            {data.medicines && data.medicines.length > 0 ? (
                data.medicines.map((med, index) => (
                    <View key={index} style={styles.medItem}>
                        <Text style={styles.medName}>{index + 1}. {med.name} <Text style={{fontSize:12, fontWeight:'normal'}}>({med.type})</Text></Text>
                        <Text style={styles.medDose}>{med.dosage} | {med.duration}</Text>
                    </View>
                ))
            ) : (
                <Text style={{color:'#94A3B8', fontStyle:'italic'}}>No medicines prescribed.</Text>
            )}
          </View>
          <View style={styles.sigContainer}>
             <Text style={styles.docSig}>Dr. Sharma</Text>
             <View style={styles.line} />
             <Text style={styles.sigLabel}>Signature</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.fabContainer}>
         <TouchableOpacity 
           style={[styles.fab, {backgroundColor: '#25D366'}]} 
           onPress={handleShareButton}
           disabled={isSharing}
         >
            {isSharing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="logo-whatsapp" size={24} color="#fff" />
            )}
         </TouchableOpacity>
         
         <TouchableOpacity style={[styles.fab, {backgroundColor: '#0077B6', flex: 1}]} onPress={handleIssue}>
            <Ionicons name="print-outline" size={24} color="#fff" />
            <Text style={styles.fabText}>Issue & Print</Text>
         </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  paper: { backgroundColor: '#fff', borderRadius: 8, padding: 24, minHeight: 500, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  clinicTitle: { fontSize: 20, fontWeight: 'bold', color: '#0077B6' },
  docName: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  degrees: { fontSize: 12, color: '#64748B' },
  metaLabel: { fontSize: 12, color: '#94A3B8', fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 16 },
  patientRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 6 },
  ptText: { fontSize: 14, color: '#334155', marginBottom: 4 },
  bold: { fontWeight: '700' },
  section: { marginTop: 24 },
  label: { fontSize: 11, fontWeight: 'bold', color: '#94A3B8', marginBottom: 8, letterSpacing: 1 },
  value: { fontSize: 16, color: '#0F172A' },
  medItem: { marginBottom: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 8 },
  medName: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  medDose: { fontSize: 14, color: '#64748B', marginTop: 2 },
  sigContainer: { marginTop: 60, alignSelf: 'flex-end', alignItems: 'center', width: 120 },
  docSig: { fontSize: 18, fontFamily: 'serif', color: '#0077B6', marginBottom: 4 },
  line: { height: 1, backgroundColor: '#CBD5E1', width: '100%' },
  sigLabel: { fontSize: 10, color: '#94A3B8', marginTop: 4 },
  fabContainer: { position: 'absolute', bottom: 30, right: 20, left: 20, flexDirection: 'row', gap: 12 },
  fab: { borderRadius: 30, height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 5, gap: 10, paddingHorizontal: 20 },
  fabText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});