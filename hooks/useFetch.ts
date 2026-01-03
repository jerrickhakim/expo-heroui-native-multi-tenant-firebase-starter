import { useAuth } from "@/stores/auth";
import * as Haptics from "expo-haptics";
import { useToast } from "heroui-native";
import { useCallback, useState } from "react";

// Request methods
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// Response structure for API calls
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// Options for individual fetch calls
interface FetchOptions<TBody = unknown> {
  method?: HttpMethod;
  body?: TBody;
  headers?: Record<string, string>;
}

// Configuration options for the hook
interface UseFetchConfig {
  useToast?: boolean;
  useHaptics?: boolean;
  // Custom messages for toast notifications
  successMessage?: string;
  errorMessage?: string;
  // Base URL prefix
  baseUrl?: string;
}

// Return type for the hook
interface UseFetchReturn<TData> {
  data: TData | null;
  error: string | null;
  loading: boolean;
  execute: <TBody = unknown>(url: string, options?: FetchOptions<TBody>) => Promise<ApiResponse<TData>>;
  reset: () => void;
}

/**
 * Custom fetch hook with toast notifications and haptic feedback
 *
 * Features:
 * - Automatic Firebase auth token injection
 * - Optional toast notifications on success/error
 * - Optional haptic feedback on success/error
 * - Loading state management
 * - Type-safe request/response handling
 *
 * @example
 * ```typescript
 * // Basic usage
 * const { data, loading, execute } = useFetch<User[]>();
 * await execute("/api/users");
 *
 * // With toast and haptics enabled
 * const { execute } = useFetch<User>({
 *   useToast: true,
 *   useHaptics: true,
 *   successMessage: "User created successfully!",
 * });
 * await execute("/api/users", { method: "POST", body: { name: "John" } });
 *
 * // With custom error message
 * const { execute } = useFetch({
 *   useToast: true,
 *   errorMessage: "Failed to load users",
 * });
 * ```
 */
export default function useFetch<TData = unknown>(config: UseFetchConfig = {}): UseFetchReturn<TData> {
  const { useToast: enableToast = false, useHaptics: enableHaptics = false, successMessage, errorMessage, baseUrl = "" } = config;

  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  // Haptic feedback helpers
  const triggerSuccessHaptic = useCallback(async () => {
    if (enableHaptics) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [enableHaptics]);

  const triggerErrorHaptic = useCallback(async () => {
    if (enableHaptics) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [enableHaptics]);

  // Toast notification helpers
  const showSuccessToast = useCallback(
    (message: string) => {
      if (enableToast) {
        toast.show({
          variant: "success",
          label: message,
          actionLabel: "Dismiss",
          onActionPress: ({ hide }) => hide(),
        });
      }
    },
    [enableToast, toast]
  );

  const showErrorToast = useCallback(
    (message: string) => {
      if (enableToast) {
        toast.show({
          variant: "danger",
          label: "Error",
          description: message,
          actionLabel: "Dismiss",
          onActionPress: ({ hide }) => hide(),
        });
      }
    },
    [enableToast, toast]
  );

  // Main execute function
  const execute = useCallback(
    async <TBody = unknown>(url: string, options: FetchOptions<TBody> = {}): Promise<ApiResponse<TData>> => {
      const { method = "GET", body, headers = {} } = options;

      setLoading(true);
      setError(null);

      try {
        // Get auth token if user is authenticated
        const token = user ? await user.getIdToken() : null;

        const requestHeaders: Record<string, string> = {
          "Content-Type": "application/json",
          ...headers,
        };

        if (token) {
          requestHeaders["Authorization"] = `Bearer ${token}`;
        }

        const fetchOptions: RequestInit = {
          method,
          headers: requestHeaders,
        };

        // Add body for non-GET requests
        if (body && method !== "GET") {
          fetchOptions.body = JSON.stringify(body);
        }

        const fullUrl = `${baseUrl}${url}`;
        const response = await fetch(fullUrl, fetchOptions);

        // Parse response
        let responseData: TData | null = null;
        const contentType = response.headers.get("content-type");

        if (contentType?.includes("application/json")) {
          responseData = await response.json();
        }

        if (!response.ok) {
          // Extract error message from response or use default
          const errorMsg =
            (responseData as { message?: string; error?: string })?.message ||
            (responseData as { message?: string; error?: string })?.error ||
            errorMessage ||
            `Request failed with status ${response.status}`;

          throw new Error(errorMsg);
        }

        // Success!
        setData(responseData);
        setLoading(false);

        // Trigger success feedback
        await triggerSuccessHaptic();
        if (successMessage) {
          showSuccessToast(successMessage);
        }

        return {
          data: responseData,
          error: null,
          success: true,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : errorMessage || "An unexpected error occurred";

        setError(errorMsg);
        setData(null);
        setLoading(false);

        // Trigger error feedback
        await triggerErrorHaptic();
        showErrorToast(errorMsg);

        return {
          data: null,
          error: errorMsg,
          success: false,
        };
      }
    },
    [user, baseUrl, errorMessage, successMessage, triggerSuccessHaptic, triggerErrorHaptic, showSuccessToast, showErrorToast]
  );

  // Reset state
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    error,
    loading,
    execute,
    reset,
  };
}

/**
 * Convenience hook for GET requests with auto-fetch on mount
 *
 * @example
 * ```typescript
 * const { data, loading, refetch } = useFetchGet<User[]>("/api/users", {
 *   useToast: true,
 * });
 * ```
 */
export function useFetchGet<TData = unknown>(url: string, config: UseFetchConfig = {}) {
  const { execute, ...rest } = useFetch<TData>(config);

  const refetch = useCallback(() => {
    return execute(url, { method: "GET" });
  }, [execute, url]);

  return {
    ...rest,
    execute,
    refetch,
  };
}

/**
 * Convenience hook for mutation operations (POST, PUT, PATCH, DELETE)
 *
 * @example
 * ```typescript
 * const { mutate, loading } = useMutation<User>({
 *   useToast: true,
 *   useHaptics: true,
 *   successMessage: "User updated!",
 * });
 *
 * await mutate("/api/users/1", { method: "PUT", body: userData });
 * ```
 */
export function useMutation<TData = unknown>(config: UseFetchConfig = {}) {
  const { execute, ...rest } = useFetch<TData>(config);

  const mutate = useCallback(
    <TBody = unknown>(url: string, options: FetchOptions<TBody> = {}) => {
      return execute(url, { method: "POST", ...options });
    },
    [execute]
  );

  return {
    ...rest,
    mutate,
    execute,
  };
}
