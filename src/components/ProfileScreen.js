import React, { useState, useEffect, useCallback } from 'react';
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
  Image,
  ActivityIndicator,
  Modal,
  Dimensions,
  ActionSheetIOS,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';
import { useAuth } from '../auth/AuthContext';
import {
  addProgressPhoto,
  subscribeToProgressPhotos,
  deleteProgressPhoto,
} from '../firebase/progressPhotos';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_GAP = 4;
const PHOTO_SIZE = (SCREEN_WIDTH - 36 - PHOTO_GAP * 2) / 3;

const MONTH_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [, m, d] = dateStr.split('-');
  return `${parseInt(d)} ${MONTH_NAMES[parseInt(m) - 1]}`;
}

async function uploadProfilePhoto(uri, userEmail) {
  const response = await fetch(uri);
  const blob = await response.blob();
  const storageRef = ref(storage, `profile_photos/${userEmail.replace('@', '_').replace('.', '_')}`);
  await uploadBytes(storageRef, blob);
  return await getDownloadURL(storageRef);
}

// ── Shared sub-components ─────────────────────────────────────────────────────

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
            <TouchableOpacity
              onPress={onRightIconPress}
              activeOpacity={0.7}
              style={styles.eyeBtn}
              accessibilityRole="button"
              accessibilityLabel={rightIcon === 'eye-off-outline' ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              accessibilityState={{ selected: rightIcon === 'eye-off-outline' }}
            >
              <Ionicons name={rightIcon} size={18} color="#CCC" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

// ── Auth View (no hay sesión) ─────────────────────────────────────────────────

function AuthView() {
  const { login, register } = useAuth();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const switchMode = (m) => {
    setMode(m);
    setError('');
    setName('');
    setEmail('');
    setPassword('');
    setConfirm('');
  };

  const handleSubmit = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Email y contraseña son obligatorios.');
      return;
    }
    if (mode === 'register') {
      if (!name.trim()) { setError('El nombre es obligatorio.'); return; }
      if (password !== confirm) { setError('Las contraseñas no coinciden.'); return; }
      if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    }
    setLoading(true);
    try {
      if (mode === 'login') await login(email.trim(), password);
      else await register(name.trim(), email.trim(), password);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.screen}>
        <StatusBar style="light" translucent backgroundColor="transparent" />

        <LinearGradient
          colors={['#DEB4CC', '#BF789C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.header, { paddingTop: insets.top + 14 }]}
        >
          <View style={styles.headerRowCenter}>
            <Text style={styles.headerTitle}>Mi Perfil</Text>
          </View>

          <View style={styles.avatarSection}>
            <View style={styles.avatarCircleGuest}>
              <Ionicons name="person-outline" size={34} color="rgba(255,255,255,0.85)" />
            </View>
            <Text style={styles.avatarName}>Tu Diario Capilar</Text>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Ionicons name="sparkles" size={11} color="#fff" />
                <Text style={styles.badgeText}>Únete a la comunidad</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Toggle login / registro */}
          <View style={styles.toggleWrap}>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'login' && styles.toggleBtnActive]}
              onPress={() => switchMode('login')}
              activeOpacity={0.85}
            >
              <Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>
                Iniciar sesión
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'register' && styles.toggleBtnActive]}
              onPress={() => switchMode('register')}
              activeOpacity={0.85}
            >
              <Text style={[styles.toggleText, mode === 'register' && styles.toggleTextActive]}>
                Crear cuenta
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.card}>
            {mode === 'register' && (
              <>
                <InputField
                  icon="person-circle-outline"
                  label="Nombre"
                  value={name}
                  onChangeText={setName}
                  placeholder="Tu nombre completo"
                />
                <View style={styles.divider} />
              </>
            )}
            <InputField
              icon="mail-outline"
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              keyboardType="email-address"
            />
            <View style={styles.divider} />
            <InputField
              icon="lock-closed-outline"
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!showPass}
              rightIcon={showPass ? 'eye-off-outline' : 'eye-outline'}
              onRightIconPress={() => setShowPass((v) => !v)}
            />
            {mode === 'register' && (
              <>
                <View style={styles.divider} />
                <InputField
                  icon="lock-closed-outline"
                  label="Confirmar contraseña"
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="••••••••"
                  secureTextEntry={!showPass}
                />
              </>
            )}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={loading}
          >
            <LinearGradient
              colors={['#DEB4CC', '#BF789C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              <Ionicons
                name={mode === 'login' ? 'log-in-outline' : 'person-add-outline'}
                size={18}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.submitText}>
                {loading
                  ? mode === 'login' ? 'Ingresando...' : 'Creando cuenta...'
                  : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Profile View (hay sesión) ─────────────────────────────────────────────────

function ProfileView({ navigation }) {
  const { user, logout, updateUser, updatePhoto } = useAuth();
  const insets = useSafeAreaInsets();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // ── Progreso ────────────────────────────────────────────────────────────────
  const [progressPhotos, setProgressPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [uploadingProgress, setUploadingProgress] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToProgressPhotos(user.uid, setProgressPhotos);
    return unsub;
  }, [user?.uid]);


  const handleAddProgressPhoto = useCallback(() => {
    const pick = async (fromCamera) => {
      const perm = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso para continuar.');
        return;
      }
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [3, 4], quality: 0.75 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [3, 4], quality: 0.75 });
      if (result.canceled) return;
      try {
        setUploadingProgress(true);
        await addProgressPhoto(user.uid, result.assets[0].uri);
      } catch {
        Alert.alert('Error', 'No se pudo guardar la foto. Intenta de nuevo.');
      } finally {
        setUploadingProgress(false);
      }
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancelar', 'Tomar foto', 'Elegir de galería'], cancelButtonIndex: 0 },
        (idx) => { if (idx === 1) pick(true); if (idx === 2) pick(false); },
      );
    } else {
      Alert.alert('Agregar foto', 'Elige una opción', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Tomar foto', onPress: () => pick(true) },
        { text: 'Elegir de galería', onPress: () => pick(false) },
      ]);
    }
  }, [user?.uid]);

  const handleDeletePhoto = useCallback((photo) => {
    Alert.alert('Eliminar foto', '¿Segura que quieres eliminar esta foto de progreso?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          setSelectedPhoto(null);
          await deleteProgressPhoto(user.uid, photo.id, photo.storagePath);
        },
      },
    ]);
  }, [user?.uid]);

  const initials = user?.displayName
    ? user.displayName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '??';

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para cambiar la foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;
    try {
      setUploadingPhoto(true);
      const url = await uploadProfilePhoto(result.assets[0].uri, user.email);
      await updatePhoto(url);
    } catch (e) {
      Alert.alert('Error', 'No se pudo subir la foto. Intenta de nuevo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleEdit = () => {
    setName(user?.displayName || '');
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.screen}>
        <StatusBar style="light" translucent backgroundColor="transparent" />

        <LinearGradient
          colors={['#DEB4CC', '#BF789C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.header, { paddingTop: insets.top + 14 }]}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={handleCancel}
              style={[styles.headerBtn, !isEditing && { opacity: 0 }]}
              activeOpacity={0.7}
              disabled={!isEditing}
              accessibilityRole="button"
              accessibilityLabel="Cancelar edición"
              accessibilityState={{ disabled: !isEditing }}
            >
              <Ionicons name="close" size={22} color="#fff" />
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
                accessibilityRole="button"
                accessibilityLabel="Guardar cambios"
                accessibilityState={{ disabled: isSaving }}
              >
                <Ionicons name="checkmark" size={22} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleEdit}
                style={styles.headerBtn}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Editar perfil"
              >
                <Ionicons name="pencil-outline" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          {!isEditing && (
            <View style={styles.avatarSection}>
              <TouchableOpacity
                onPress={handlePickPhoto}
                activeOpacity={0.85}
                style={styles.avatarWrap}
                accessibilityRole="button"
                accessibilityLabel="Cambiar foto de perfil"
              >
                {user?.photoURL ? (
                  <Image source={{ uri: user.photoURL }} style={styles.avatarPhoto} />
                ) : (
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  </View>
                )}
                <View style={styles.cameraOverlay}>
                  {uploadingPhoto
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Ionicons name="camera" size={14} color="#fff" />}
                </View>
              </TouchableOpacity>
              {user?.displayName ? <Text style={styles.avatarName}>{user.displayName}</Text> : null}
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
            <>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="person-outline" size={13} color="#D6A4A4" />
                <Text style={styles.sectionTitle}>Información</Text>
              </View>
              <View style={styles.card}>
                <InputField icon="person-circle-outline" label="Nombre" value={name} onChangeText={setName} placeholder="Tu nombre completo" />
                <View style={styles.divider} />
                <InputField icon="mail-outline" label="Email" value={email} onChangeText={setEmail} placeholder="tu@email.com" keyboardType="email-address" />
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
                  onRightIconPress={() => setShowPassword((v) => !v)}
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

              <TouchableOpacity style={styles.submitButton} onPress={handleSave} activeOpacity={0.85} disabled={isSaving}>
                <LinearGradient colors={['#DEB4CC', '#BF789C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGradient}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.submitText}>{isSaving ? 'Guardando...' : 'Guardar cambios'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="person-outline" size={13} color="#D6A4A4" />
                <Text style={styles.sectionTitle}>Información</Text>
              </View>
              <View style={styles.card}>
                <InfoRow icon="person-circle-outline" label="Nombre" value={user?.displayName} />
                <View style={styles.divider} />
                <InfoRow icon="mail-outline" label="Email" value={user?.email} />
                <View style={styles.divider} />
                <InfoRow icon="lock-closed-outline" label="Contraseña" value="••••••••" />
              </View>

              {/* ── Mi Progreso ── */}
              <View style={[styles.sectionTitleRow, { marginTop: 28 }]}>
                <Ionicons name="images-outline" size={13} color="#D6A4A4" />
                <Text style={styles.sectionTitle}>Mi Progreso</Text>
                <TouchableOpacity
                  onPress={handleAddProgressPhoto}
                  style={styles.progressAddBtn}
                  activeOpacity={0.7}
                  disabled={uploadingProgress}
                  accessibilityRole="button"
                  accessibilityLabel="Agregar foto de progreso"
                  accessibilityState={{ disabled: uploadingProgress }}
                >
                  {uploadingProgress
                    ? <ActivityIndicator size="small" color="#BF789C" />
                    : <Ionicons name="add" size={18} color="#BF789C" />}
                </TouchableOpacity>
              </View>

              {progressPhotos.length === 0 ? (
                <TouchableOpacity
                  style={styles.progressEmpty}
                  onPress={handleAddProgressPhoto}
                  activeOpacity={0.85}
                  disabled={uploadingProgress}
                >
                  <Ionicons name="camera-outline" size={32} color="#E0C0D0" />
                  <Text style={styles.progressEmptyText}>Agrega tu primera foto de progreso</Text>
                  <Text style={styles.progressEmptyHint}>Documenta la evolución de tu cabello</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.progressGrid}>
                  {progressPhotos.map((photo) => (
                    <TouchableOpacity
                      key={photo.id}
                      style={styles.progressThumb}
                      activeOpacity={0.88}
                      onPress={() => setSelectedPhoto(photo)}
                      accessibilityRole="button"
                      accessibilityLabel="Ver foto de progreso"
                    >
                      <Image source={{ uri: photo.url }} style={styles.progressThumbImg} />
                      <View style={styles.progressThumbDate}>
                        <Text style={styles.progressThumbDateText}>{formatDate(photo.date)}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  {uploadingProgress && (
                    <View style={[styles.progressThumb, styles.progressThumbLoading]}>
                      <ActivityIndicator size="small" color="#BF789C" />
                    </View>
                  )}
                </View>
              )}

              <View style={[styles.sectionTitleRow, { marginTop: 28 }]}>
                <Ionicons name="calendar-outline" size={13} color="#D6A4A4" />
                <Text style={styles.sectionTitle}>Mi actividad</Text>
              </View>
              <View style={styles.card}>
                <TouchableOpacity
                  style={styles.aboutRow}
                  onPress={() => navigation?.navigate('MisCitas')}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Ver mis citas"
                >
                  <Ionicons name="calendar-outline" size={17} color="#D6A4A4" />
                  <Text style={styles.aboutText}>Mis citas</Text>
                  <Ionicons name="chevron-forward" size={16} color="#CCC" />
                </TouchableOpacity>
              </View>

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

              <TouchableOpacity style={styles.logoutButton} onPress={async () => await logout()} activeOpacity={0.85}>
                <LinearGradient colors={['#E8A0A0', '#C47898']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGradient}>
                  <Ionicons name="log-out-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.submitText}>Cerrar sesión</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>

        {/* ── Modal foto de progreso ── */}
        <Modal visible={!!selectedPhoto} transparent animationType="fade" onRequestClose={() => setSelectedPhoto(null)}>
          <View style={styles.photoModal}>
            <View style={[styles.photoModalTop, { paddingTop: insets.top + 12 }]}>
              <View style={styles.photoModalDate}>
                <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.photoModalDateText}>{formatDate(selectedPhoto?.date)}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedPhoto(null)}
                style={styles.photoModalClose}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
              >
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {selectedPhoto && (
              <Image
                source={{ uri: selectedPhoto.url }}
                style={styles.photoModalImage}
                resizeMode="contain"
              />
            )}

            <View style={[styles.photoModalBottom, { paddingBottom: insets.bottom + 16 }]}>
              <TouchableOpacity
                style={styles.photoModalDelete}
                activeOpacity={0.8}
                onPress={() => handleDeletePhoto(selectedPhoto)}
              >
                <Ionicons name="trash-outline" size={18} color="#fff" />
                <Text style={styles.photoModalDeleteText}>Eliminar foto</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Unified export ─────────────────────────────────────────────────────────────

export default function ProfileScreen({ navigation }) {
  const { user } = useAuth();
  return user ? <ProfileView navigation={navigation} /> : <AuthView />;
}

// ── Styles ────────────────────────────────────────────────────────────────────

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
  headerRowCenter: {
    alignItems: 'center',
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
  avatarWrap: {
    marginBottom: 10,
    position: 'relative',
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
  },
  avatarPhoto: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#BF789C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarCircleGuest: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
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

  // toggle login/register
  toggleWrap: {
    flexDirection: 'row',
    backgroundColor: '#F5E8EC',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 13,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#BF789C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C0A0A8',
  },
  toggleTextActive: {
    color: '#BF789C',
    fontWeight: '700',
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

  // info rows
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

  // input rows
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

  // error
  errorText: {
    color: '#C44569',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 2,
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

  // buttons
  submitButton: {
    marginTop: 24,
    borderRadius: 18,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  logoutButton: {
    marginTop: 24,
    borderRadius: 18,
    overflow: 'hidden',
  },

  // progress photos
  progressAddBtn: {
    marginLeft: 'auto',
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#FDF0F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressEmpty: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  progressEmptyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#BF789C',
    textAlign: 'center',
  },
  progressEmptyHint: {
    fontSize: 12,
    color: '#CCC',
    textAlign: 'center',
  },
  progressGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: PHOTO_GAP,
  },
  progressThumb: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE * 1.25,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F5E8EC',
  },
  progressThumbImg: {
    width: '100%',
    height: '100%',
  },
  progressThumbDate: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(20,8,15,0.55)',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  progressThumbDateText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  progressThumbLoading: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // fullscreen photo modal
  photoModal: {
    flex: 1,
    backgroundColor: 'rgba(10,4,8,0.95)',
    justifyContent: 'space-between',
  },
  photoModalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  photoModalDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  photoModalDateText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '700',
  },
  photoModalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalImage: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
  photoModalBottom: {
    paddingHorizontal: 20,
    paddingTop: 16,
    alignItems: 'center',
  },
  photoModalDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(200,80,80,0.75)',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  photoModalDeleteText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // citas
  citasBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 0,
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  citasBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  citasBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  citasSubLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D6A4A4',
    letterSpacing: 1,
    marginBottom: 8,
  },
  citasEmpty: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
  citasEmptyText: {
    fontSize: 13,
    color: '#CCC',
    fontWeight: '600',
  },
  citaRow: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#C47898',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  citaAccent: {
    width: 5,
  },
  citaBody: {
    flex: 1,
    padding: 14,
  },
  citaTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  citaNombre: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2D2D2D',
    flex: 1,
  },
  citaCancelBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F5F0F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  citaDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  citaDate: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  citaEstado: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF8EC',
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  citaEstadoConfirmada: { backgroundColor: '#EDFFF5' },
  citaEstadoCancelada:  { backgroundColor: '#F5F5F5' },
  citaEstadoText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E5A020',
  },
});
