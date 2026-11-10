import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types';

interface RegisterData {
  businessName: string;
  mobile: string;
  email: string;
  address: string;
  password: string;
}

interface AuthContextType {
  currentUser: User | null;
  profile: UserProfile | null;
  loading: boolean;
  registerUser: (data: RegisterData) => Promise<void>;
  loginUser: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updatedData: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const defaultProfile: UserProfile = {
  businessName: 'My Business',
  mobile: '',
  email: '',
  address: '',
  currency: 'BDT',
  receiptPrefix: 'REC-',
  receiptPaperSize: 'a4',
  receiptStyle: 'green',
  preferredLanguage: 'bn',
  allowNegativeStock: false,
  receiptFooter: 'Thank you for your business! Please come again.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch or initialize user profile document in Firestore
  const fetchProfile = async (user: User) => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const snapshot = await getDoc(userDocRef);

      if (snapshot.exists()) {
        setProfile(snapshot.data() as UserProfile);
      } else {
        // Create initial profile for Google Sign-In or new user
        const initialProfile: UserProfile = {
          ...defaultProfile,
          businessName: user.displayName || 'Smart Business',
          email: user.email || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, initialProfile);
        setProfile(initialProfile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchProfile(user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const registerUser = async (data: RegisterData) => {
    const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const newProfile: UserProfile = {
      ...defaultProfile,
      businessName: data.businessName,
      mobile: data.mobile,
      email: data.email,
      address: data.address,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', cred.user.uid), newProfile);
      setProfile(newProfile);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${cred.user.uid}`);
    }
  };

  const loginUser = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    await fetchProfile(cred.user);
  };

  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    await fetchProfile(cred.user);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
    setCurrentUser(null);
  };

  const updateProfile = async (updatedData: Partial<UserProfile>) => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const payload = {
        ...updatedData,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(userRef, payload);
      setProfile((prev) => (prev ? { ...prev, ...payload } : null));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchProfile(currentUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        profile,
        loading,
        registerUser,
        loginUser,
        loginWithGoogle,
        resetPassword,
        logout,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
