import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../auth/AuthContext';

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={18} color="#D6A4A4" />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '—'}</Text>
      </View>
    </View>
  );
}

function InputField({ icon, label, value, onChangeText, placeholder, secureTextEntry, keyboardType, rightIcon, onRightIconPress }) {
  return (
    <View style={styles.inputRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={18} color="#D6A4A4" />
      </View>
      <View style={styles.inputContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#CCC"
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType || 'default'}
            autoCapitalize="none"
          />
          {rightIcon ? (
            <TouchableOpacity onPress={onRightIconPress} activeOpacity={0.7} style={styles.eyeBtn}>
              <Ionicons name={rightIcon} size={18} color="#CCC" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUser } = useAuth();
  const insets = useSafeAreaInsets();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '??';

  const handleEdit = () => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setIsEditing(true);
  };

  const handleCancel = () => setIsEditing(false);

  const handleSave = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    try {
      setIsSaving(true);
      await updateUser(name, email, newPassword || null);
      setIsEditing(false);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.screen}>
        <StatusBar style="light" translucent backgroundColor="transparent" />

        {/* ── GRADIENT HEADER ── */}
        <LinearGradient
          colors={['#DEB4CC', '#BF789C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.header, { paddingTop: insets.top + 14 }]}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => isEditing ? handleCancel() : navigation.goBack()}
              style={styles.headerBtn}
              activeOpacity={0.7}
            >
              <Ionicons name={isEditing ? 'close' : 'chevron-back'} size={22} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              {isEditing ? 'Editar perfil' : 'Mi Perfil'}
            </Text>

            {isEditing ? (
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.headerBtn, isSaving && { opacity: 0.6 }]}
                activeOpacity={0.7}
                disabled={isSaving}
              >
                <Ionicons name="checkmark" size={22} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleEdit}
                style={styles.headerBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil-outline" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          {/* Avatar — solo en modo vista */}
          {!isEditing && (
            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
              {user?.name ? (
                <Text style={styles.avatarName}>{user.name}</Text>
              ) : null}
              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <Ionicons name="sparkles" size={11} color="#fff" />
                  <Text style={styles.badgeText}>Beauty Member</Text>
                </View>
              </View>
            </View>
          )}
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {isEditing ? (
            /* ── MODO EDICIÓN ── */
            <>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="person-outline" size={13} color="#D6A4A4" />
                <Text style={styles.sectionTitle}>Información</Text>
              </View>

              <View style={styles.card}>
                <InputField
                  icon="person-circle-outline"
                  label="Nombre"
                  value={name}
                  onChangeText={setName}
                  placeholder="Tu nombre completo"
                />
                <View style={styles.divider} />
                <InputField
                  icon="mail-outline"
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="tu@email.com"
                  keyboardType="email-address"
                />
              </View>

              <View style={[styles.sectionTitleRow, { marginTop: 28 }]}>
                <Ionicons name="lock-closed-outline" size={13} color="#D6A4A4" />
                <Text style={styles.sectionTitle}>Contraseña</Text>
              </View>

              <View style={styles.card}>
                <InputField
                  icon="lock-closed-outline"
                  label="Nueva contraseña"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Dejar vacío para no cambiar"
                  secureTextEntry={!showPassword}
                  rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  onRightIconPress={() => setShowPassword(v => !v)}
                />
                <View style={styles.divider} />
                <InputField
                  icon="lock-closed-outline"
                  label="Confirmar contraseña"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repetir nueva contraseña"
                  secureTextEntry={!showPassword}
                />
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                activeOpacity={0.85}
                disabled={isSaving}
              >
                <LinearGradient
                  colors={['#DEB4CC', '#BF789C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveGradient}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.saveText}>
                    {isSaving ? 'Guardando...' : 'Guardar cambios'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            /* ── MODO VISTA ── */
            <>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="person-outline" size={13} color="#D6A4A4" />
                <Text style={styles.sectionTitle}>Información</Text>
              </View>

              <View style={styles.card}>
                <InfoRow
                  icon="person-circle-outline"
                  label="Nombre"
                  value={user?.name}
                />
                <View style={styles.divider} />
                <InfoRow
                  icon="mail-outline"
                  label="Email"
                  value={user?.email}
                />
                <View style={styles.divider} />
                <InfoRow
                  icon="lock-closed-outline"
                  label="Contraseña"
                  value="••••••••"
                />
              </View>

              {/* ── APP INFO ── */}
              <View style={[styles.sectionTitleRow, { marginTop: 28 }]}>
                <Ionicons name="information-circle-outline" size={13} color="#D6A4A4" />
                <Text style={styles.sectionTitle}>Acerca de</Text>
              </View>

              <View style={styles.card}>
                <View style={styles.aboutRow}>
                  <Ionicons name="leaf-outline" size={17} color="#D6A4A4" />
                  <Text style={styles.aboutText}>Tu Diario Capilar</Text>
                  <Text style={styles.aboutVersion}>v1.0</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.aboutRow}>
                  <Ionicons name="heart-outline" size={17} color="#D6A4A4" />
                  <Text style={styles.aboutText}>Hecho con amor para tu cabello</Text>
                </View>
              </View>

              {/* ── LOGOUT ── */}
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={async () => await logout()}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#E8A0A0', '#C47898']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.logoutGradient}
                >
                  <Ionicons name="log-out-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.logoutText}>Cerrar sesión</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FDF5F8',
  },

  // header
  header: {
    paddingHorizontal: 18,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#BF789C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // avatar
  avatarSection: {
    alignItems: 'center',
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 1,
  },
  avatarName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // scroll
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 48,
  },

  // section title
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D6A4A4',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // card
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 18,
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F5E8EC',
  },

  // info rows (view mode)
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 14,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FDF0F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CCC',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },

  // input rows (edit mode)
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  inputContent: {
    flex: 1,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    paddingVertical: 4,
    borderBottomWidth: 1.5,
    borderBottomColor: '#F5E8EC',
  },
  eyeBtn: {
    paddingLeft: 10,
    paddingVertical: 4,
  },

  // about rows
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 12,
  },
  aboutText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  aboutVersion: {
    fontSize: 13,
    color: '#CCC',
    fontWeight: '600',
  },

  // save button
  saveButton: {
    marginTop: 32,
    borderRadius: 18,
    overflow: 'hidden',
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  saveText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },

  // logout
  logoutButton: {
    marginTop: 32,
    borderRadius: 18,
    overflow: 'hidden',
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
});
