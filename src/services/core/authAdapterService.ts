import {
  getCurrentProfile,
  getCurrentUser,
  getSession,
  onAuthStateChange,
  signInWithEmail,
  signOutAuth,
  signUpWithEmail,
  updateProfileRow,
  createProfileForUser,
} from "@/lib/auth/authService";

export const signInWithEmailAdapter = signInWithEmail;
export const signUpWithEmailAdapter = signUpWithEmail;
export const signOutAdapter = signOutAuth;
export const getCurrentUserAdapter = getCurrentUser;
export const getSessionAdapter = getSession;
export const onAuthStateChangeAdapter = onAuthStateChange;
export const getCurrentProfileAdapter = getCurrentProfile;
export const createProfileForUserAdapter = createProfileForUser;
export const updateProfileAdapter = updateProfileRow;

