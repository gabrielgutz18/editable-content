const config = window.SITE_CONFIG || {};
const authForm = document.querySelector("#authForm");
const statusText = document.querySelector("#statusText");
const signOutBtn = document.querySelector("#signOutBtn");

let client = null;

function hasSupabaseConfig() {
  return Boolean(
    config.supabaseUrl &&
    config.supabaseAnonKey &&
    !config.supabaseUrl.includes("YOUR-PROJECT") &&
    !config.supabaseAnonKey.includes("YOUR_PUBLIC_ANON_KEY")
  );
}

function initSupabase() {
  if (!hasSupabaseConfig() || !window.supabase) return null;
  return window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
}

function setStatus(message, type = "warn") {
  statusText.textContent = message;
  statusText.className = type === "good" ? "status-good" : "status-warn";
}

function value(id) {
  return document.querySelector(`#${id}`).value.trim();
}

async function checkExistingSession() {
  if (!client) return;

  const { data: sessionData } = await client.auth.getSession();
  if (sessionData.session?.user?.email) {
    window.location.href = "dashboard.html";
  }
}

async function signIn(event) {
  event.preventDefault();
  
  if (!client) {
    setStatus("Add your Supabase URL and anon key before signing in.");
    return;
  }

  const email = value("adminEmail");
  const password = value("adminPassword");
  
  if (!email || !password) {
    setStatus("Please enter both email and password.");
    return;
  }

  setStatus("Signing in...", "good");

  const { data, error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    setStatus(`Sign in failed: ${error.message}`);
    return;
  }

  if (data.session?.user?.email) {
    setStatus(`Signed in as ${data.session.user.email}. Redirecting...`, "good");
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 500);
  }
}

async function signOut() {
  if (!client) return;
  await client.auth.signOut();
  setStatus("Signed out.", "good");
  document.querySelector("#adminEmail").value = "";
  document.querySelector("#adminPassword").value = "";
}

async function init() {
  client = initSupabase();

  if (!client) {
    setStatus("Supabase is not configured yet.");
    return;
  }

  setStatus("Ready to sign in", "good");
  await checkExistingSession();
}

authForm.addEventListener("submit", signIn);
signOutBtn.addEventListener("click", signOut);

init();
