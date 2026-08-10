import { FirebaseAnalytics } from '@capacitor-community/firebase-analytics';
import { Capacitor } from '@capacitor/core';

export const AnalyticsService = {
  logEvent: async (eventName, params = {}) => {
    try {
      if (Capacitor.isNativePlatform()) {
        await FirebaseAnalytics.logEvent({ name: eventName, params });
      } else {
        console.log(`[Web Analytics] ${eventName}`, params);
      }
    } catch (e) {
      console.error("Analytics Error: ", e);
    }
  },
  identify: async (userId) => {
    try {
      if (Capacitor.isNativePlatform()) {
        await FirebaseAnalytics.setUserId({ userId });
      } else {
        console.log(`[Web Analytics] Identify User: ${userId}`);
      }
    } catch (e) {
      console.error("Analytics Error: ", e);
    }
  }
};
