import {
  applyActionCode,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  updateEmail as firebaseUpdateEmail,
  isSignInWithEmailLink,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signOut,
  updateProfile,
  verifyPasswordResetCode,
} from "firebase/auth";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, storage } from "./firebase.client";

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

const getAuthErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    // Sign up errors
    "auth/email-already-in-use": "An account with this email already exists",
    "auth/weak-password": "Password is too weak. Please choose a stronger password",
    "auth/invalid-email": "Please enter a valid email address",
    // Login errors
    "auth/user-not-found": "No account found with this email",
    "auth/wrong-password": "Incorrect password",
    "auth/invalid-credential": "Invalid email or password",
    "auth/too-many-requests": "Too many attempts. Please try again later",
    // Password reset errors
    "auth/user-disabled": "This account has been disabled",
    "auth/operation-not-allowed": "This operation is not allowed",
  };

  return errorMessages[errorCode] || "An error occurred. Please try again";
};

const handleAuthError = (error: unknown): never => {
  const firebaseError = error as { code?: string; message?: string };
  const message = firebaseError.code ? getAuthErrorMessage(firebaseError.code) : "An error occurred. Please try again";
  console.error(error);
  throw new AuthError(message);
};

export const login = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    handleAuthError(error);
  }
};

export const signUp = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    handleAuthError(error);
  }
};

export const logout = async () => {
  await signOut(auth);
};

export const getToken = async () => {
  const token = await auth.currentUser?.getIdToken();
  return token;
};

export const resetPassword = async (email: string) => {
  try {
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new AuthError(data.error || "Failed to send reset email");
    }
  } catch (error) {
    if (error instanceof AuthError) throw error;
    handleAuthError(error);
  }
};

export const confirmPasswordResetWithCode = async (oobCode: string, newPassword: string) => {
  try {
    const email = await verifyPasswordResetCode(auth, oobCode);
    await confirmPasswordReset(auth, oobCode, newPassword);
    // Sign in after password reset
    const userCredential = await signInWithEmailAndPassword(auth, email, newPassword);
    return userCredential.user;
  } catch (error) {
    handleAuthError(error);
  }
};

export const verifyEmail = async (oobCode: string) => {
  try {
    await applyActionCode(auth, oobCode);
  } catch (error) {
    handleAuthError(error);
  }
};

export const signInWithMagicLink = async (email: string, url: string) => {
  try {
    if (!isSignInWithEmailLink(auth, url)) {
      throw new AuthError("Invalid sign-in link");
    }
    const userCredential = await signInWithEmailLink(auth, email, url);
    return userCredential.user;
  } catch (error) {
    handleAuthError(error);
  }
};

export const checkIsSignInWithEmailLink = (url: string) => {
  return isSignInWithEmailLink(auth, url);
};

export const updateDisplayName = async (displayName: string) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new AuthError("No authenticated user found");
    }
    await updateProfile(user, { displayName });
    return user;
  } catch (error) {
    if (error instanceof AuthError) throw error;
    handleAuthError(error);
  }
};

export const updateUserEmail = async (newEmail: string) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new AuthError("No authenticated user found");
    }
    await firebaseUpdateEmail(user, newEmail);
    return user;
  } catch (error) {
    if (error instanceof AuthError) throw error;
    handleAuthError(error);
  }
};

export const uploadAvatar = async (uri: string) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new AuthError("No authenticated user found");
    }

    // Fetch the image and convert to blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Create a reference to the avatar in Firebase Storage
    const avatarRef = ref(storage, `avatars/${user.uid}`);

    // Upload the blob
    await uploadBytes(avatarRef, blob);

    // Get the download URL
    const downloadURL = await getDownloadURL(avatarRef);

    // Update the user's profile with the new photo URL
    await updateProfile(user, { photoURL: downloadURL });

    return downloadURL;
  } catch (error) {
    if (error instanceof AuthError) throw error;
    handleAuthError(error);
  }
};
