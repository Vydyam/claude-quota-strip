// src/storage.js
// Handles all chrome.storage read/write for session data

const STORAGE_KEY = 'ctt_sessions';

export async function getSessions() {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      resolve(result[STORAGE_KEY] || {});
    });
  });
}

export async function saveSession(sessionId, sessionData) {
  const sessions = await getSessions();
  sessions[sessionId] = sessionData;
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: sessions }, resolve);
  });
}

export async function clearSessions() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(STORAGE_KEY, resolve);
  });
}

export async function getSession(sessionId) {
  const sessions = await getSessions();
  return sessions[sessionId] || null;
}