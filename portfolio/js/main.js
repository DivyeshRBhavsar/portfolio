"use strict";

/*
 * Portfolio front-end.
 * Security notes:
 * - No inline event handlers/scripts (CSP script-src 'self').
 * - All dynamic text is inserted via textContent, never innerHTML, to avoid XSS
 *   even if a data source (e.g. the GitHub API) ever returned unexpected content.
 * - GitHub API calls are read-only, unauthenticated, and wrapped in try/catch with
 *   an AbortController timeout so a slow/blocked network never breaks the page.
 * - The contact "form" never sends data to a third party silently; it builds a
 *   mailto: link client-side so nothing is transmitted without the user's own
 *   email client confirming the send.
 */

(function () {
  const GITHUB_USER = "DivyeshRBhavsar";
  const OWNER_EMAIL = "divyeshbhavsar73@gmail.com";

  /* ---------------- Project + skill data ---------------- */
  const PROJECTS = [
    {
      id: "term-deposit",
      repo: "5qaNUcRSLjHZ5anY",
      title: "Term Deposit Subscription Prediction",
      categories: ["ml"],
      description:
        "Two-layer stacked classification pipeline predicting which bank customers are most likely to subscribe to a term deposit, built across dedicated EDA, first-layer and second-layer modelling notebooks.",
      tech: ["Python", "CatBoost", "Pandas", "EDA", "Model Stacking"],
    },
    {
      id: "customer-unhappiness",
      repo: "UXQuJpm6fj5xoNLi",
      title: "Customer Unhappiness Prediction",
      categories: ["ml"],
      description:
        "Predicts customer dissatisfaction from a 126-response logistics survey. Six models were tested before landing on a KNN + Random Forest soft-vote ensemble that reached 88.5% accuracy with a near-zero recall gap between classes.",
      tech: ["Python", "Scikit-learn", "Random Forest", "KNN", "Ensemble Modeling"],
    },
    {
      id: "h1n1",
      repo: "H1N1_Seasonal_Prediction",
      title: "H1N1 & Seasonal Flu Vaccine Prediction",
      categories: ["ml"],
      description:
        "Kaggle competition submission predicting the probability that an individual received the H1N1 and seasonal flu vaccines, covering the full pipeline from cleaning through modelling.",
      tech: ["Python", "Scikit-learn", "Kaggle", "Classification"],
    },
    {
      id: "spaceship-titanic",
      repo: "Spaceship_titanic",
      title: "Spaceship Titanic — Transport Prediction",
      categories: ["ml"],
      description:
        "Predicts whether a passenger was transported to an alternate dimension after a spaceship collision. Engineered cabin, group and spending features, then tuned a CatBoost model with Optuna to 80.8% accuracy.",
      tech: ["Python", "CatBoost", "Optuna", "Feature Engineering"],
    },
    {
      id: "secure-portal-pdf",
      repo: "Secure-Portal-PDF-Data-Extraction-System",
      title: "Secure Portal PDF Data Extraction System",
      categories: ["engineering"],
      description:
        "Automated pipeline that logs into a secure web portal, downloads PDF reports, and extracts clean, de-duplicated tabular data to CSV — backed by a pytest test suite and a GitHub Actions CI workflow.",
      tech: ["Python", "Docker", "pytest", "CI/CD", "PDF Parsing"],
    },
    {
      id: "face-recognition",
      repo: "Face-Recognition-login-system",
      title: "Face Recognition Login System",
      categories: ["vision"],
      description:
        "Webcam-based authentication: enrolls a user's face at sign-up, then verifies identity via OpenCV Haar-cascade face matching at login, reaching roughly 96% recognition accuracy.",
      tech: ["Python", "OpenCV", "Haar Cascade", "Computer Vision"],
    },
    {
      id: "restaurant-analysis",
      repo: "Restaurant-analysis",
      title: "Restaurant Pricing & Value Analysis",
      categories: ["analysis"],
      description:
        "Analyzes roughly 500 restaurants to separate price from perceived value — engineered a value-for-money score, an IMDb-style weighted rating, and a convenience score, visualized in an interactive Tableau dashboard.",
      tech: ["SQL", "BigQuery", "Python", "Tableau"],
      extraLink: {
        label: "Live Dashboard",
        url: "https://public.tableau.com/views/RestaurantPricingValueandPerformanceAnalysis/Dashboard1",
      },
    },
  ];

  const SKILLS = [
    {
      title: "Machine Learning & Modelling",
      items: ["Python", "Pandas / NumPy", "Scikit-learn", "XGBoost", "CatBoost", "LightGBM", "Optuna"],
    },
    {
      title: "Data Engineering & Automation",
      items: ["SQL", "BigQuery", "Docker", "GitHub Actions CI", "pytest", "PDF/Doc Parsing", "Web Automation"],
    },
    {
      title: "Visualization & BI",
      items: ["Tableau", "Matplotlib", "Seaborn", "Jupyter"],
    },
    {
      title: "Computer Vision & Security",
      items: ["OpenCV", "Haar Cascade Detection", "Secure Auth Pipelines"],
    },
  ];

  /* ---------------- Utilities ---------------- */
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function timeAgo(dateStr) {
    const then = new Date(dateStr).getTime();
    if (Number.isNaN(then)) return "";
    const diffDays = Math.floor((Date.now() - then) / 86400000);
    if (diffDays < 1) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 30) return diffDays + "d ago";
    const months = Math.floor(diffDays / 30);
    if (months < 12) return months + "mo ago";
    return Math.floor(months / 12) + "y ago";
  }

  async function fetchRepoStats(repoName, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs || 5000);
    try {
      const res = await fetch("https://api.github.com/repos/" + GITHUB_USER + "/" + repoName, {
        signal: controller.signal,
        headers: { Accept: "application/vnd.github+json" },
      });
      clearTimeout(timer);
      if (!res.ok) return null;
      const data = await res.json();
      return {
        stars: typeof data.stargazers_count === "number" ? data.stargazers_count : 0,
        updated: data.pushed_at || data.updated_at || null,
        language: data.language || null,
      };
    } catch (err) {
      clearTimeout(timer);
      return null;
    }
  }

  /* ---------------- Render: skills ---------------- */
  function renderSkills() {
    const grid = document.getElementById("skillsGrid");
    SKILLS.forEach((group) => {
      const card = el("div", "skill-card");
      card.appendChild(el("h3", null, group.title));
      const list = el("ul");
      group.items.forEach((item) => {
        const li = el("li", null, item);
        list.appendChild(li);
      });
      card.appendChild(list);
      grid.appendChild(card);
    });
  }

  /* ---------------- Render: projects ---------------- */
  const cardBadgeEls = {};

  function buildCard(project) {
    const card = el("article", "project-card");
    card.dataset.categories = project.categories.join(" ");
    card.id = "project-" + project.id;

    const top = el("div", "card-top");
    top.appendChild(el("h3", null, project.title));

    const badge = el("span", "card-badge", "Loading…");
    cardBadgeEls[project.id] = badge;
    top.appendChild(badge);
    card.appendChild(top);

    card.appendChild(el("p", "card-desc", project.description));

    const tech = el("div", "card-tech");
    project.tech.forEach((t) => tech.appendChild(el("span", null, t)));
    card.appendChild(tech);

    const footer = el("div", "card-footer");
    const links = el("div", "card-links");

    const codeLink = el("a", null, "View Code →");
    codeLink.href = "https://github.com/" + GITHUB_USER + "/" + project.repo;
    codeLink.target = "_blank";
    codeLink.rel = "noopener noreferrer";
    links.appendChild(codeLink);

    if (project.extraLink) {
      const extra = el("a", null, project.extraLink.label + " →");
      extra.href = project.extraLink.url;
      extra.target = "_blank";
      extra.rel = "noopener noreferrer";
      links.appendChild(extra);
    }

    footer.appendChild(links);
    card.appendChild(footer);

    return card;
  }

  function renderProjects() {
    const grid = document.getElementById("projectGrid");
    PROJECTS.forEach((project, i) => {
      const card = buildCard(project);
      card.style.animationDelay = i * 60 + "ms";
      grid.appendChild(card);
    });
  }

  async function hydrateLiveStats() {
    for (const project of PROJECTS) {
      const badge = cardBadgeEls[project.id];
      if (!badge) continue;
      const stats = await fetchRepoStats(project.repo, 6000);
      badge.textContent = "";
      if (stats) {
        badge.classList.add("is-live");
        const label = "★ " + stats.stars + (stats.updated ? " · " + timeAgo(stats.updated) : "");
        badge.textContent = label;
        badge.title = "Live data from GitHub";
      } else {
        badge.classList.remove("is-live");
        badge.textContent = "Static summary";
        badge.title = "GitHub API unavailable — showing static project summary";
      }
    }
  }

  /* ---------------- Filtering ---------------- */
  function setupFilters() {
    const bar = document.getElementById("filterBar");
    const cards = () => Array.from(document.querySelectorAll(".project-card"));

    bar.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-btn");
      if (!btn) return;
      bar.querySelectorAll(".filter-btn").forEach((b) => {
        b.classList.remove("is-active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");

      const filter = btn.dataset.filter;
      cards().forEach((card) => {
        const cats = card.dataset.categories.split(" ");
        const show = filter === "all" || cats.includes(filter);
        card.classList.toggle("is-hidden", !show);
      });
    });
  }

  /* ---------------- Theme toggle ---------------- */
  function setupTheme() {
    const toggle = document.getElementById("themeToggle");
    const stored = safeGet("theme");
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored || (prefersDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", initial);

    toggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      safeSet("theme", next);
    });
  }

  function safeGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }
  function safeSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      /* private browsing / storage disabled: silently ignore */
    }
  }

  /* ---------------- Mobile nav ---------------- */
  function setupNav() {
    const toggle = document.getElementById("navToggle");
    const menu = document.getElementById("navMenu");
    toggle.addEventListener("click", () => {
      const open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    menu.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  /* ---------------- Scroll reveal ---------------- */
  function setupReveal() {
    const targets = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      targets.forEach((t) => t.classList.add("is-visible"));
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    targets.forEach((t) => obs.observe(t));
  }

  /* ---------------- Animated counters ---------------- */
  function setupCounters() {
    const nums = document.querySelectorAll(".stat-num");
    const animate = (node) => {
      const target = parseInt(node.dataset.count, 10) || 0;
      const duration = 900;
      const start = performance.now();
      function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        node.textContent = Math.round(progress * target);
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    };
    if (!("IntersectionObserver" in window)) {
      nums.forEach(animate);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    nums.forEach((n) => obs.observe(n));
  }

  /* ---------------- Contact form ---------------- */
  function setupContactForm() {
    const form = document.getElementById("contactForm");
    const note = document.getElementById("formNote");

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      note.classList.remove("is-error");

      const honeypot = form.elements["company"].value.trim();
      if (honeypot) {
        // Likely a bot. Fail silently without revealing why.
        note.textContent = "Thanks — your message has been noted.";
        form.reset();
        return;
      }

      const name = form.elements["name"].value.trim();
      const email = form.elements["email"].value.trim();
      const message = form.elements["message"].value.trim();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!name || !email || !message) {
        note.textContent = "Please fill in every field.";
        note.classList.add("is-error");
        return;
      }
      if (!emailPattern.test(email)) {
        note.textContent = "Please enter a valid email address.";
        note.classList.add("is-error");
        return;
      }
      if (name.length > 80 || email.length > 120 || message.length > 2000) {
        note.textContent = "One of the fields is too long.";
        note.classList.add("is-error");
        return;
      }

      // No backend is wired up here, so we hand off to the user's own mail
      // client rather than silently "succeeding" with nowhere for the data to go.
      const subject = encodeURIComponent("Portfolio contact from " + name);
      const body = encodeURIComponent(message + "\n\n— " + name + " (" + email + ")");
      window.location.href = "mailto:" + OWNER_EMAIL + "?subject=" + subject + "&body=" + body;

      note.textContent = "Opening your email client to send the message…";
      form.reset();
    });
  }

  /* ---------------- Init ---------------- */
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("year").textContent = String(new Date().getFullYear());
    setupTheme();
    setupNav();
    renderSkills();
    renderProjects();
    setupFilters();
    setupReveal();
    setupCounters();
    setupContactForm();
    hydrateLiveStats();
  });
})();
