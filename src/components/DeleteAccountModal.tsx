import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

const CONFIRM_WORD = 'EXCLUIR';

/**
 * Fluxo de exclusão de conta dentro do app.
 * Exigido pela Apple (App Store Review Guideline 5.1.1(v)) e pelo Google Play
 * (política de exclusão de conta) para apps que permitem criar conta.
 *
 * Usa um modal próprio em vez de Alert.alert para funcionar também no web,
 * onde o Alert do react-native-web não mostra botões de confirmação.
 */
export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ visible, onClose, onDeleted }) => {
  const { currentUser, myBars, deleteAccount, theme, isDarkMode } = useApp();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  const canConfirm = confirmText.trim().toUpperCase() === CONFIRM_WORD && !isDeleting;

  const resetAndClose = () => {
    if (isDeleting) return;
    setConfirmText('');
    setErrorMessage(null);
    const wasDone = isDone;
    setIsDone(false);
    onClose();
    if (wasDone && onDeleted) onDeleted();
  };

  const handleDelete = async () => {
    if (!canConfirm) return;
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      await deleteAccount();
      setIsDone(true);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Não foi possível excluir a conta. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  const inputBg = isDarkMode ? '#0B1824' : '#F8FAFC';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={resetAndClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.content, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>
              {isDone ? 'Conta excluída' : 'Excluir minha conta'}
            </Text>
            <TouchableOpacity onPress={resetAndClose} disabled={isDeleting} accessibilityLabel="Fechar">
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {isDone ? (
            <View>
              <View style={styles.doneIcon}>
                <Ionicons name="checkmark-circle" size={56} color="#10B981" />
              </View>
              <Text style={[styles.paragraph, { color: theme.textSecondary, textAlign: 'center' }]}>
                Sua conta e seus dados pessoais foram excluídos. Obrigado por ter usado o FlowStock.
              </Text>
              <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: isDarkMode ? '#172738' : '#F1F5F9' }]} onPress={resetAndClose}>
                <Text style={[styles.secondaryBtnText, { color: theme.text }]}>Fechar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.warningBox}>
                <Ionicons name="warning-outline" size={22} color="#EF4444" />
                <Text style={styles.warningText}>Esta ação é permanente e não pode ser desfeita.</Text>
              </View>

              <Text style={[styles.paragraph, { color: theme.text }]}>
                Ao excluir a conta de <Text style={styles.bold}>{currentUser?.email || currentUser?.name}</Text>:
              </Text>
              <Text style={[styles.bullet, { color: theme.textSecondary }]}>
                • Seus dados de acesso e perfil serão apagados.
              </Text>
              <Text style={[styles.bullet, { color: theme.textSecondary }]}>
                • {myBars.length > 0
                  ? `${myBars.length === 1 ? 'Seu estabelecimento cadastrado será removido' : `Seus ${myBars.length} estabelecimentos cadastrados serão removidos`}.`
                  : 'Seus estabelecimentos cadastrados serão removidos.'}
              </Text>
              <Text style={[styles.bullet, { color: theme.textSecondary }]}>
                • Carrinho, favoritos e histórico de buscas serão apagados.
              </Text>
              <Text style={[styles.bullet, { color: theme.textSecondary }]}>
                • Notas e registros de pedidos já feitos podem ser mantidos pelo prazo exigido pela legislação fiscal, sem vínculo com o seu perfil.
              </Text>

              <Text style={[styles.paragraph, { color: theme.text, marginTop: 14 }]}>
                Para confirmar, digite <Text style={styles.bold}>{CONFIRM_WORD}</Text> abaixo:
              </Text>
              <TextInput
                value={confirmText}
                onChangeText={setConfirmText}
                placeholder={CONFIRM_WORD}
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!isDeleting}
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: inputBg }]}
                accessibilityLabel={`Digite ${CONFIRM_WORD} para confirmar`}
              />

              {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

              <TouchableOpacity
                style={[styles.deleteBtn, !canConfirm && styles.deleteBtnDisabled]}
                onPress={handleDelete}
                disabled={!canConfirm}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteBtnText}>Excluir conta permanentemente</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryBtn, { backgroundColor: isDarkMode ? '#172738' : '#F1F5F9' }]}
                onPress={resetAndClose}
                disabled={isDeleting}
              >
                <Text style={[styles.secondaryBtnText, { color: theme.text }]}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  warningText: {
    flex: 1,
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  bullet: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 4,
  },
  bold: {
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    letterSpacing: 2,
    marginTop: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 10,
  },
  deleteBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  deleteBtnDisabled: {
    opacity: 0.4,
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  secondaryBtn: {
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  doneIcon: {
    alignItems: 'center',
    marginVertical: 12,
  },
});
