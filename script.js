(function () {
  "use strict";

  // Tells the page head that this file loaded, so scroll-reveal content stays managed here
  window.__portfolioReady = true;

  // Footer year always matches the current year
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // Mobile menu
  var btn = document.getElementById("menu-btn");
  var list = document.getElementById("nav-list");
  if (btn && list) {
    var setOpen = function (open) {
      list.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    btn.addEventListener("click", function () { setOpen(!list.classList.contains("open")); });
    list.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".bar")) setOpen(false);
    });
    window.matchMedia("(min-width: 721px)").addEventListener("change", function () { setOpen(false); });
  }

  // Toast
  var toast = document.getElementById("toast");
  var toastTimer;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 2600);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return Promise.reject(new Error("no clipboard"));
  }

  document.querySelectorAll("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      copyText(b.getAttribute("data-copy")).then(
        function () { showToast("Copied to clipboard"); },
        function () { showToast("Could not copy. Please select the text and copy it."); }
      );
    });
  });

  // Theme switcher: each press moves to the next background theme and remembers it
  var THEMES = [
    { id: "cloud", name: "Cloud", color: "#e3e8ef" },
    { id: "midnight", name: "Midnight", color: "#23272e" },
    { id: "mint", name: "Mint", color: "#dfeae4" },
    { id: "blush", name: "Blush", color: "#eee2e0" }
  ];
  var root = document.documentElement;
  var themeBtn = document.getElementById("theme-btn");
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var themeTimer;
  var spins = 0;

  function themeIndex() {
    var id = root.getAttribute("data-theme");
    for (var i = 0; i < THEMES.length; i++) { if (THEMES[i].id === id) return i; }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? 1 : 0;
  }

  function paintThemeUi(i) {
    if (themeMeta) themeMeta.setAttribute("content", THEMES[i].color);
    if (themeBtn) themeBtn.setAttribute("aria-label", "Change background theme. Current theme: " + THEMES[i].name);
  }

  function applyTheme(i) {
    root.classList.add("theme-anim");
    root.setAttribute("data-theme", THEMES[i].id);
    paintThemeUi(i);
    try { localStorage.setItem("portfolio-theme", THEMES[i].id); } catch (e) {}
    clearTimeout(themeTimer);
    themeTimer = setTimeout(function () { root.classList.remove("theme-anim"); }, 650);
    showToast("Theme: " + THEMES[i].name);
  }

  paintThemeUi(themeIndex());
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      spins += 1;
      var icon = themeBtn.querySelector("svg");
      if (icon) icon.style.transform = "rotate(" + spins * 180 + "deg)";
      applyTheme((themeIndex() + 1) % THEMES.length);
    });
  }

  // Scroll reveal: blocks marked .reveal fade in as they enter the screen
  var reveals = document.querySelectorAll(".reveal");
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reveals.length) {
    if (calm || !("IntersectionObserver" in window)) {
      reveals.forEach(function (el) { el.classList.add("in"); });
    } else {
      var counts = new Map();
      reveals.forEach(function (el) {
        var n = counts.get(el.parentNode) || 0;
        counts.set(el.parentNode, n + 1);
        var step = el.tagName === "LI" ? 45 * (n % 8) : 90 * (n % 4);
        el.style.setProperty("--d", step + "ms");
      });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          io.unobserve(el);
          el.classList.add("in");
          // After the fade finishes, hand the element back to normal styles so hover effects work
          el.addEventListener("transitionend", function done(e) {
            if (e.target !== el || e.propertyName !== "opacity") return;
            el.classList.remove("reveal", "in");
            el.style.removeProperty("--d");
            el.removeEventListener("transitionend", done);
          });
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
      reveals.forEach(function (el) { io.observe(el); });
    }
  }

  // Contact form
  var form = document.getElementById("contact-form");
  if (!form) return;
  var status = document.getElementById("form-status");
  var TO = form.getAttribute("data-to");
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setError(field, msg) {
    var input = form.elements[field];
    var out = document.getElementById(field + "-error");
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    out.textContent = msg || "";
    return !msg;
  }

  function validate() {
    var name = form.elements.name.value.trim();
    var email = form.elements.email.value.trim();
    var message = form.elements.message.value.trim();
    var ok = true;
    ok = setError("name", name.length < 2 ? "Enter your name (at least 2 characters)." : "") && ok;
    ok = setError("email", !emailRe.test(email) ? "Enter a valid email address, like name@example.com." : "") && ok;
    ok = setError("message", message.length < 10 ? "Write a message of at least 10 characters." : "") && ok;
    return ok;
  }

  function showStatus(kind, msg) {
    status.hidden = false;
    status.className = "status " + kind;
    status.textContent = msg;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    status.hidden = true;
    if (!validate()) {
      showStatus("bad", "Please fix the highlighted fields and try again.");
      var first = form.querySelector('[aria-invalid="true"]');
      if (first) first.focus();
      return;
    }
    var name = form.elements.name.value.trim();
    var email = form.elements.email.value.trim();
    var message = form.elements.message.value.trim();
    var subject = "Portfolio enquiry from " + name;
    var body = message + "\n\n" + name + "\n" + email;
    var href = "mailto:" + TO + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    try {
      window.location.href = href;
      showStatus("ok", "Thanks, " + name + ". Your email app should open with this message filled in. If nothing opens, use Copy message and send it to " + TO + ".");
      form.dataset.draft = subject + "\n\n" + body;
      var copy = document.getElementById("copy-draft");
      if (copy) copy.hidden = false;
    } catch (err) {
      showStatus("bad", "Your email app could not be opened. Use Copy message and send it to " + TO + ".");
      var c2 = document.getElementById("copy-draft");
      if (c2) c2.hidden = false;
      form.dataset.draft = subject + "\n\n" + body;
    }
  });

  var copyDraft = document.getElementById("copy-draft");
  if (copyDraft) {
    copyDraft.addEventListener("click", function () {
      copyText(form.dataset.draft || "").then(
        function () { showToast("Message copied"); },
        function () { showToast("Could not copy. Please select the text and copy it."); }
      );
    });
  }

  ["name", "email", "message"].forEach(function (f) {
    form.elements[f].addEventListener("input", function () {
      if (form.elements[f].getAttribute("aria-invalid") === "true") validate();
    });
  });
})();
