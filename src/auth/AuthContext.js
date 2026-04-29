import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  updateEmail,
  updatePassword,
  signOut,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID = '242764281250-5iihdnpdb253vtlvdar18n0dmskcgadg.apps.googleusercontent.com';
const PROXY_REDIRECT_URI = 'https://auth.expo.io/@paolaruiz/my-beauty-calendar';

const AuthContext = createContext({
  user: null,
  isLoading: true,
  loginWithEmail: async () => {},
  registerWithEmail: async () => {},
  logout: async () => {},
  googleRequest: null,
  promptGoogleAsync: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    clientId: WEB_CLIENT_ID,
    redirectUri: PROXY_REDIRECT_URI,
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? null);
      setIsLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const accessToken =
        googleResponse.authentication?.accessToken ??
        googleResponse.params?.access_token;
      if (accessToken) {
        const credential = GoogleAuthProvider.credential(null, accessToken);
        signInWithCredential(auth, credential).catch(() => {});
      }
    }
  }, [googleResponse]);

  const loginWithEmail = async (email, password) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const registerWithEmail = async (name, email, password) => {
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(newUser, { displayName: name.trim() });
    setUser({ ...newUser, displayName: name.trim() });
  };

  const updateUser = async (name, email, newPassword) => {
    const currentUser = auth.currentUser;
    if (name && name !== currentUser.displayName) {
      await updateProfile(currentUser, { displayName: name });
    }
    if (email && email !== currentUser.email) {
      await updateEmail(currentUser, email);
    }
    if (newPassword) {
      await updatePassword(currentUser, newPassword);
    }
    setUser({ ...auth.currentUser });
  };

  const updatePhoto = async (photoURL) => {
    await updateProfile(auth.currentUser, { photoURL });
    setUser({ ...auth.currentUser });
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      loginWithEmail,
      registerWithEmail,
      updateUser,
      updatePhoto,
      logout,
      googleRequest,
      promptGoogleAsync,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
