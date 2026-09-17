export const LIVE_ORIGIN = "https://seansommer.github.io";
export const LIVE_HUB = `${LIVE_ORIGIN}/sujagamecenter/`;
export const SDK_VERSION = "12.18.0";
export const FIREBASE_CONFIG = Object.freeze({
  apiKey: "AIzaSyD8K2yjF8Z47DOzixxc4qMhBNFCF2Giv6Y",
  authDomain: "suja-game-center.firebaseapp.com",
  databaseURL: "https://suja-game-center-default-rtdb.firebaseio.com",
  projectId: "suja-game-center",
  storageBucket: "suja-game-center.firebasestorage.app",
  messagingSenderId: "247873198090",
  appId: "1:247873198090:web:50ea2a1e81646932cca7f3"
});
export const COMMUNITY_PATH='sujaV1';
export const FIREBASE_APP_NAME='SUJA_GAME_CENTER';
export const isConfigured=()=>Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.appId);
