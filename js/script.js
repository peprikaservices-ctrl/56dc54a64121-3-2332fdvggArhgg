(() => {
  const scene = document.body.dataset.scene;

  const pageTransition = document.getElementById("page-transition");
  const bgMusic = document.getElementById("bg-music");
  const sparkleSfx = document.getElementById("sparkle-sfx");
  const finalSfx = document.getElementById("final-sfx");
  const audioToggle = document.getElementById("audio-toggle");

  const MUSIC_MUTED_KEY = "love_story_muted";
  const MUSIC_TIME_KEY = "love_story_music_time";
  const MUSIC_STAMP_KEY = "love_story_music_stamp";
  const MUSIC_PLAYING_KEY = "love_story_music_playing";
  const MUSIC_SESSION_KEY = "love_story_music_session";
  const MUSIC_START_TIME = 0;

  function showHint(message, ms = 1800) {
    let hint = document.querySelector(".scene-hint");
    if (!hint) {
      hint = document.createElement("div");
      hint.className = "scene-hint";
      document.body.appendChild(hint);
    }
    hint.textContent = message;
    gsap.killTweensOf(hint);
    gsap.to(hint, { opacity: 1, y: -4, duration: 0.25, ease: "power2.out" });
    setTimeout(() => {
      gsap.to(hint, { opacity: 0, y: 0, duration: 0.3, ease: "power2.in" });
    }, ms);
  }

  function setupParticles() {
    if (!window.tsParticles) return;
    window.tsParticles.load({
      id: "particle-layer",
      options: {
        fullScreen: false,
        background: { color: { value: "transparent" } },
        particles: {
          number: { value: 32 },
          color: { value: ["#ff9fbe", "#f6c90e", "#ffd9e6"] },
          opacity: { value: { min: 0.1, max: 0.45 } },
          size: { value: { min: 1, max: 4 } },
          move: {
            enable: true,
            speed: { min: 0.2, max: 1 },
            drift: 0.2,
            outModes: { default: "out" }
          }
        }
      }
    });
  }

  function persistMusicState() {
    if (!bgMusic) return;
    localStorage.setItem(MUSIC_TIME_KEY, String(bgMusic.currentTime || 0));
    localStorage.setItem(MUSIC_STAMP_KEY, String(Date.now()));
    localStorage.setItem(MUSIC_PLAYING_KEY, bgMusic.paused ? "0" : "1");
  }

  function setupMusic() {
    if (!bgMusic || !audioToggle) return;

    const isNewSession = !sessionStorage.getItem(MUSIC_SESSION_KEY);
    if (isNewSession) {
      sessionStorage.setItem(MUSIC_SESSION_KEY, "1");
      localStorage.removeItem(MUSIC_TIME_KEY);
      localStorage.removeItem(MUSIC_STAMP_KEY);
      localStorage.removeItem(MUSIC_PLAYING_KEY);
    }
    const storedMuted = localStorage.getItem(MUSIC_MUTED_KEY);
    const muted = storedMuted === null ? true : storedMuted === "1";
    const rawSavedTime = Number(localStorage.getItem(MUSIC_TIME_KEY) || "0");
    const savedTime = Number.isFinite(rawSavedTime) && rawSavedTime >= 0 ? rawSavedTime : 0;
    const rawSavedStamp = Number(localStorage.getItem(MUSIC_STAMP_KEY) || "0");
    const savedStamp = Number.isFinite(rawSavedStamp) && rawSavedStamp > 0 ? rawSavedStamp : 0;
    const wasPlaying = localStorage.getItem(MUSIC_PLAYING_KEY) === "1";
    const resumeOffset = wasPlaying && savedStamp > 0 ? Math.max(0, (Date.now() - savedStamp) / 1000) : 0;
    const desiredStartTime = savedTime > 0 ? savedTime + resumeOffset : MUSIC_START_TIME;

    bgMusic.volume = scene === "final" ? 0.45 : 0.3;
    bgMusic.preload = "auto";
    bgMusic.playsInline = true;
    bgMusic.muted = muted;
    let hasSeeked = false;
    const applyStartTime = () => {
      if (hasSeeked) return;
      const duration = Number.isFinite(bgMusic.duration) ? bgMusic.duration : 0;
      const maxTime = Math.max(0, (duration || desiredStartTime) - 0.25);
      const nextTime = Math.min(desiredStartTime, maxTime);
      try {
        bgMusic.currentTime = nextTime;
        hasSeeked = true;
      } catch {
        hasSeeked = false;
      }
    };

    bgMusic.addEventListener("loadedmetadata", applyStartTime, { once: true });
    bgMusic.addEventListener("canplay", applyStartTime, { once: true });

    const updateToggleText = () => {
      audioToggle.textContent = bgMusic.muted ? "🔇 Music" : "🔊 Music";
    };
    updateToggleText();

    bgMusic.addEventListener("error", () => {
      audioToggle.textContent = "⚠ No Music";
      audioToggle.disabled = true;
      showHint("Music file missing/invalid. Replace assets/music/ambient-love.mp3", 3200);
    }, { once: true });

    const attemptPlayMusic = () => {
      applyStartTime();
      const playPromise = bgMusic.play();
      if (!playPromise || typeof playPromise.catch !== "function") return;
      playPromise.then(() => {
        persistMusicState();
      });
    };
    bgMusic.addEventListener("canplay", () => {
      if (!bgMusic.muted) attemptPlayMusic();
    }, { once: true });
    if (!bgMusic.muted) attemptPlayMusic();

    audioToggle.addEventListener("click", () => {
      bgMusic.muted = !bgMusic.muted;
      localStorage.setItem(MUSIC_MUTED_KEY, bgMusic.muted ? "1" : "0");
      if (!bgMusic.muted) {
        attemptPlayMusic();
      }
      updateToggleText();
      persistMusicState();
    });

    setInterval(persistMusicState, 700);

    window.addEventListener("pagehide", persistMusicState);
    window.addEventListener("beforeunload", persistMusicState);
    bgMusic.addEventListener("play", persistMusicState);
    bgMusic.addEventListener("pause", persistMusicState);
  }

  function cinematicNavigate(url) {
    persistMusicState();
    if (!pageTransition) {
      window.location.href = url;
      return;
    }

    gsap.to(pageTransition, {
      opacity: 1,
      duration: 0.8,
      ease: "power2.inOut",
      onComplete: () => {
        window.location.href = url;
      }
    });
  }

  function playSparkle() {
    if (!sparkleSfx) return;
    sparkleSfx.currentTime = 0;
    sparkleSfx.play().catch(() => { });
  }

  function revealIn() {
    if (!pageTransition) return;
    gsap.set(pageTransition, { opacity: 1 });
    gsap.to(pageTransition, { opacity: 0, duration: 0.9, ease: "power2.out" });
  }

  function initScene1() {
    const typeEl = document.getElementById("typewriter");
    const beginBtn = document.getElementById("begin-story");
    if (!typeEl || !beginBtn) return;

    const line = "Every great love story begins with a moment...";
    let i = 0;

    const tick = () => {
      typeEl.textContent = line.slice(0, i++);
      if (i <= line.length) {
        setTimeout(tick, 52);
      } else {
        beginBtn.classList.remove("hidden");
        gsap.fromTo(beginBtn, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" });
      }
    };

    tick();

    beginBtn.addEventListener("click", () => cinematicNavigate("scene2.html"));
    gsap.from(".intro-card", { y: 28, opacity: 0, duration: 1.2, ease: "power3.out" });
  }

  function initScene2() {
    const gameRoot = document.getElementById("heart-game");
    const resultModal = document.getElementById("game-result");
    const nextBtn = document.getElementById("to-scene3");
    if (!gameRoot || !resultModal || !nextBtn) return;

    const total = 12;
    const destinyIndex = Math.floor(Math.random() * total);
    let resolved = false;
    let wrongAttempts = 0;
    const maxWrongAttempts = 6;

    for (let i = 0; i < total; i++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "heart-target";
      btn.innerHTML = "❤";
      btn.dataset.index = String(i);
      btn.style.left = `${Math.random() * 88 + 3}%`;
      btn.style.top = `${Math.random() * 82 + 6}%`;
      if (i === destinyIndex) {
        btn.classList.add("destiny");
        btn.style.zIndex = "5";
      }
      gameRoot.appendChild(btn);

      gsap.to(btn, {
        x: `random(-18, 18)`,
        y: `random(-22, 22)`,
        rotation: `random(-15, 15)`,
        duration: `random(2.4, 4.4)`,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    }

    function completeGame() {
      if (resolved) return;
      resolved = true;
      playSparkle();
      confetti({ particleCount: 160, spread: 90, origin: { y: 0.62 } });
      confetti({ particleCount: 140, spread: 76, origin: { x: 0.2, y: 0.62 } });
      confetti({ particleCount: 140, spread: 76, origin: { x: 0.8, y: 0.62 } });

      resultModal.classList.remove("hidden");
      gsap.fromTo(resultModal, { opacity: 0 }, { opacity: 1, duration: 0.45 });
      gsap.fromTo(".result-card", { scale: 0.82, y: 10 }, { scale: 1, y: 0, duration: 0.55, ease: "back.out(1.6)" });
    }

    gameRoot.addEventListener("click", (event) => {
      const heart = event.target.closest(".heart-target");
      if (!heart || resolved) return;
      const i = Number(heart.dataset.index);
      if (i === destinyIndex) {
        completeGame();
        return;
      }

      wrongAttempts += 1;
      heart.classList.add("wrong");
      setTimeout(() => heart.classList.remove("wrong"), 450);

      if (wrongAttempts >= maxWrongAttempts) {
        showHint("Destiny chooses you anyway 💘");
        completeGame();
      } else {
        showHint("Not this one... try another heart.");
      }
    });

    nextBtn.addEventListener("click", () => cinematicNavigate("scene3.html"));
    gsap.from(".game-panel", { y: 22, opacity: 0, duration: 0.85, ease: "power2.out" });
  }

  function initScene3() {
    const memoryImages = document.querySelectorAll(".memory-image");
    memoryImages.forEach((img) => {
      img.addEventListener("error", () => {
        img.src =
          "data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27800%27 height=%27500%27%3E%3Cdefs%3E%3ClinearGradient id=%27g%27 x1=%270%27 y1=%270%27 x2=%271%27 y2=%271%27%3E%3Cstop offset=%270%25%27 stop-color=%27%235e3b76%27/%3E%3Cstop offset=%27100%25%27 stop-color=%27%23ff6f91%27/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%27800%27 height=%27500%27 fill=%27url(%23g)%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 dominant-baseline=%27middle%27 text-anchor=%27middle%27 font-size=%2738%27 fill=%27white%27 font-family=%27Arial%27%3EAdd your photo here%3C/text%3E%3C/svg%3E";
      }, { once: true });
    });

    const nextBtn = document.getElementById("to-scene4");
    if (nextBtn) nextBtn.addEventListener("click", () => cinematicNavigate("scene4.html"));

    if (window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);

      gsap.utils.toArray(".memory-card").forEach((card) => {
        const img = card.querySelector(".memory-image");
        gsap.from(card, {
          opacity: 0,
          y: 42,
          duration: 1,
          scrollTrigger: {
            trigger: card,
            start: "top 82%"
          }
        });

        gsap.to(img, {
          scale: 1.08,
          scrollTrigger: {
            trigger: card,
            scrub: true,
            start: "top bottom",
            end: "bottom top"
          }
        });

        const speed = Number(card.dataset.speed || "0.15");
        gsap.to(card, {
          yPercent: speed * 40,
          ease: "none",
          scrollTrigger: {
            trigger: card,
            scrub: true,
            start: "top bottom",
            end: "bottom top"
          }
        });
      });
    }
  }

  function initScene4() {
    const holdBtn = document.getElementById("hold-heart");
    const meter = document.getElementById("hold-progress");
    const holdText = document.getElementById("hold-text");
    if (!holdBtn || !meter || !holdText) return;

    let holding = false;
    let startTime = 0;
    let raf = 0;

    const holdDuration = 3000;

    const update = () => {
      if (!holding) return;
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / holdDuration, 1);
      meter.style.width = `${progress * 100}%`;

      if (progress > 0.12) {
        gsap.to(holdText, { opacity: 1, y: 0, duration: 0.4 });
      }

      if (progress >= 1) {
        holding = false;
        playSparkle();
        gsap.to("body", { filter: "brightness(0.4)", duration: 0.55, onComplete: () => cinematicNavigate("final.html") });
        return;
      }

      raf = requestAnimationFrame(update);
    };

    const startHold = (event) => {
      event.preventDefault();
      holding = true;
      startTime = performance.now();
      holdBtn.classList.add("warm-glow");
      raf = requestAnimationFrame(update);
    };

    const endHold = () => {
      if (!holding) return;
      holding = false;
      cancelAnimationFrame(raf);
      holdBtn.classList.remove("warm-glow");
      gsap.to(meter, { width: 0, duration: 0.45, ease: "power2.out" });
    };

    ["pointerup", "pointerleave", "pointercancel"].forEach((evt) => {
      holdBtn.addEventListener(evt, endHold);
    });
    holdBtn.addEventListener("pointerdown", startHold);
    gsap.from(".hold-panel", { y: 24, opacity: 0, duration: 0.9, ease: "power2.out" });
  }

  function initFinal() {
    const linesWrap = document.getElementById("final-lines");
    const finalBtns = document.querySelectorAll(".final-yes");
    const finalMessage = document.getElementById("final-message");
    const hiddenNote = document.getElementById("hidden-note");
    const bgTarget = document.getElementById("final-background-target");

    if (!linesWrap || !finalBtns.length || !finalMessage || !hiddenNote || !bgTarget) return;

    const lines = [
      "You are my favorite chapter.",
      "My safest place.",
      "My greatest adventure.",
      "Will you be my Valentine forever?"
    ];

    let lineIndex = 0;
    let charIndex = 0;
    let completedText = "";

    function typeLine() {
      if (lineIndex >= lines.length) return;
      const current = lines[lineIndex];
      linesWrap.innerHTML = `${completedText}${current.slice(0, charIndex)}<span class="caret">|</span>`;
      charIndex++;

      if (charIndex <= current.length) {
        setTimeout(typeLine, 48);
      } else {
        completedText += `${current}<br />`;
        lineIndex++;
        charIndex = 0;
        setTimeout(typeLine, 480);
      }
    }

    typeLine();

    gsap.to(".hero-heart", {
      scale: 1.1,
      duration: 1.6,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    finalBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        playSparkle();
        if (finalSfx) {
          finalSfx.currentTime = 0;
          finalSfx.play().catch(() => { });
        }
        finalMessage.classList.remove("hidden");
        bgTarget.classList.add("warm-glow");

        confetti({ particleCount: 250, spread: 120, origin: { y: 0.62 } });
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            confetti({
              particleCount: 55,
              angle: 60 + i * 15,
              spread: 70,
              origin: { x: Math.random(), y: 0 }
            });
          }, i * 220);
        }

        gsap.fromTo(finalMessage, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" });
      });
    });

    let bgClicks = 0;
    bgTarget.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      bgClicks += 1;
      if (bgClicks === 5) {
        hiddenNote.classList.remove("hidden");
        gsap.fromTo(hiddenNote, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.7 });
      }
    });

    const heartRain = setInterval(() => {
      confetti({
        particleCount: 2,
        spread: 34,
        startVelocity: 12,
        ticks: 300,
        origin: { x: Math.random(), y: -0.1 },
        shapes: ["circle"],
        colors: ["#ff6f91", "#ffd8e6", "#f6c90e"]
      });
    }, 260);

    window.addEventListener("beforeunload", () => clearInterval(heartRain));
  }

  setupParticles();
  setupMusic();
  revealIn();

  if (scene === "index") initScene1();
  if (scene === "scene2") initScene2();
  if (scene === "scene3") initScene3();
  if (scene === "scene4") initScene4();
  if (scene === "final") initFinal();
})();
