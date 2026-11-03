/*
 * SAP-C02 Study Buddy — appearance (light / dark / system).
 *
 * Loaded in <head> before the stylesheets, so the right theme is applied
 * before the first paint and there is no flash of the wrong colours.
 *
 * The stored preference ("light", "dark" or "system") is kept separate from
 * the resolved theme on <html data-theme="light|dark">. In system mode the
 * resolved theme follows prefers-color-scheme, including live changes.
 *
 * The preference is a display setting, not learner progress: it lives under
 * its own key, so Reset Progress and progress export/import leave it alone.
 */
(function () {
  const KEY = "sapc02-theme";
  const PREFERENCES = ["light", "dark", "system"];
  const query = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  const listeners = [];

  function readPreference() {
    try {
      const value = localStorage.getItem(KEY);
      return PREFERENCES.includes(value) ? value : "system";
    } catch {
      return "system";
    }
  }

  let preference = readPreference();

  function resolve(pref) {
    if (pref === "system") return query && query.matches ? "dark" : "light";
    return pref;
  }

  function apply() {
    const root = document.documentElement;
    root.setAttribute("data-theme", resolve(preference));
    root.setAttribute("data-theme-preference", preference);
    listeners.forEach((fn) => fn(preference, resolve(preference)));
  }

  function setPreference(pref) {
    if (!PREFERENCES.includes(pref)) return;
    preference = pref;
    try {
      if (pref === "system") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, pref);
    } catch {
      // Storage can be unavailable (private mode); the choice still applies to this page.
    }
    apply();
  }

  if (query) {
    const onSystemChange = () => {
      if (preference === "system") apply();
    };
    if (query.addEventListener) query.addEventListener("change", onSystemChange);
    else if (query.addListener) query.addListener(onSystemChange);
  }

  // Another tab changed the preference.
  window.addEventListener("storage", (event) => {
    if (event.key === KEY) {
      preference = readPreference();
      apply();
    }
  });

  apply();

  window.SAPC02Theme = {
    preferences: PREFERENCES.slice(),
    get preference() {
      return preference;
    },
    get resolved() {
      return resolve(preference);
    },
    set: setPreference,
    onChange(fn) {
      listeners.push(fn);
    },
  };
})();
