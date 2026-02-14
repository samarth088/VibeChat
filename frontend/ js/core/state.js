// js/core/state.js
(function () {
  if (!window.App) window.App = {};
  const listeners = new Set();

  // initial state shape — extend as needed
  const state = {
    currentUser: null,
    chats: {},        // map chatId -> meta
    messages: {},     // map messageId -> message
    ui: {
      activeChatId: null,
      isConnected: false,
      typing: {}      // chatId -> [userId]
    }
  };

  // deep merge helper (simple, safe)
  function isObject(v) { return v && typeof v === 'object' && !Array.isArray(v); }
  function deepMerge(target, patch) {
    Object.keys(patch).forEach(key => {
      const p = patch[key];
      if (isObject(p) && isObject(target[key])) {
        deepMerge(target[key], p);
      } else {
        target[key] = p;
      }
    });
  }

  // notify subscribers: each listener gets (changedPaths, newStateSnapshot)
  function notify(changedPaths = []) {
    const snapshot = JSON.parse(JSON.stringify(state));
    listeners.forEach(l => {
      try { l.callback(changedPaths, snapshot); } catch (err) { console.error("listener error", err); }
    });
  }

  // subscribe: callback(changedPaths, stateSnapshot)
  // returns unsubscribe
  function subscribe(callback) {
    const id = Symbol("listener");
    listeners.add({ id, callback });
    // send immediate state
    callback([], JSON.parse(JSON.stringify(state)));
    return () => {
      for (let item of listeners) {
        if (item.id === id) { listeners.delete(item); break; }
      }
    };
  }

  // targeted subscribe: watch a top-level key (e.g., 'ui' or 'chats')
  function subscribeKey(key, callback) {
    let last = JSON.stringify(state[key]);
    const wrapper = (changedPaths, snapshot) => {
      const curr = JSON.stringify(snapshot[key]);
      if (curr !== last) {
        last = curr;
        callback(snapshot[key]);
      }
    };
    return subscribe(wrapper);
  }

  function getState() {
    return JSON.parse(JSON.stringify(state)); // immutable snapshot
  }

  // patch = partial object to merge into root
  function setState(patch) {
    if (!isObject(patch)) throw new Error("patch must be an object");
    deepMerge(state, patch);
    const changed = Object.keys(patch);
    notify(changed);
    return getState();
  }

  // helper: replace whole store (rare)
  function replaceState(newState) {
    if (!isObject(newState)) throw new Error("newState must be an object");
    Object.keys(state).forEach(k => delete state[k]);
    Object.keys(newState).forEach(k => state[k] = newState[k]);
    notify(Object.keys(newState));
  }

  // convenience: update message map, chat map
  function upsertMessages(arr) {
    if (!Array.isArray(arr)) arr = [arr];
    const patch = { messages: {} };
    arr.forEach(m => { patch.messages[m.id] = m; });
    setState(patch);
  }

  function upsertChats(arr) {
    if (!Array.isArray(arr)) arr = [arr];
    const patch = { chats: {} };
    arr.forEach(c => { patch.chats[c.id] = c; });
    setState(patch);
  }

  window.App.state = {
    getState,
    setState,
    replaceState,
    subscribe,
    subscribeKey,
    upsertMessages,
    upsertChats
  };
})();
