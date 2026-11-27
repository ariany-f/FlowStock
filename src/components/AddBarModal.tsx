import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

interface AddBarModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddBarModal: React.FC<AddBarModalProps> = ({ visible, onClose }) => {
  const { addBar, currentUser, isDarkMode } = useApp();

  const [name, setName] = useState('');
  const [tradingName, setTradingName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('São Paulo');
  const [state, setState] = useState('SP');
  const [zipCode, setZipCode] = useState('');
  const [phone, setPhone] = useState(currentUser?.phone || '');

  const handleSave = () => {
    if (!name.trim() || !cnpj.trim() || !street.trim() || !number.trim()) {
      Alert.alert('Campos obrigatórios', 'Por favor, preencha o Nome do Bar, CNPJ, Rua e Número.');
      return;
    }

    addBar({
      ownerId: currentUser?.id || 'owner_guest',
      name: name.trim(),
      tradingName: tradingName.trim() || name.trim(),
      cnpj: cnpj.trim(),
      street: street.trim(),
      number: number.trim(),
      neighborhood: neighborhood.trim() || 'Centro',
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim() || '01000-000',
      phone: phone.trim(),
      status: 'active',
      creditLimit: 10000.00,
      creditUsed: 0.00,
      monthlyAverageConsumption: 5000.00,
    });

    Alert.alert('Sucesso!', `O estabelecimento "${name}" foi cadastrado com sucesso.`);
    setName('');
    setTradingName('');
    setCnpj('');
    setStreet('');
    setNumber('');
    setNeighborhood('');
    setZipCode('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <SafeAreaView 
          style={styles.modalContent}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Novo Bar / Estabelecimento</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={isDarkMode ? "#FFFFFF" : "#0D1C28"} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Identificação Empresarial</Text>
            
            <Text style={styles.label}>Nome Fantasia do Bar / Filial *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Bar do Urso - Filial Jardins"
              placeholderTextColor="#64748B"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Razão Social</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Cervejaria e Lanchonete Urso Ltda"
              placeholderTextColor="#64748B"
              value={tradingName}
              onChangeText={setTradingName}
            />

            <Text style={styles.label}>CNPJ do Estabelecimento *</Text>
            <TextInput
              style={styles.input}
              placeholder="00.000.000/0001-00"
              placeholderTextColor="#64748B"
              value={cnpj}
              onChangeText={setCnpj}
              keyboardType="numeric"
            />

            <Text style={styles.sectionTitle}>Endereço de Descarga de Carga</Text>

            <View style={styles.row}>
              <View style={{ flex: 3 }}>
                <Text style={styles.label}>Rua / Avenida *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Rua Augusta"
                  placeholderTextColor="#64748B"
                  value={street}
                  onChangeText={setStreet}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.label}>Número *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1234"
                  placeholderTextColor="#64748B"
                  value={number}
                  onChangeText={setNumber}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 2 }}>
                <Text style={styles.label}>Bairro</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Consolação"
                  placeholderTextColor="#64748B"
                  value={neighborhood}
                  onChangeText={setNeighborhood}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.label}>CEP</Text>
                <TextInput
                  style={styles.input}
                  placeholder="01305-000"
                  placeholderTextColor="#64748B"
                  value={zipCode}
                  onChangeText={setZipCode}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 2 }}>
                <Text style={styles.label}>Cidade</Text>
                <TextInput
                  style={styles.input}
                  placeholder="São Paulo"
                  placeholderTextColor="#64748B"
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.label}>UF</Text>
                <TextInput
                  style={styles.input}
                  placeholder="SP"
                  placeholderTextColor="#64748B"
                  value={state}
                  onChangeText={setState}
                  maxLength={2}
                />
              </View>
            </View>

            <Text style={styles.label}>Telefone / WhatsApp do Bar</Text>
            <TextInput
              style={styles.input}
              placeholder="(11) 90000-0000"
              placeholderTextColor="#64748B"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>Salvar e Selecionar Bar</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0D1C28',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#1E3042',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#162737',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFC107',
    marginTop: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8FA0AF',
    marginBottom: 4,
    marginTop: 6,
  },
  input: {
    backgroundColor: '#162737',
    borderWidth: 1,
    borderColor: '#1E3042',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
  },
  saveBtn: {
    backgroundColor: '#FFC107',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: {
    color: '#0D1C28',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
