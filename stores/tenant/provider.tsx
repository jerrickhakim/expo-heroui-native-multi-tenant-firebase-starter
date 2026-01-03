import appConfig from "@/_config.json";
import { db } from "@/integrations/firebase.client";
import { useAuth } from "@/stores/auth";
import type { TenantConfig, TenantData, TenantUserData } from "@/types/tenants";
import { doc, onSnapshot } from "firebase/firestore";
import React, { createContext, PropsWithChildren, useEffect } from "react";
import { useTenantStore } from "./store";

interface TenantProviderProps extends PropsWithChildren {
  collection: string;
  tenantId: string;
}

interface TenantContextType {}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

const TenantProvider = ({ collection, tenantId, children }: TenantProviderProps): React.ReactElement => {
  const { user } = useAuth();

  const { setLoading, setConfig, setTenant, setUserAccess, setError, reset, setCollection, setTenantId } = useTenantStore();

  // Set config from _config.json based on collection
  useEffect(() => {
    if (!collection) {
      setConfig(null);
      return;
    }
    setCollection(collection);
    setTenantId(tenantId);

    const tenantConfig = appConfig.tenants[collection as keyof typeof appConfig.tenants];
    if (tenantConfig) {
      setConfig({
        collection: collection,
        ...tenantConfig,
      } as TenantConfig);
    } else {
      setConfig(null);
    }
  }, [collection, setConfig]);

  // Subscribe to tenant document
  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      setError("Tenant ID is required");
      return;
    }

    setLoading(true);
    setError(null);

    const tenantRef = doc(db, collection, tenantId);
    const unsubscribe = onSnapshot(
      tenantRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setTenant({
            id: snapshot.id,
            ...snapshot.data(),
          } as TenantData);
          setError(null);
        } else {
          setTenant(null);
          setError("Tenant not found");
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setTenant(null);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      reset();
    };
  }, [collection, tenantId, setLoading, setTenant, setError, reset]);

  // Subscribe to user access document
  useEffect(() => {
    if (!tenantId || !user?.uid) {
      setUserAccess(null);
      return;
    }

    const userAccessRef = doc(db, `${collection}/${tenantId}/users`, user.uid);
    const unsubscribe = onSnapshot(
      userAccessRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setUserAccess(snapshot.data() as TenantUserData);
        } else {
          setUserAccess(null);
        }
      },
      (err) => {
        console.error("Error fetching user access:", err);
        setUserAccess(null);
      }
    );

    return () => unsubscribe();
  }, [collection, tenantId, user?.uid, setUserAccess]);

  return <TenantContext.Provider value={{}}>{children}</TenantContext.Provider>;
};

export default TenantProvider;
