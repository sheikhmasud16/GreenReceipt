import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
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
  emailVerified: boolean;
  registerUser: (data: RegisterData) => Promise<void>;
  loginUser: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  checkEmailVerified: () => Promise<boolean>;
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
  const [emailVerified, setEmailVerified] = useState<boolean>(false);

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
        setEmailVerified(user.emailVerified);
        await fetchProfile(user);
      } else {
        setProfile(null);
        setEmailVerified(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const registerUser = async (data: RegisterData) => {
    // 1. Create user in Firebase Authentication
    const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);

    // 2. Automatically dispatch Firebase email verification link to user's registered email
    try {
      await sendEmailVerification(cred.user);
    } catch (verErr) {
      console.warn('Could not automatically send verification email:', verErr);
    }

    // 3. Create business profile document in Firestore
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

    setCurrentUser(cred.user);
    setEmailVerified(cred.user.emailVerified);
  };

  const loginUser = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    setCurrentUser(cred.user);
    setEmailVerified(cred.user.emailVerified);
    await fetchProfile(cred.user);
  };

  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    setCurrentUser(cred.user);
    setEmailVerified(cred.user.emailVerified);
    await fetchProfile(cred.user);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const sendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const checkEmailVerified = async (): Promise<boolean> => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      const verified = auth.currentUser.emailVerified;
      setEmailVerified(verified);
      setCurrentUser({ ...auth.currentUser } as User);
      return verified;
    }
    return false;
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
    setCurrentUser(null);
    setEmailVerified(false);
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
        emailVerified,
        registerUser,
        loginUser,
        loginWithGoogle,
        resetPassword,
        sendVerificationEmail,
        checkEmailVerified,
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
