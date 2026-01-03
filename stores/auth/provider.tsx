import { auth, db } from "@/integrations/firebase.client";
import { tenantKeys, TenantType, useAuthStore } from "@/stores/auth/store";
import type { TenantData } from "@/types/tenants";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore";
import React, { createContext, PropsWithChildren, useEffect, useRef } from "react";

interface AuthContextType {}

// Create AuthContext to provide the user data
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({ children }: PropsWithChildren): React.ReactElement => {
  const { user, loading, setUser, setLoading, setIsAdmin, setTenantData, setAllTenantsLoading, setBatchTenantData, resetAuth } =
    useAuthStore();

  const unsubscribersRef = useRef<(() => void)[]>([]);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Get admin status from custom claims
        const { claims } = await firebaseUser.getIdTokenResult();
        setIsAdmin((claims.admin as boolean) ?? false);
      } else {
        // User logged out - reset all auth state
        resetAuth();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading, setIsAdmin, resetAuth]);

  // Tenant realtime subscriptions
  useEffect(() => {
    // Clean up previous subscriptions
    unsubscribersRef.current.forEach((unsub) => unsub());
    unsubscribersRef.current = [];

    // Skip tenant subscriptions if user is not logged in
    if (!user?.uid) {
      return;
    }

    const uid = user.uid;

    // Build queries for all tenant types
    const tenantQueries = tenantKeys.map((tenantType) => ({
      tenantType,
      query: query(collection(db, tenantType), where(`users.${uid}`, "==", true)),
    }));

    // Fetch all tenant data at once, then set up realtime listeners
    const initTenants = async () => {
      setAllTenantsLoading(true);

      // Fetch all in parallel
      const results = await Promise.all(
        tenantQueries.map(async ({ tenantType, query: q }) => {
          try {
            const snapshot = await getDocs(q);
            const items: TenantData[] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as TenantData);
            return { tenantType, items };
          } catch (error) {
            console.error(`Error fetching ${tenantType}:`, error);
            return { tenantType, items: [] as TenantData[] };
          }
        })
      );

      // Batch update all tenant data at once (single state update)
      const batchData = results.reduce(
        (acc, { tenantType, items }) => ({ ...acc, [tenantType]: items }),
        {} as Record<TenantType, TenantData[]>
      );
      setBatchTenantData(batchData);

      // Set up realtime listeners for subsequent updates
      tenantQueries.forEach(({ tenantType, query: q }) => {
        const unsubscribe = onSnapshot(
          q,
          (querySnapshot) => {
            const items: TenantData[] = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as TenantData);
            setTenantData(tenantType, items);
          },
          (error) => {
            console.error(`Error in ${tenantType} listener:`, error);
          }
        );
        unsubscribersRef.current.push(unsubscribe);
      });
    };

    initTenants();

    // Cleanup subscriptions on unmount or user change
    return () => {
      unsubscribersRef.current.forEach((unsub) => unsub());
      unsubscribersRef.current = [];
    };
  }, [user?.uid, setTenantData, setAllTenantsLoading, setBatchTenantData]);

  return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
