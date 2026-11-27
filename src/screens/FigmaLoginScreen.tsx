import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { MfaChannel } from '../types';

interface FigmaLoginScreenProps {
  onLoginSuccess: () => void;
  onBack: () => void;
}

type AuthMode = 'login' | 'signup' | 'mfa';
type LoginMethod = 'email' | 'phone';
type SignupStep = 1 | 2 | 3;

export const FigmaLoginScreen: React.FC<FigmaLoginScreenProps> = ({
  onLoginSuccess,
  onBack,
}) => {
  const { 
    login, 
    registerBarAndOwner, 
    requestMfaCode, 
    verifyMfaCode, 
    activeMfaSession, 
    cancelMfa 
  } = useApp();

  const [mode, setMode] = useState<AuthMode>('login');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [signupStep, setSignupStep] = useState<SignupStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form de Login via E-mail
  const [loginIdentifier, setLoginIdentifier] = useState('carlos.mendes@botecodochico.com.br');
  const [loginPassword, setLoginPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);

  // Form de Login via Telefone (para o Bar)
  const [phoneInput, setPhoneInput] = useState('(11) 98765-4321');
  const [phoneChannel, setPhoneChannel] = useState<MfaChannel>('whatsapp');

  // Estado da Tela de MFA (Autenticação em 2 Etapas)
  const [mfaCodeInput, setMfaCodeInput] = useState('');
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [rememberDevice, setRememberDevice] = useState(true);
  const canResend = resendCooldown === 0;

  // Form de Cadastro em Passos
  // Passo 1: Responsável
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Passo 2: Dados da Empresa / CNPJ
  const [cnpj, setCnpj] = useState('');
  const [tradingName, setTradingName] = useState('');
  const [barName, setBarName] = useState('');
  const [stateRegistration, setStateRegistration] = useState('Isento');
  const [category, setCategory] = useState<'boteco' | 'choperia' | 'restaurante' | 'balada'>('boteco');
  const [simulatedSerasaStatus, setSimulatedSerasaStatus] = useState<'approved' | 'restricted'>('approved');

  // Passo 3: Endereço do Bar
  const [zipCode, setZipCode] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('São Paulo');
  const [state, setState] = useState('SP');

  // Countdown do Reenvio de MFA
  useEffect(() => {
    let timer: any;
    if (mode === 'mfa' && resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [mode, resendCooldown]);

  // Máscara brasileira de Telefone: (11) 98765-4321 ou (11) 3222-9000
  const formatPhone = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 11);
    let formatted = digits;
    if (digits.length > 10) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    } else if (digits.length > 6) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    } else if (digits.length > 2) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }
    return formatted;
  };

  // Máscara simples de CNPJ (00.000.000/0001-00)
  const formatCnpj = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 14);
    let formatted = digits;
    if (digits.length > 12) {
      formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
    } else if (digits.length > 8) {
      formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    } else if (digits.length > 5) {
      formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}.${digits.slice(2)}`;
    }
    setCnpj(formatted);
  };

  // Preenchimento de CEP simulado
  const handleCepSearch = (cepVal: string) => {
    const cleanCep = cepVal.replace(/\D/g, '');
    setZipCode(cleanCep);
    if (cleanCep.length === 8) {
      if (cleanCep === '05435001') {
        setStreet('Rua Aspicuelta');
        setNeighborhood('Vila Madalena');
        setCity('São Paulo');
        setState('SP');
      } else if (cleanCep === '08710220') {
        setStreet('Av. Vereador Narciso Yague Guimarães');
        setNeighborhood('Centro Cívico');
        setCity('Mogi das Cruzes');
        setState('SP');
      } else if (cleanCep === '04531012') {
        setStreet('Rua Pedroso Alvarenga');
        setNeighborhood('Itaim Bibi');
        setCity('São Paulo');
        setState('SP');
      }
    }
  };

  // =========================================================================
  // 1. INICIAR LOGIN VIA E-MAIL (COM DESAFIO MFA)
  // =========================================================================
  const handleEmailLoginSubmit = async () => {
    if (!loginIdentifier.trim()) {
      Alert.alert('Atenção', 'Informe seu e-mail comercial, nome ou CNPJ do bar.');
      return;
    }
    if (!loginPassword.trim()) {
      Alert.alert('Atenção', 'Informe a sua senha de acesso.');
      return;
    }

    setIsSubmitting(true);
    setMfaError(null);
    try {
      // Disparar desafio de autenticação multifator (MFA) via WhatsApp / Email
      const session = await requestMfaCode(loginIdentifier.trim(), 'whatsapp');
      setMfaCodeInput('');
      setResendCooldown(30);
      setMode('mfa');
      Alert.alert(
        '🔐 Verificação em 2 Etapas (MFA)',
        `Enviamos um código de 6 dígitos via WhatsApp para ${session.maskedDestination}. Digite o código para confirmar o acesso.`
      );
    } catch (err: any) {
      Alert.alert('Erro ao entrar', err?.message || 'Verifique seus dados e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // 2. INICIAR LOGIN VIA TELEFONE (WHATSAPP / SMS) PRO BAR
  // =========================================================================
  const handlePhoneLoginSubmit = async () => {
    const cleanDigits = phoneInput.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      Alert.alert('Atenção', 'Informe um número de telefone com DDD válido (ex: (11) 98765-4321).');
      return;
    }

    setIsSubmitting(true);
    setMfaError(null);
    try {
      const session = await requestMfaCode(phoneInput, phoneChannel);
      setMfaCodeInput('');
      setResendCooldown(30);
      setMode('mfa');
      const channelLabel = phoneChannel === 'whatsapp' ? 'WhatsApp' : 'SMS';
      Alert.alert(
        '🔐 Código de Acesso Enviado',
        `Enviamos seu código MFA de 6 dígitos via ${channelLabel} para ${session.maskedDestination}.`
      );
    } catch (err: any) {
      Alert.alert('Erro ao enviar código', err?.message || 'Não foi possível enviar o código para este telefone.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // 3. CONFIRMAR CÓDIGO MFA (2 ETAPAS)
  // =========================================================================
  const handleMfaSubmit = async () => {
    const cleanCode = mfaCodeInput.replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setMfaError('O código de segurança deve ter exatamente 6 dígitos.');
      return;
    }

    setIsSubmitting(true);
    setMfaError(null);
    try {
      await verifyMfaCode(cleanCode, rememberDevice);
      Alert.alert(
        '🎉 Acesso Liberado!',
        `Autenticação em 2 etapas confirmada com sucesso no FlowStock.`
      );
      onLoginSuccess();
    } catch (err: any) {
      setMfaError(err?.message || 'Código incorreto ou expirado. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reenviar código MFA por outro canal
  const handleResendMfa = async (channel: MfaChannel) => {
    if (!activeMfaSession && !loginIdentifier && !phoneInput) return;
    setIsSubmitting(true);
    setMfaError(null);
    try {
      const identifier = activeMfaSession?.destination || (loginMethod === 'phone' ? phoneInput : loginIdentifier);
      const session = await requestMfaCode(identifier, channel);
      setResendCooldown(30);
      setMfaCodeInput('');
      const channelLabel = channel === 'whatsapp' ? 'WhatsApp' : channel === 'sms' ? 'SMS' : 'E-mail';
      Alert.alert('Código Reenviado', `Novo código MFA de 6 dígitos enviado via ${channelLabel} para ${session.maskedDestination}.`);
    } catch (err: any) {
      Alert.alert('Erro ao reenviar', err?.message || 'Tente novamente em instantes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Login Direto / Demonstração Instantânea (Sem MFA)
  const handleQuickDemoLogin = async (identifier: string) => {
    setIsSubmitting(true);
    try {
      await login(identifier);
      Alert.alert('Modo Demonstração', `Logado com sucesso como ${identifier}.`);
      onLoginSuccess();
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Falha ao logar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submissão de Cadastro Passo a Passo
  const handleSignupStep1Next = () => {
    if (!ownerName.trim()) {
      Alert.alert('Atenção', 'Informe o seu nome completo.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Atenção', 'Informe um e-mail comercial válido.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Atenção', 'Informe um WhatsApp ou telefone de contato.');
      return;
    }
    setSignupStep(2);
  };

  const handleSignupStep2Next = () => {
    if (!cnpj.trim() || cnpj.replace(/\D/g, '').length < 8) {
      Alert.alert('Atenção', 'Informe o CNPJ da empresa do bar.');
      return;
    }
    if (!barName.trim()) {
      Alert.alert('Atenção', 'Informe o nome fantasia do estabelecimento.');
      return;
    }
    setSignupStep(3);
  };

  const handleSignupFinal = async () => {
    if (!street.trim() || !number.trim() || !neighborhood.trim() || !city.trim()) {
      Alert.alert('Atenção', 'Preencha o endereço completo de entrega do bar.');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerBarAndOwner({
        ownerName: ownerName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: password.trim(),
        barName: barName.trim(),
        tradingName: tradingName.trim() || barName.trim(),
        cnpj: cnpj.trim(),
        stateRegistration: stateRegistration.trim(),
        category,
        zipCode: zipCode.trim(),
        street: street.trim(),
        number: number.trim(),
        complement: complement.trim(),
        neighborhood: neighborhood.trim(),
        city: city.trim(),
        state: state.trim().toUpperCase(),
        simulatedSerasaStatus,
      });

      if (simulatedSerasaStatus === 'approved') {
        Alert.alert(
          '🎉 Cadastro Concluído!',
          `Seu bar "${barName}" foi aprovado na análise Serasa Experian (Score 845)! Limite de crédito faturado liberado de R$ 15.000,00 para pagar em até 15 dias.`
        );
      } else {
        Alert.alert(
          '⚠️ Cadastro Concluído com Restrição',
          `Seu bar "${barName}" foi cadastrado, mas identificamos restrições no Serasa (Score 320). Suas compras devem ser pagas na hora (Pix ou Cartão).`
        );
      }
      onLoginSuccess();
    } catch (err: any) {
      Alert.alert('Erro no cadastro', err?.message || 'Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Fiel ao Figma */}
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={styles.iconBtn} 
          onPress={() => {
            if (mode === 'mfa') {
              cancelMfa();
              setMode('login');
            } else if (mode === 'signup' && signupStep > 1) {
              setSignupStep((signupStep - 1) as SignupStep);
            } else if (mode === 'signup') {
              setMode('login');
            } else {
              onBack();
            }
          }} 
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.topBarTitle}>
          {mode === 'mfa' ? 'SEGURANÇA (2FA / MFA)' : mode === 'login' ? 'SIGN IN B2B' : `CADASTRO (Passo ${signupStep}/3)`}
        </Text>

        <TouchableOpacity 
          style={styles.iconBtn} 
          onPress={() => {
            Alert.alert(
              'Acesso Rápido de Teste',
              'Escolha uma conta pré-configurada para testar sem digitação:',
              [
                { text: 'Boteco do Carlos (E-mail)', onPress: () => { setLoginMethod('email'); setLoginIdentifier('carlos.mendes@botecodochico.com.br'); setLoginPassword('123456'); } },
                { text: 'Boteco do Carlos (Telefone)', onPress: () => { setLoginMethod('phone'); setPhoneInput('(11) 98765-4321'); } },
                { text: 'Taverna Bar (Mariana)', onPress: () => { setLoginMethod('email'); setLoginIdentifier('mariana@tavernabar.com.br'); setLoginPassword('123456'); } },
                { text: 'Cancelar', style: 'cancel' }
              ]
            );
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="shield-checkmark-outline" size={22} color="#FFC107" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ========================================================================= */}
        {/* ETAPA 1: TELA DE AUTENTICAÇÃO MULTIFATOR (MFA / 2FA)                      */}
        {/* ========================================================================= */}
        {mode === 'mfa' ? (
          <View style={styles.content}>
            <View style={styles.mfaHeaderBox}>
              <View style={styles.mfaIconBadge}>
                <Ionicons name="shield-checkmark" size={36} color="#FFC107" />
              </View>
              <Text style={styles.mfaMainTitle}>Autenticação em 2 Etapas</Text>
              <Text style={styles.mfaSubtitle}>
                Por segurança do seu bar, enviamos um código de verificação de 6 dígitos via{' '}
                <Text style={{ fontWeight: 'bold', color: '#FFC107' }}>
                  {activeMfaSession?.channel.toUpperCase() || 'WHATSAPP'}
                </Text>{' '}
                para:
              </Text>

              <View style={styles.mfaDestinationPill}>
                <Ionicons 
                  name={activeMfaSession?.channel === 'email' ? "mail" : "chatbubble-ellipses"} 
                  size={16} 
                  color="#FFC107" 
                  style={{ marginRight: 6 }} 
                />
                <Text style={styles.mfaDestinationText}>
                  {activeMfaSession?.maskedDestination || '(11) 9****-4321'}
                </Text>
                {activeMfaSession?.barName && (
                  <Text style={styles.mfaBarBadgeText}> • {activeMfaSession.barName}</Text>
                )}
              </View>
            </View>

            {/* Simulação em Destaque para Testes de Avaliação */}
            {activeMfaSession?.code && (
              <View style={styles.mfaDemoCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Ionicons name="flask" size={16} color="#10B981" style={{ marginRight: 6 }} />
                  <Text style={styles.mfaDemoCardTitle}>Ambiente de Demonstração / Teste:</Text>
                </View>
                <Text style={styles.mfaDemoCodeText}>
                  Código gerado: <Text style={{ color: '#FFC107', fontWeight: 'bold' }}>{activeMfaSession.code}</Text>
                </Text>
                <TouchableOpacity 
                  style={styles.mfaAutoFillBtn}
                  onPress={() => {
                    setMfaCodeInput(activeMfaSession.code);
                    setMfaError(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="copy-outline" size={14} color="#0D1C28" style={{ marginRight: 6 }} />
                  <Text style={styles.mfaAutoFillBtnText}>Preencher Código Automaticamente</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Campo de Inserção do Código MFA */}
            <View style={styles.mfaInputContainer}>
              <Text style={styles.mfaInputLabel}>DIGITE O CÓDIGO DE 6 DÍGITOS</Text>
              <View style={[styles.mfaInputCard, mfaError ? { borderColor: '#EF4444' } : {}]}>
                <TextInput
                  style={[
                    styles.mfaInputField,
                    Platform.OS === 'web' && ({
                      outline: 'none',
                      outlineStyle: 'none',
                      outlineWidth: 0,
                      border: 'none',
                      borderWidth: 0,
                      boxShadow: 'none',
                    } as any)
                  ]}
                  placeholder="000000"
                  placeholderTextColor="#627585"
                  keyboardType="numeric"
                  maxLength={6}
                  value={mfaCodeInput}
                  onChangeText={(text) => {
                    setMfaCodeInput(text.replace(/\D/g, ''));
                    setMfaError(null);
                  }}
                  autoFocus={true}
                />
              </View>

              {mfaError && (
                <View style={styles.mfaErrorBox}>
                  <Ionicons name="alert-circle" size={15} color="#EF4444" style={{ marginRight: 5 }} />
                  <Text style={styles.mfaErrorText}>{mfaError}</Text>
                </View>
              )}
            </View>

            {/* Checkbox Lembrar Dispositivo */}
            <TouchableOpacity 
              style={styles.rememberDeviceRow}
              onPress={() => setRememberDevice(!rememberDevice)}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={rememberDevice ? "checkbox" : "square-outline"} 
                size={20} 
                color={rememberDevice ? "#FFC107" : "#8FA0AF"} 
                style={{ marginRight: 8 }} 
              />
              <Text style={styles.rememberDeviceText}>
                Lembrar deste dispositivo por 30 dias (acesso rápido)
              </Text>
            </TouchableOpacity>

            {/* Botão Confirmar & Acessar */}
            <TouchableOpacity 
              style={[styles.continueBtn, { backgroundColor: '#FFC107', marginTop: 16 }]}
              onPress={handleMfaSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#0D1C28" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="lock-open" size={18} color="#0D1C28" style={{ marginRight: 8 }} />
                  <Text style={[styles.continueBtnText, { color: '#0D1C28' }]}>
                    Confirmar Código & Acessar Bar
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Reenviar Código por Canais */}
            <View style={styles.mfaResendSection}>
              <Text style={styles.mfaResendLabel}>Não recebeu o código?</Text>
              
              <View style={styles.mfaChannelsRow}>
                <TouchableOpacity 
                  style={[styles.mfaChannelBtn, !canResend && { opacity: 0.6 }]}
                  disabled={!canResend || isSubmitting}
                  onPress={() => handleResendMfa('whatsapp')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#25D366" style={{ marginRight: 4 }} />
                  <Text style={styles.mfaChannelBtnText}>WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.mfaChannelBtn, !canResend && { opacity: 0.6 }]}
                  disabled={!canResend || isSubmitting}
                  onPress={() => handleResendMfa('sms')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chatbox" size={16} color="#38BDF8" style={{ marginRight: 4 }} />
                  <Text style={styles.mfaChannelBtnText}>SMS</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.mfaChannelBtn, !canResend && { opacity: 0.6 }]}
                  disabled={!canResend || isSubmitting}
                  onPress={() => handleResendMfa('email')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="mail" size={16} color="#F59E0B" style={{ marginRight: 4 }} />
                  <Text style={styles.mfaChannelBtnText}>E-mail</Text>
                </TouchableOpacity>
              </View>

              {!canResend && (
                <Text style={styles.mfaCooldownText}>
                  Reenviar novo código em <Text style={{ color: '#FFC107', fontWeight: 'bold' }}>{resendCooldown}s</Text>
                </Text>
              )}
            </View>

            {/* Voltar para Login */}
            <TouchableOpacity 
              style={styles.mfaCancelBtn}
              onPress={() => {
                cancelMfa();
                setMode('login');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.mfaCancelBtnText}>← Voltar para opções de login</Text>
            </TouchableOpacity>
          </View>
        ) : mode === 'login' ? (
          /* ========================================================================= */
          /* ETAPA 2: LOGIN COM ABAS: VIA E-MAIL OU VIA TELEFONE PRO BAR              */
          /* ========================================================================= */
          <View style={styles.content}>
            {/* Banner Superior */}
            <View style={styles.greetingBox}>
              <Text style={styles.hiText}>
                FLOW<Text style={styles.yellowComma}>STOCK</Text>
              </Text>
              <Text style={styles.subGreeting}>Acesso B2B para Bares & Fornecedores de Bebidas</Text>
            </View>

            {/* Alternador de Método de Login: E-mail vs Telefone */}
            <View style={styles.loginMethodTabsContainer}>
              <TouchableOpacity
                style={[
                  styles.loginMethodTab,
                  loginMethod === 'email' && styles.loginMethodTabActive
                ]}
                onPress={() => setLoginMethod('email')}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name="mail-outline" 
                  size={16} 
                  color={loginMethod === 'email' ? '#0D1C28' : '#8FA0AF'} 
                  style={{ marginRight: 6 }} 
                />
                <Text style={[
                  styles.loginMethodTabText,
                  loginMethod === 'email' && styles.loginMethodTabTextActive
                ]}>
                  Via E-mail
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.loginMethodTab,
                  loginMethod === 'phone' && styles.loginMethodTabActive
                ]}
                onPress={() => setLoginMethod('phone')}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name="call-outline" 
                  size={16} 
                  color={loginMethod === 'phone' ? '#0D1C28' : '#8FA0AF'} 
                  style={{ marginRight: 6 }} 
                />
                <Text style={[
                  styles.loginMethodTabText,
                  loginMethod === 'phone' && styles.loginMethodTabTextActive
                ]}>
                  Via Telefone (Bar)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Formulário Conforme Método Selecionado */}
            <View style={styles.formContainer}>
              {loginMethod === 'email' ? (
                <>
                  {/* Input: E-MAIL, NOME OU CNPJ */}
                  <View style={styles.fieldWrapper}>
                    <Text style={styles.inputFieldLabel}>E-MAIL OU CNPJ DO BAR</Text>
                    <View style={styles.inputCard}>
                      <TextInput
                        style={[
                          styles.inputField,
                          Platform.OS === 'web' && ({
                            outline: 'none',
                            outlineStyle: 'none',
                            outlineWidth: 0,
                            border: 'none',
                            borderWidth: 0,
                            boxShadow: 'none',
                          } as any)
                        ]}
                        placeholder="ex: bar@boteco.com.br ou CNPJ"
                        placeholderTextColor="#8FA0AF"
                        value={loginIdentifier}
                        onChangeText={setLoginIdentifier}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                      <Ionicons name="at-outline" size={20} color="#FFC107" />
                    </View>
                  </View>

                  {/* Input: SENHA DE ACESSO */}
                  <View style={styles.fieldWrapper}>
                    <Text style={styles.inputFieldLabel}>SENHA DE ACESSO</Text>
                    <View style={styles.inputCard}>
                      <TextInput
                        style={[
                          styles.inputField,
                          Platform.OS === 'web' && ({
                            outline: 'none',
                            outlineStyle: 'none',
                            outlineWidth: 0,
                            border: 'none',
                            borderWidth: 0,
                            boxShadow: 'none',
                          } as any)
                        ]}
                        placeholder="Sua senha secreta"
                        placeholderTextColor="#8FA0AF"
                        value={loginPassword}
                        onChangeText={setLoginPassword}
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                        <Ionicons 
                          name={showPassword ? "eye-off-outline" : "eye-outline"} 
                          size={20} 
                          color="#8FA0AF" 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Esqueceu a senha */}
                  <TouchableOpacity 
                    style={styles.forgotBtn}
                    onPress={() => Alert.alert('Recuperar Senha', 'Enviamos as instruções de redefinição para seu e-mail cadastrado.')}
                  >
                    <Text style={styles.forgotText}>Esqueceu a senha?</Text>
                  </TouchableOpacity>

                  {/* Botão Entrar com E-mail + MFA */}
                  <TouchableOpacity 
                    style={[styles.continueBtn, { backgroundColor: '#FFC107' }]}
                    onPress={handleEmailLoginSubmit}
                    disabled={isSubmitting}
                    activeOpacity={0.85}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#0D1C28" />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="shield-checkmark" size={18} color="#0D1C28" style={{ marginRight: 8 }} />
                        <Text style={[styles.continueBtnText, { color: '#0D1C28' }]}>
                          Entrar com E-mail (MFA Seguro)
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* Login via Telefone / WhatsApp pro Bar */}
                  <View style={styles.fieldWrapper}>
                    <Text style={styles.inputFieldLabel}>NÚMERO DE TELEFONE CELULAR DO BAR</Text>
                    <View style={styles.inputCard}>
                      <TextInput
                        style={[
                          styles.inputField,
                          Platform.OS === 'web' && ({
                            outline: 'none',
                            outlineStyle: 'none',
                            outlineWidth: 0,
                            border: 'none',
                            borderWidth: 0,
                            boxShadow: 'none',
                          } as any)
                        ]}
                        placeholder="(11) 98765-4321"
                        placeholderTextColor="#8FA0AF"
                        value={phoneInput}
                        onChangeText={(txt) => setPhoneInput(formatPhone(txt))}
                        keyboardType="phone-pad"
                      />
                      <Ionicons name="call" size={18} color="#FFC107" />
                    </View>
                  </View>

                  {/* Escolha do Canal de Recebimento do MFA */}
                  <Text style={[styles.inputFieldLabel, { marginTop: 4 }]}>CANAL DE ENVIO DO CÓDIGO MFA:</Text>
                  <View style={styles.phoneChannelToggleRow}>
                    <TouchableOpacity
                      style={[
                        styles.phoneChannelBtn,
                        phoneChannel === 'whatsapp' && styles.phoneChannelBtnActive
                      ]}
                      onPress={() => setPhoneChannel('whatsapp')}
                      activeOpacity={0.8}
                    >
                      <Ionicons 
                        name="logo-whatsapp" 
                        size={18} 
                        color={phoneChannel === 'whatsapp' ? '#25D366' : '#8FA0AF'} 
                        style={{ marginRight: 6 }} 
                      />
                      <Text style={[
                        styles.phoneChannelBtnText,
                        phoneChannel === 'whatsapp' && { color: '#FFFFFF', fontWeight: 'bold' }
                      ]}>
                        WhatsApp Oficial
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.phoneChannelBtn,
                        phoneChannel === 'sms' && styles.phoneChannelBtnActive
                      ]}
                      onPress={() => setPhoneChannel('sms')}
                      activeOpacity={0.8}
                    >
                      <Ionicons 
                        name="chatbox-ellipses" 
                        size={18} 
                        color={phoneChannel === 'sms' ? '#38BDF8' : '#8FA0AF'} 
                        style={{ marginRight: 6 }} 
                      />
                      <Text style={[
                        styles.phoneChannelBtnText,
                        phoneChannel === 'sms' && { color: '#FFFFFF', fontWeight: 'bold' }
                      ]}>
                        SMS Direto
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.phoneHintText}>
                    Enviaremos um token numérico de 6 dígitos para autenticar o acesso do seu estabelecimento sem necessidade de decorar senhas.
                  </Text>

                  {/* Botão Enviar Código */}
                  <TouchableOpacity 
                    style={[styles.continueBtn, { backgroundColor: '#FFC107', marginTop: 10 }]}
                    onPress={handlePhoneLoginSubmit}
                    disabled={isSubmitting}
                    activeOpacity={0.85}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#0D1C28" />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons 
                          name={phoneChannel === 'whatsapp' ? "logo-whatsapp" : "chatbox"} 
                          size={18} 
                          color="#0D1C28" 
                          style={{ marginRight: 8 }} 
                        />
                        <Text style={[styles.continueBtnText, { color: '#0D1C28' }]}>
                          Receber Código por {phoneChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {/* Cadastre seu Bar */}
              <TouchableOpacity 
                style={styles.signUpRow}
                onPress={() => {
                  setMode('signup');
                  setSignupStep(1);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.noAccountText}>Ainda não possui bar cadastrado? </Text>
                <Text style={styles.signUpYellowText}>Cadastrar Bar B2B</Text>
              </TouchableOpacity>

              {/* Atalhos Rápidos para Demonstração */}
              <View style={styles.quickAccessSection}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={styles.quickAccessHeader}>Contas de Demonstração (1-Toque):</Text>
                  <Text style={{ fontSize: 10, color: '#10B981', fontWeight: 'bold' }}>MFA ATIVO</Text>
                </View>

                <View style={styles.quickAccessRow}>
                  <TouchableOpacity 
                    style={styles.quickAccountPill}
                    onPress={() => {
                      setLoginMethod('email');
                      setLoginIdentifier('carlos.mendes@botecodochico.com.br');
                      setLoginPassword('123456');
                      setPhoneInput('(11) 98765-4321');
                    }}
                  >
                    <Ionicons name="beer" size={13} color="#FFC107" style={{ marginRight: 4 }} />
                    <Text style={styles.quickAccountText}>Boteco do Carlos</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.quickAccountPill}
                    onPress={() => {
                      setLoginMethod('phone');
                      setPhoneInput('(11) 97654-3210');
                      setLoginIdentifier('mariana@tavernabar.com.br');
                      setLoginPassword('123456');
                    }}
                  >
                    <Ionicons name="wine" size={13} color="#FFC107" style={{ marginRight: 4 }} />
                    <Text style={styles.quickAccountText}>Taverna Bar</Text>
                  </TouchableOpacity>
                </View>

                {/* Atalho de Login Instantâneo sem MFA para Desenvolvedor */}
                <TouchableOpacity
                  style={styles.devBypassBtn}
                  onPress={() => handleQuickDemoLogin(loginMethod === 'phone' ? phoneInput : loginIdentifier)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="flash" size={13} color="#F59E0B" style={{ marginRight: 6 }} />
                  <Text style={styles.devBypassBtnText}>Entrar Imediato (Pular MFA no Modo Dev)</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          /* ========================================================================= */
          /* ETAPA 3: CADASTRO B2B DE NOVO BAR (3 PASSOS)                              */
          /* ========================================================================= */
          <View style={styles.content}>
            <View style={styles.greetingBox}>
              <Text style={styles.signupStepTitle}>
                {signupStep === 1 && 'Passo 1: Responsável pelo Bar'}
                {signupStep === 2 && 'Passo 2: Dados da Empresa & Serasa'}
                {signupStep === 3 && 'Passo 3: Endereço de Entrega das Bebidas'}
              </Text>
              <Text style={styles.subGreeting}>
                {signupStep === 1 && 'Informe seus dados de contato e crie sua senha comercial'}
                {signupStep === 2 && 'CNPJ do estabelecimento para análise de crédito de 15 dias'}
                {signupStep === 3 && 'Local onde os caminhões de distribuição devem descarregar'}
              </Text>
            </View>

            {/* Barra de Progresso */}
            <View style={styles.stepProgressContainer}>
              <View style={[styles.stepProgressBar, { width: `${(signupStep / 3) * 100}%` }]} />
            </View>

            <View style={styles.formContainer}>
              {/* PASSO 1 */}
              {signupStep === 1 && (
                <>
                  <Text style={styles.fieldLabel}>SEU NOME COMPLETO</Text>
                  <View style={styles.inputCard}>
                    <TextInput
                      style={styles.inputField}
                      placeholder="Ex: Carlos Alberto Mendes"
                      placeholderTextColor="#8FA0AF"
                      value={ownerName}
                      onChangeText={setOwnerName}
                    />
                    <Ionicons name="person" size={20} color="#8FA0AF" />
                  </View>

                  <Text style={styles.fieldLabel}>E-MAIL COMERCIAL</Text>
                  <View style={styles.inputCard}>
                    <TextInput
                      style={styles.inputField}
                      placeholder="Ex: carlos@botecodochico.com.br"
                      placeholderTextColor="#8FA0AF"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    <Ionicons name="mail" size={20} color="#8FA0AF" />
                  </View>

                  <Text style={styles.fieldLabel}>WHATSAPP / TELEFONE DO BAR</Text>
                  <View style={styles.inputCard}>
                    <TextInput
                      style={styles.inputField}
                      placeholder="(11) 98765-4321"
                      placeholderTextColor="#8FA0AF"
                      value={phone}
                      onChangeText={(t) => setPhone(formatPhone(t))}
                      keyboardType="phone-pad"
                    />
                    <Ionicons name="call" size={20} color="#8FA0AF" />
                  </View>

                  <Text style={styles.fieldLabel}>SENHA DE ACESSO</Text>
                  <View style={styles.inputCard}>
                    <TextInput
                      style={styles.inputField}
                      placeholder="Mínimo 6 caracteres"
                      placeholderTextColor="#8FA0AF"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                    <Ionicons name="lock-closed" size={20} color="#8FA0AF" />
                  </View>

                  <TouchableOpacity 
                    style={[styles.continueBtn, { backgroundColor: '#FFC107' }]}
                    onPress={handleSignupStep1Next}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.continueBtnText, { color: '#0D1C28' }]}>Avançar para Empresa →</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* PASSO 2 */}
              {signupStep === 2 && (
                <>
                  <Text style={styles.fieldLabel}>CNPJ DA EMPRESA</Text>
                  <View style={styles.inputCard}>
                    <TextInput
                      style={styles.inputField}
                      placeholder="00.000.000/0001-00"
                      placeholderTextColor="#8FA0AF"
                      value={cnpj}
                      onChangeText={formatCnpj}
                      keyboardType="numeric"
                    />
                    <Ionicons name="business" size={20} color="#8FA0AF" />
                  </View>

                  <Text style={styles.fieldLabel}>NOME FANTASIA (O NOME DO SEU BAR)</Text>
                  <View style={styles.inputCard}>
                    <TextInput
                      style={styles.inputField}
                      placeholder="Ex: Boteco do Carlos"
                      placeholderTextColor="#8FA0AF"
                      value={barName}
                      onChangeText={setBarName}
                    />
                    <Ionicons name="beer" size={20} color="#8FA0AF" />
                  </View>

                  <Text style={styles.fieldLabel}>RAZÃO SOCIAL</Text>
                  <View style={styles.inputCard}>
                    <TextInput
                      style={styles.inputField}
                      placeholder="Ex: Carlos Bares e Lanches Ltda"
                      placeholderTextColor="#8FA0AF"
                      value={tradingName}
                      onChangeText={setTradingName}
                    />
                    <Ionicons name="document-text" size={20} color="#8FA0AF" />
                  </View>

                  <Text style={styles.fieldLabel}>INSCRIÇÃO ESTADUAL</Text>
                  <View style={styles.inputCard}>
                    <TextInput
                      style={styles.inputField}
                      placeholder="Isento ou Número da IE"
                      placeholderTextColor="#8FA0AF"
                      value={stateRegistration}
                      onChangeText={setStateRegistration}
                    />
                  </View>

                  <Text style={styles.fieldLabel}>CATEGORIA DO ESTABELECIMENTO</Text>
                  <View style={styles.categoryRow}>
                    {(['boteco', 'choperia', 'restaurante', 'balada'] as const).map(cat => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                        onPress={() => setCategory(cat)}
                      >
                        <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
                          {cat.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Simulação Serasa */}
                  <Text style={[styles.fieldLabel, { marginTop: 12 }]}>AVALIAÇÃO DE CRÉDITO SERASA (SIMULAÇÃO)</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={[
                        styles.categoryChip, 
                        { flex: 1, alignItems: 'center' },
                        simulatedSerasaStatus === 'approved' && { backgroundColor: '#10B981', borderColor: '#10B981' }
                      ]}
                      onPress={() => setSimulatedSerasaStatus('approved')}
                    >
                      <Text style={[
                        styles.categoryChipText, 
                        simulatedSerasaStatus === 'approved' && { color: '#FFFFFF', fontWeight: 'bold' }
                      ]}>
                        ✓ Score Alto (Aprovado)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.categoryChip, 
                        { flex: 1, alignItems: 'center' },
                        simulatedSerasaStatus === 'restricted' && { backgroundColor: '#EF4444', borderColor: '#EF4444' }
                      ]}
                      onPress={() => setSimulatedSerasaStatus('restricted')}
                    >
                      <Text style={[
                        styles.categoryChipText, 
                        simulatedSerasaStatus === 'restricted' && { color: '#FFFFFF', fontWeight: 'bold' }
                      ]}>
                        ⚠ Restrito Serasa
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity 
                    style={[styles.continueBtn, { backgroundColor: '#FFC107' }]}
                    onPress={handleSignupStep2Next}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.continueBtnText, { color: '#0D1C28' }]}>Avançar para Endereço →</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* PASSO 3 */}
              {signupStep === 3 && (
                <>
                  <Text style={styles.fieldLabel}>CEP (ENDEREÇO DO BAR)</Text>
                  <View style={styles.inputCard}>
                    <TextInput
                      style={styles.inputField}
                      placeholder="05435-001 (Teste: 05435001 ou 08710220)"
                      placeholderTextColor="#8FA0AF"
                      value={zipCode}
                      onChangeText={handleCepSearch}
                      keyboardType="numeric"
                    />
                    <Ionicons name="location" size={20} color="#8FA0AF" />
                  </View>

                  <Text style={styles.fieldLabel}>LOGRADOURO (RUA / AVENIDA)</Text>
                  <View style={styles.inputCard}>
                    <TextInput
                      style={styles.inputField}
                      placeholder="Ex: Rua Aspicuelta"
                      placeholderTextColor="#8FA0AF"
                      value={street}
                      onChangeText={setStreet}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>NÚMERO</Text>
                      <View style={styles.inputCard}>
                        <TextInput
                          style={styles.inputField}
                          placeholder="420"
                          placeholderTextColor="#8FA0AF"
                          value={number}
                          onChangeText={setNumber}
                        />
                      </View>
                    </View>
                    <View style={{ flex: 1.5 }}>
                      <Text style={styles.fieldLabel}>COMPLEMENTO</Text>
                      <View style={styles.inputCard}>
                        <TextInput
                          style={styles.inputField}
                          placeholder="Térreo / Galpão"
                          placeholderTextColor="#8FA0AF"
                          value={complement}
                          onChangeText={setComplement}
                        />
                      </View>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1.5 }}>
                      <Text style={styles.fieldLabel}>BAIRRO</Text>
                      <View style={styles.inputCard}>
                        <TextInput
                          style={styles.inputField}
                          placeholder="Vila Madalena"
                          placeholderTextColor="#8FA0AF"
                          value={neighborhood}
                          onChangeText={setNeighborhood}
                        />
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>CIDADE</Text>
                      <View style={styles.inputCard}>
                        <TextInput
                          style={styles.inputField}
                          placeholder="São Paulo"
                          placeholderTextColor="#8FA0AF"
                          value={city}
                          onChangeText={setCity}
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.creditPreApprovedCard}>
                    <Ionicons 
                      name={simulatedSerasaStatus === 'approved' ? "shield-checkmark" : "warning"} 
                      size={28} 
                      color={simulatedSerasaStatus === 'approved' ? "#10B981" : "#EF4444"} 
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.creditCardTitle, { color: simulatedSerasaStatus === 'approved' ? '#34D399' : '#F87171' }]}>
                        {simulatedSerasaStatus === 'approved'
                          ? 'Crédito B2B Aprovado (15 Dias)'
                          : 'Crédito Faturado Indisponível'}
                      </Text>
                      <Text style={[styles.creditCardSub, { color: simulatedSerasaStatus === 'approved' ? '#A7F3D0' : '#FECACA' }]}>
                        {simulatedSerasaStatus === 'approved'
                          ? 'R$ 15.000,00 de limite para compras no boleto faturado em até 15 dias (Avaliação Serasa Score 845).'
                          : 'Restrição cadastral no Serasa. O bar deverá pagar na hora via Pix ou Cartão para concluir pedidos.'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={[styles.continueBtn, { backgroundColor: '#FFC107' }]}
                    onPress={handleSignupFinal}
                    disabled={isSubmitting}
                    activeOpacity={0.85}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#0D1C28" />
                    ) : (
                      <Text style={[styles.continueBtnText, { color: '#0D1C28' }]}>
                        Concluir Cadastro & Acessar o Bar 🎉
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {/* Voltar para login */}
              <TouchableOpacity 
                style={styles.signUpRow}
                onPress={() => setMode('login')}
                activeOpacity={0.8}
              >
                <Text style={styles.noAccountText}>Já tem uma conta cadastrada? </Text>
                <Text style={styles.signUpYellowText}>Fazer Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#051724',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#092030',
    borderBottomWidth: 1,
    borderBottomColor: '#172939',
  },
  iconBtn: {
    padding: 6,
  },
  topBarTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  greetingBox: {
    marginBottom: 20,
  },
  hiText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 1,
  },
  yellowComma: {
    color: '#FFC107',
  },
  subGreeting: {
    color: '#8FA0AF',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  loginMethodTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#092030',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#172939',
  },
  loginMethodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  loginMethodTabActive: {
    backgroundColor: '#FFC107',
  },
  loginMethodTabText: {
    fontSize: 13,
    color: '#8FA0AF',
    fontWeight: '600',
  },
  loginMethodTabTextActive: {
    color: '#0D1C28',
    fontWeight: 'bold',
  },
  signupStepTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  stepProgressContainer: {
    height: 4,
    backgroundColor: '#172939',
    borderRadius: 2,
    marginBottom: 20,
    overflow: 'hidden',
  },
  stepProgressBar: {
    height: '100%',
    backgroundColor: '#FFC107',
  },
  formContainer: {
    gap: 12,
  },
  fieldWrapper: {
    marginBottom: 4,
  },
  inputFieldLabel: {
    color: '#8FA0AF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#102234',
    borderWidth: 1,
    borderColor: '#23384D',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputField: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  phoneChannelToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  phoneChannelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#102234',
    borderWidth: 1,
    borderColor: '#23384D',
    borderRadius: 8,
    paddingVertical: 10,
  },
  phoneChannelBtnActive: {
    borderColor: '#FFC107',
    backgroundColor: '#162C42',
  },
  phoneChannelBtnText: {
    color: '#8FA0AF',
    fontSize: 12,
    fontWeight: '600',
  },
  phoneHintText: {
    color: '#627585',
    fontSize: 11,
    lineHeight: 15,
    marginVertical: 4,
  },
  forgotBtn: {
    alignSelf: 'center',
    marginVertical: 4,
  },
  forgotText: {
    color: '#8FA0AF',
    fontSize: 12,
  },
  continueBtn: {
    backgroundColor: '#092030',
    borderWidth: 1,
    borderColor: '#3F576C',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  signUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  noAccountText: {
    color: '#8FA0AF',
    fontSize: 13,
  },
  signUpYellowText: {
    color: '#FFC107',
    fontSize: 13,
    fontWeight: 'bold',
  },
  quickAccessSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#172939',
  },
  quickAccessHeader: {
    color: '#627585',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickAccessRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  quickAccountPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#102234',
    borderWidth: 1,
    borderColor: '#1E364B',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  quickAccountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  devBypassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  devBypassBtnText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Estilos da Tela de MFA
  mfaHeaderBox: {
    alignItems: 'center',
    marginBottom: 16,
  },
  mfaIconBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    borderWidth: 2,
    borderColor: '#FFC107',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  mfaMainTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  mfaSubtitle: {
    color: '#8FA0AF',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  mfaDestinationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#102234',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#1E364B',
  },
  mfaDestinationText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  mfaBarBadgeText: {
    color: '#FFC107',
    fontSize: 12,
    fontWeight: '600',
  },
  mfaDemoCard: {
    backgroundColor: '#0A252E',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  mfaDemoCardTitle: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mfaDemoCodeText: {
    color: '#E2E8F0',
    fontSize: 13,
    marginBottom: 8,
  },
  mfaAutoFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  mfaAutoFillBtnText: {
    color: '#0D1C28',
    fontSize: 11,
    fontWeight: 'bold',
  },
  mfaInputContainer: {
    marginBottom: 10,
  },
  mfaInputLabel: {
    color: '#8FA0AF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  mfaInputCard: {
    backgroundColor: '#102234',
    borderWidth: 2,
    borderColor: '#FFC107',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mfaInputField: {
    width: '100%',
    color: '#FFC107',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 10,
  },
  mfaErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  mfaErrorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  rememberDeviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  rememberDeviceText: {
    color: '#8FA0AF',
    fontSize: 12,
  },
  mfaResendSection: {
    marginTop: 18,
    alignItems: 'center',
  },
  mfaResendLabel: {
    color: '#8FA0AF',
    fontSize: 12,
    marginBottom: 8,
  },
  mfaChannelsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  mfaChannelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#102234',
    borderWidth: 1,
    borderColor: '#1E364B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  mfaChannelBtnText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
  mfaCooldownText: {
    color: '#627585',
    fontSize: 11,
  },
  mfaCancelBtn: {
    alignSelf: 'center',
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  mfaCancelBtnText: {
    color: '#8FA0AF',
    fontSize: 12,
  },

  // Cadastro B2B
  fieldLabel: {
    color: '#8FA0AF',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#102232',
    borderWidth: 1,
    borderColor: '#1E364B',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  categoryChipActive: {
    backgroundColor: '#FFC107',
    borderColor: '#FFC107',
  },
  categoryChipText: {
    color: '#8FA0AF',
    fontSize: 11,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#0D1C28',
    fontWeight: 'bold',
  },
  creditPreApprovedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    marginBottom: 4,
  },
  creditCardTitle: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: 'bold',
  },
  creditCardSub: {
    color: '#8FA0AF',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
});
