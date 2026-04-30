import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { supabase } from "./supabase";
import { useAuth } from "./auth-context";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn("Push notification setup skipped: physical device required.");
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn(`Push notification setup skipped: permission is ${finalStatus}.`);
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.warn("Push notification setup skipped: missing EAS project ID.");
    return null;
  }

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
}

export function usePushRegistration() {
  const { user } = useAuth();
  const registered = useRef(false);

  useEffect(() => {
    if (!user || registered.current) return;

    async function register() {
      try {
        const token = await registerForPushNotifications();
        if (!token || !user) return;

        const platform = Platform.OS === "ios" ? "ios" : "android";
        const { error } = await supabase.from("push_tokens").upsert(
          { user_id: user.id, token, platform },
          { onConflict: "token" }
        );
        if (error) {
          console.warn("Push token registration failed:", error.message);
          return;
        }
        registered.current = true;
      } catch (error) {
        console.warn("Push notification setup failed:", error);
      }
    }

    void register();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && !registered.current) {
        void register();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [user]);
}
