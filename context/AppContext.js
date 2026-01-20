import React, { createContext, useState } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(null); 
  const [walletBalance, setWalletBalance] = useState(2648);
  
  // Initial dummy data with UNIQUE IDs
  const [prescriptions, setPrescriptions] = useState([
    { id: 'RX-1001', name: 'Rahul Verma', diagnosis: 'Acute Bronchitis', date: '2026-01-13' },
    { id: 'RX-0992', name: 'Priya Singh', diagnosis: 'Migraine', date: '2026-01-12' },
  ]);

  const addPrescription = (rx) => {
    // Generate a truly unique ID using timestamp
    const newRx = { ...rx, id: `RX-${Date.now().toString().slice(-6)}` };
    
    setWalletBalance(prev => prev - 1); 
    setPrescriptions(prev => [newRx, ...prev]);
  };

  return (
    <AppContext.Provider value={{ 
      userRole, setUserRole, 
      walletBalance, setWalletBalance, 
      prescriptions, addPrescription 
    }}>
      {children}
    </AppContext.Provider>
  );
};