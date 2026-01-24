import React, { useEffect } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    // Simulate loading time then finish
    const timer = setTimeout(() => {
      onFinish();
    }, 2500); // 2.5 seconds
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* If you have the image in assets, uncomment below line */}
     <Image source={require('../assets/prescopad.png')} style={styles.logo} resizeMode="contain" />
      
      {/* Fallback Text Logo if image missing */}
      <View style={styles.logoPlaceholder}>
        <Text style={styles.logoText}>P</Text>
      </View>
      
      <Text style={styles.appName}>PrescoPad</Text>
      <Text style={styles.tagline}>Digital Clinic for Modern Doctors</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0077B6', alignItems: 'center', justifyContent: 'center' },
  logoPlaceholder: { width: 100, height: 100, backgroundColor: '#fff', borderRadius: 20, alignItems:'center', justifyContent:'center', marginBottom: 20 },
  logoText: { fontSize: 50, fontWeight:'bold', color:'#0077B6' },
  logo: { width: 150, height: 150, marginBottom: 20 },
  appName: { fontSize: 32, fontWeight: 'bold', color: '#fff', letterSpacing: 1 },
  tagline: { color: '#E0F2FE', marginTop: 8, fontSize: 14 }
});