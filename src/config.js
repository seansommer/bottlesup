export const LIVE_ORIGIN = "https://seansommer.github.io";
export const LIVE_HUB = `${LIVE_ORIGIN}/sujagamecenter/`;
export const SDK_VERSION = "12.18.0";
// Fill apiKey and appId from the new Firebase project's Web app settings.
// Firebase web configuration is public; never place admin credentials here.
export const FIREBASE_CONFIG = Object.freeze({
  apiKey: "",
  authDomain: "suja-game-center.firebaseapp.com",
  databaseURL: "https://suja-game-center-default-rtdb.firebaseio.com",
  projectId: "suja-game-center",
  appId: ""
});
export const COMMUNITY_PATH='sujaV1';
export const FIREBASE_APP_NAME='SUJA_GAME_CENTER';
export const isConfigured=()=>Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.appId);
