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
    buttonLink: "#welcome",
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
      buttonText: "Explore sections",
      buttonLink: "#sections",
      imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80"
    },
    {
      id: "images",
      title: "Image-ready",
      text: "Use hosted image URLs or upload files to your Supabase Storage bucket.",
      buttonText: "",
      buttonLink: "",
      imageUrl: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80"
    }
  ]
};

const config = window.SITE_CONFIG || {};
const homepage = document.querySelector("#homepage");

function hasSupabaseConfig() {
  return Boolean(
    config.supabaseUrl &&
    config.supabaseAnonKey &&
    !config.supabaseUrl.includes("YOUR-PROJECT") &&
    !config.supabaseAnonKey.includes("YOUR_PUBLIC_ANON_KEY")
  );
}

function getSupabaseClient() {
  if (!hasSupabaseConfig() || !window.supabase) return null;
  return window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
}

function mergeContent(content) {
  return {
    ...defaultContent,
    ...(content || {}),
    hero: { ...defaultContent.hero, ...(content?.hero || {}) },
    welcome: { ...defaultContent.welcome, ...(content?.welcome || {}) },
    blocks: Array.isArray(content?.blocks) ? content.blocks : defaultContent.blocks
  };
}

async function loadContent() {
  const localContent = localStorage.getItem("homepage_content_preview");
  const client = getSupabaseClient();

  if (!client) {
    return mergeContent(localContent ? JSON.parse(localContent) : defaultContent);
  }

  const { data, error } = await client
    .from(config.tableName || "site_content")
    .select("content")
    .eq("id", config.rowId || "homepage")
    .maybeSingle();

  if (error) {
    console.warn("Could not load Supabase content:", error.message);
    return mergeContent(localContent ? JSON.parse(localContent) : defaultContent);
  }

  return mergeContent(data?.content || defaultContent);
}

function imageStyle(url) {
  const safeUrl = url || defaultContent.hero.imageUrl;
  return `url("${String(safeUrl).replaceAll('"', "%22")}")`;
}

function createButton(text, href, className = "button") {
  if (!text || !href) return "";
  return `<a class="${className}" href="${escapeHtml(href)}">${escapeHtml(text)}</a>`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderHomepage(content) {
  const hero = content.hero;
  const welcome = content.welcome;
  const blocks = content.blocks || [];

  homepage.innerHTML = `
    <section class="hero" style="--hero-image: ${imageStyle(hero.imageUrl)}">
      <div class="hero-inner">
        <p class="eyebrow">${escapeHtml(hero.eyebrow)}</p>
        <h1>${escapeHtml(hero.title)}</h1>
        <p class="hero-copy">${escapeHtml(hero.subtitle)}</p>
        ${createButton(hero.buttonText, hero.buttonLink)}
      </div>
    </section>

    <section class="section" id="welcome">
      <div class="welcome-grid">
        <figure class="welcome-media">
          <img src="${escapeHtml(welcome.imageUrl)}" alt="${escapeHtml(welcome.title)}">
        </figure>
        <div class="welcome-copy">
          <p class="section-label">Welcome</p>
          <h2>${escapeHtml(welcome.title)}</h2>
          <p>${escapeHtml(welcome.text)}</p>
          ${createButton(welcome.buttonText, welcome.buttonLink)}
        </div>
      </div>
    </section>

    <section class="section sections-band" id="sections">
      <div class="sections-heading">
        <div>
          <p class="section-label">More to share</p>
          <h2>Editable sections</h2>
        </div>
        <p>Add as many content elements as you need from the admin page.</p>
      </div>
      <div class="content-grid">
        ${blocks.map(renderBlock).join("")}
      </div>
    </section>
  `;
}

function renderBlock(block) {
  return `
    <article class="content-card">
      ${block.imageUrl ? `<img src="${escapeHtml(block.imageUrl)}" alt="${escapeHtml(block.title)}">` : ""}
      <div class="card-body">
        <h3>${escapeHtml(block.title)}</h3>
        <p>${escapeHtml(block.text)}</p>
        ${createButton(block.buttonText, block.buttonLink, "text-link")}
      </div>
    </article>
  `;
}

loadContent()
  .then(renderHomepage)
  .catch((error) => {
    console.error(error);
    renderHomepage(defaultContent);
  });
