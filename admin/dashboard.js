const defaultContent = {
  hero: {
    eyebrow: "Fresh pages, edited by you",
    title: "A homepage your team can update anytime.",
    subtitle: "Change the hero banner, welcome message, images, and homepage sections from the admin page without touching the code.",
    buttonText: "Explore the page",
    buttonLink: "#welcome",
    imageUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=80"
  },
  welcome: {
    title: "Welcome to a simpler way to keep your site current.",
    text: "This section is designed for quick edits: update the headline, body text, image, and call to action from the admin dashboard. The public page automatically reads the latest saved content from Supabase.",
    buttonText: "Manage content",
    buttonLink: "admin/admin.html",
    imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80"
  },
  blocks: [
    {
      id: "planning",
      title: "Flexible sections",
      text: "Add, remove, and reorder homepage blocks from the admin page.",
      buttonText: "Learn more",
      buttonLink: "#sections",
      imageUrl: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=900&q=80"
    },
    {
      id: "updates",
      title: "Fast updates",
      text: "Save text and images in one place so the homepage stays easy to maintain.",
      buttonText: "Open admin",
      buttonLink: "admin/admin.html",
      imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80"
    }
  ]
};

const config = window.SITE_CONFIG || {};
const form = document.querySelector("#contentForm");
const blocksEditor = document.querySelector("#blocksEditor");
const statusText = document.querySelector("#statusText");
const addBlockBtn = document.querySelector("#addBlockBtn");
const resetBtn = document.querySelector("#resetBtn");
const signOutBtn = document.querySelector("#signOutBtn");

let content = structuredClone(defaultContent);
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

function uniqueId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function mergeContent(savedContent) {
  return {
    ...defaultContent,
    ...(savedContent || {}),
    hero: { ...defaultContent.hero, ...(savedContent?.hero || {}) },
    welcome: { ...defaultContent.welcome, ...(savedContent?.welcome || {}) },
    blocks: Array.isArray(savedContent?.blocks) ? savedContent.blocks : defaultContent.blocks
  };
}

async function checkAuth() {
  if (!client) {
    setStatus("Supabase is not configured yet.");
    return false;
  }

  const { data: sessionData } = await client.auth.getSession();
  if (!sessionData.session) {
    window.location.href = "admin.html";
    return false;
  }

  setStatus(`Signed in as ${sessionData.session.user.email}. Changes will save to Supabase.`, "good");
  return true;
}

async function loadContent() {
  client = initSupabase();

  const isAuth = await checkAuth();
  if (!isAuth && client) return;

  if (!client) {
    const local = localStorage.getItem("homepage_content_preview");
    content = mergeContent(local ? JSON.parse(local) : defaultContent);
    renderForm();
    return;
  }

  const { data, error } = await client
    .from(config.tableName || "site_content")
    .select("content")
    .eq("id", config.rowId || "homepage")
    .maybeSingle();

  if (error) {
    setStatus(`Supabase read error: ${error.message}`);
    content = mergeContent(defaultContent);
  } else {
    content = mergeContent(data?.content || defaultContent);
  }

  renderForm();
}

function renderForm() {
  setValue("heroEyebrow", content.hero.eyebrow);
  setValue("heroTitle", content.hero.title);
  setValue("heroSubtitle", content.hero.subtitle);
  setValue("heroButtonText", content.hero.buttonText);
  setValue("heroButtonLink", content.hero.buttonLink);
  setValue("heroImageUrl", content.hero.imageUrl);

  setValue("welcomeTitle", content.welcome.title);
  setValue("welcomeText", content.welcome.text);
  setValue("welcomeButtonText", content.welcome.buttonText);
  setValue("welcomeButtonLink", content.welcome.buttonLink);
  setValue("welcomeImageUrl", content.welcome.imageUrl);

  renderBlocks();
  refreshIcons();
}

function renderBlocks() {
  blocksEditor.innerHTML = content.blocks.map((block, index) => `
    <article class="block-card" data-block-id="${escapeHtml(block.id)}">
      <div class="block-toolbar">
        <strong>Element ${index + 1}</strong>
        <div class="tool-cluster">
          <button type="button" class="icon-button small-icon" data-action="up" title="Move up">
            <i data-lucide="arrow-up"></i>
          </button>
          <button type="button" class="icon-button small-icon" data-action="down" title="Move down">
            <i data-lucide="arrow-down"></i>
          </button>
          <button type="button" class="icon-button danger-button" data-action="remove" title="Remove element">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>
      <div class="block-fields">
        <label class="wide-field">
          Title
          <input type="text" data-field="title" value="${escapeHtml(block.title)}">
        </label>
        <label class="wide-field">
          Text
          <textarea data-field="text" rows="3">${escapeHtml(block.text)}</textarea>
        </label>
        <label>
          Button text
          <input type="text" data-field="buttonText" value="${escapeHtml(block.buttonText)}">
        </label>
        <label>
          Button link
          <input type="text" data-field="buttonLink" value="${escapeHtml(block.buttonLink)}">
        </label>
        <label>
          Image URL
          <input type="url" data-field="imageUrl" value="${escapeHtml(block.imageUrl)}">
        </label>
        <label class="file-field">
          Upload image
          <input type="file" data-field="imageFile" accept="image/*">
        </label>
      </div>
    </article>
  `).join("");
}

function setValue(id, value) {
  document.querySelector(`#${id}`).value = value || "";
}

function value(id) {
  return document.querySelector(`#${id}`).value.trim();
}

function collectTextContent() {
  content = {
    hero: {
      eyebrow: value("heroEyebrow"),
      title: value("heroTitle"),
      subtitle: value("heroSubtitle"),
      buttonText: value("heroButtonText"),
      buttonLink: value("heroButtonLink"),
      imageUrl: value("heroImageUrl")
    },
    welcome: {
      title: value("welcomeTitle"),
      text: value("welcomeText"),
      buttonText: value("welcomeButtonText"),
      buttonLink: value("welcomeButtonLink"),
      imageUrl: value("welcomeImageUrl")
    },
    blocks: [...document.querySelectorAll(".block-card")].map((card) => ({
      id: card.dataset.blockId,
      title: card.querySelector('[data-field="title"]').value.trim(),
      text: card.querySelector('[data-field="text"]').value.trim(),
      buttonText: card.querySelector('[data-field="buttonText"]').value.trim(),
      buttonLink: card.querySelector('[data-field="buttonLink"]').value.trim(),
      imageUrl: card.querySelector('[data-field="imageUrl"]').value.trim()
    }))
  };
}

async function collectImages() {
  content.hero.imageUrl = await imageValue("heroImageFile", content.hero.imageUrl, "hero");
  content.welcome.imageUrl = await imageValue("welcomeImageFile", content.welcome.imageUrl, "welcome");

  const blockCards = [...document.querySelectorAll(".block-card")];
  for (const [index, card] of blockCards.entries()) {
    const fileInput = card.querySelector('[data-field="imageFile"]');
    content.blocks[index].imageUrl = await uploadOrEncode(fileInput.files[0], content.blocks[index].imageUrl, `block-${index + 1}`);
  }
}

async function imageValue(inputId, fallbackUrl, folder) {
  const file = document.querySelector(`#${inputId}`).files[0];
  return uploadOrEncode(file, fallbackUrl, folder);
}

async function uploadOrEncode(file, fallbackUrl, folder) {
  if (!file) return fallbackUrl;

  if (!client) {
    return readFileAsDataUrl(file);
  }

  const extension = file.name.split(".").pop() || "jpg";
  const path = `${folder}/${uniqueId()}.${extension}`;
  const { error } = await client.storage
    .from(config.storageBucket || "site-images")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  const { data } = client.storage
    .from(config.storageBucket || "site-images")
    .getPublicUrl(path);

  return data.publicUrl;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function saveContent(event) {
  event.preventDefault();
  collectTextContent();
  setStatus("Saving homepage...", "good");

  try {
    await collectImages();

    if (!client) {
      localStorage.setItem("homepage_content_preview", JSON.stringify(content));
      setStatus("Saved locally in this browser. Add Supabase config for live publishing.", "good");
      renderForm();
      return;
    }

    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) {
      window.location.href = "admin.html";
      return;
    }

    const { error } = await client
      .from(config.tableName || "site_content")
      .upsert({
        id: config.rowId || "homepage",
        content,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    localStorage.setItem("homepage_content_preview", JSON.stringify(content));
    setStatus("Saved to Supabase. The homepage now uses the latest content.", "good");
    renderForm();
  } catch (error) {
    setStatus(error.message || "Could not save changes.");
  }
}

async function signOut() {
  if (!client) return;
  await client.auth.signOut();
  window.location.href = "admin.html";
}

function addBlock() {
  collectTextContent();
  content.blocks.push({
    id: uniqueId(),
    title: "New element",
    text: "Write a short description for this homepage block.",
    buttonText: "",
    buttonLink: "",
    imageUrl: ""
  });
  renderBlocks();
  refreshIcons();
}

function handleBlockAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const card = button.closest(".block-card");
  const index = [...document.querySelectorAll(".block-card")].indexOf(card);
  collectTextContent();

  if (button.dataset.action === "remove") {
    content.blocks.splice(index, 1);
  }

  if (button.dataset.action === "up" && index > 0) {
    [content.blocks[index - 1], content.blocks[index]] = [content.blocks[index], content.blocks[index - 1]];
  }

  if (button.dataset.action === "down" && index < content.blocks.length - 1) {
    [content.blocks[index], content.blocks[index + 1]] = [content.blocks[index + 1], content.blocks[index]];
  }

  renderBlocks();
  refreshIcons();
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

form.addEventListener("submit", saveContent);
signOutBtn.addEventListener("click", signOut);
addBlockBtn.addEventListener("click", addBlock);
blocksEditor.addEventListener("click", handleBlockAction);
resetBtn.addEventListener("click", () => {
  renderForm();
  setStatus("Form reset to the last loaded content.", "good");
});

loadContent();
refreshIcons();

if (client) {
  client.auth.onAuthStateChange((_event, session) => {
    if (!session) {
      window.location.href = "admin.html";
    }
  });
}
