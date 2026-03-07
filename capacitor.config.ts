import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.edyonbike.app",
  appName: "Edy on Bike",
  webDir: "out",
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1500,
      backgroundColor: "#18181b",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      overlaysWebView: true,
    },
  },
};

export default config;
