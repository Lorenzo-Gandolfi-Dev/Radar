// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCcetiW6Z15Azw5B9eDdD3-hMNLwteTPVM",
  authDomain: "radar-5b087.firebaseapp.com",
  projectId: "radar-5b087",
  storageBucket: "radar-5b087.firebasestorage.app",
  messagingSenderId: "536309589722",
  appId: "1:536309589722:web:d01beec27aa0e94ab9e7e3",
  measurementId: "G-QXLE6HXJG4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = firebase.database();

const sessionId = "demoSession";
const userId = "user_" + Math.random().toString(36).substring(2, 8);

const userRef = db.ref(`sessions/${sessionId}/users/${userId}`);

let myPosition = null;
let lastUpload = 0;
const UPLOAD_INTERVAL = 10_000; // 10 seconds

navigator.geolocation.watchPosition(
  pos => {
    myPosition = {
      lat: pos.coords.latitude,
      lon: pos.coords.longitude
    };

    const now = Date.now();
    if (now - lastUpload >= UPLOAD_INTERVAL) {
      lastUpload = now;

      userRef.set({
        ...myPosition,
        timestamp: now
      });
    }
  },
  err => console.error(err),
  { enableHighAccuracy: true }
);

const usersRef = db.ref(`sessions/${sessionId}/users`);
let otherUsers = {};

usersRef.on("value", snapshot => {
  otherUsers = snapshot.val() || {};
});

function distanceMeters(a, b) {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lon - a.lon) * Math.PI / 180;

  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function bearing(a, b) {
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const dLon = (b.lon - a.lon) * Math.PI / 180;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  return Math.atan2(y, x);
}

const canvas = document.getElementById("radar");
const ctx = canvas.getContext("2d");
const RADIUS = 200;
const MAX_DIST = 600;

function drawRadar() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Radar circle
  ctx.strokeStyle = "lime";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(RADIUS, RADIUS, RADIUS - 2, 0, Math.PI * 2);
  ctx.stroke();

  if (!myPosition) return;

  for (const id in otherUsers) {
    if (id === userId) continue;

    const u = otherUsers[id];
    const d = distanceMeters(myPosition, u);

    if (d > MAX_DIST) continue;

    const angle = bearing(myPosition, u);
    const r = (d / MAX_DIST) * RADIUS;

    const x = RADIUS + r * Math.sin(angle);
    const y = RADIUS - r * Math.cos(angle);

    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  requestAnimationFrame(drawRadar);
}

drawRadar();

