"use strict";
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const hero = document.querySelector("#hero-video");
const heroToggle = document.querySelector("#hero-toggle");
let heroUserPaused = false;
function updateHeroButton() {
  heroToggle.textContent = hero.paused ? "Play background" : "Pause background";
  heroToggle.setAttribute("aria-label", hero.paused ? "Play background video" : "Pause background video");
}
hero.addEventListener("play", updateHeroButton);
hero.addEventListener("pause", updateHeroButton);
heroToggle.addEventListener("click", () => {
  if (hero.paused) { heroUserPaused = false; hero.play().catch(updateHeroButton); }
  else { heroUserPaused = true; hero.pause(); }
});
if (!reducedMotion.matches) hero.play().catch(updateHeroButton);
const heroObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) hero.pause();
    else if (!heroUserPaused && !reducedMotion.matches) hero.play().catch(updateHeroButton);
  }
}, { threshold: 0.1 });
heroObserver.observe(hero);

let galleryPaused = reducedMotion.matches;
const clips = [...document.querySelectorAll(".gallery-video")];
const visibleVideos = new Set();
const galleryToggle = document.querySelector("#gallery-toggle");
function loadClip(video) {
  const source = video.querySelector("source");
  if (!source.src) { source.src = source.dataset.src; video.load(); }
}
function updateGalleryButton() { galleryToggle.textContent = galleryPaused ? "Play all clips" : "Pause all clips"; }
updateGalleryButton();
const clipObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    const video = entry.target;
    if (entry.isIntersecting && !video.closest(".motion-card").hidden) {
      visibleVideos.add(video); loadClip(video);
      if (!galleryPaused) video.play().catch(() => {});
    } else { visibleVideos.delete(video); video.pause(); }
  }
}, { threshold: 0.25 });
clips.forEach(video => clipObserver.observe(video));
galleryToggle.addEventListener("click", () => {
  galleryPaused = !galleryPaused;
  for (const video of clips) {
    if (galleryPaused) video.pause();
    else if (visibleVideos.has(video) && !video.closest(".motion-card").hidden) { loadClip(video); video.play().catch(() => {}); }
  }
  updateGalleryButton();
});
document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(item => {
      const active = item === button; item.classList.toggle("active", active); item.setAttribute("aria-pressed", String(active));
    });
    document.querySelectorAll(".motion-card").forEach(card => {
      card.hidden = button.dataset.filter !== "all" && card.dataset.category !== button.dataset.filter;
      if (card.hidden) card.querySelector("video").pause();
    });
  });
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) { hero.pause(); clips.forEach(video => video.pause()); }
  else {
    if (!heroUserPaused && !reducedMotion.matches && hero.getBoundingClientRect().bottom > 0) hero.play().catch(() => {});
    if (!galleryPaused) visibleVideos.forEach(video => { if (!video.closest(".motion-card").hidden) video.play().catch(() => {}); });
  }
});
document.querySelector("#copy-citation").addEventListener("click", async () => {
  const text = document.querySelector("#bibtex").textContent;
  const status = document.querySelector("#copy-status");
  try {
    await navigator.clipboard.writeText(text);
    status.textContent = "Citation copied to clipboard.";
  } catch {
    const range = document.createRange(); range.selectNodeContents(document.querySelector("#bibtex"));
    const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
    status.textContent = "Citation selected. Press Ctrl+C or download the .bib file.";
  }
});
