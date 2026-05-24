(() => {
    // State
    let currentResults = [];
    let currentIndex = -1;
    let isPlaying = false;
    let playMode = "audio";
    let videoQuality = "1080p";
    let currentVideoInfo = null;
    let animFrameId = null;
    let smoothData = null;
    let vizTime = 0;
    let coverImgObj = null;
    let activePlaylist = "results"; // "results" or "favorites"
    let favoritesPlaylist = [];

    // DOM
    const $ = id => document.getElementById(id);
    const chatInput = $("chat-input");
    const btnSend = $("btn-send");
    const statusBar = $("status-bar");
    const statusText = $("status-text");
    const playerArea = $("player-area");
    const audioPlayer = $("audio-player");
    const videoPlayer = $("video-player");
    const coverArt = $("cover-art");
    const coverImg = $("cover-img");
    const visualizer = $("visualizer");
    const nowTitle = $("now-playing-title");
    const nowSource = $("now-playing-source");
    const btnPlay = $("btn-play");
    const btnPrev = $("btn-prev");
    const btnNext = $("btn-next");
    const btnMode = $("btn-mode");
    const btnFavorite = $("btn-favorite");
    const progressBar = $("progress-bar");
    const progressFill = $("progress-fill");
    const timeCurrent = $("time-current");
    const timeTotal = $("time-total");
    const modeLabel = $("mode-label");
    const favLabel = $("fav-label");
    const resultsList = $("results-list");
    const resultsEmpty = $("results-empty");
    const favoritesList = $("favorites-list");
    const favoritesEmpty = $("favorites-empty");
    const favFilter = $("fav-filter");
    const settingsModal = $("settings-modal");
    const btnSettings = $("btn-settings");
    const btnCloseSettings = $("btn-close-settings");
    const btnSaveSettings = $("btn-save-settings");
    const qualityWrapper = $("quality-wrapper");
    const btnQuality = $("btn-quality");
    const qualityMenu = $("quality-menu");
    const qualityLabel = $("quality-label");
    const btnFullscreen = $("btn-fullscreen");
    const volumeSlider = $("volume-slider");
    const volFill = $("vol-fill");
    const volLabel = $("vol-label");
    const btnMute = $("btn-mute");
    const btnTheme = $("btn-theme");
    const iconThemeDark = $("icon-theme-dark");
    const iconThemeLight = $("icon-theme-light");

    // Visualizer
    let audioCtx, analyser, sourceNode, gainNode, dataArray;

    function initVisualizer() {
        if (audioCtx) return;
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 128;
            dataArray = new Uint8Array(analyser.frequencyBinCount);
            gainNode = audioCtx.createGain();
            sourceNode = audioCtx.createMediaElementSource(audioPlayer);
            sourceNode.connect(gainNode);
            gainNode.connect(analyser);
            analyser.connect(audioCtx.destination);
            // Apply current volume to gainNode
            gainNode.gain.value = parseInt(volumeSlider.value) / 100;
        } catch {}
    }

    function drawVisualizer() {
        if (!analyser || playMode !== "audio") return;
        animFrameId = requestAnimationFrame(drawVisualizer);
        analyser.getByteFrequencyData(dataArray);

        const canvas = visualizer;
        const ctx = canvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.clientWidth * dpr;
        const h = canvas.clientHeight * dpr;
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
        }

        if (!smoothData) {
            smoothData = new Float32Array(dataArray.length);
        }

        const smoothFactor = 0.1;
        for (let i = 0; i < dataArray.length; i++) {
            smoothData[i] += (dataArray[i] / 255 - smoothData[i]) * smoothFactor;
        }

        vizTime += 0.016;
        ctx.clearRect(0, 0, w, h);

        // Compute energy bands
        let bass = 0, mid = 0;
        const third = Math.floor(smoothData.length / 3);
        for (let i = 0; i < third; i++) bass += smoothData[i];
        for (let i = third; i < smoothData.length; i++) mid += smoothData[i];
        bass = bass / Math.max(third, 1);
        mid = mid / Math.max(smoothData.length - third, 1);
        const energy = bass * 0.65 + mid * 0.35;

        // --- Layer 1: Blurred cover art backdrop ---
        if (coverImg.src && !coverImg.classList.contains("hidden")) {
            if (!coverImgObj) {
                coverImgObj = new Image();
                coverImgObj.crossOrigin = "anonymous";
                coverImgObj.src = coverImg.src;
            } else if (coverImgObj.src !== coverImg.src) {
                coverImgObj.src = coverImg.src;
            }

            if (coverImgObj.complete && coverImgObj.naturalWidth > 0) {
                ctx.save();
                ctx.filter = "blur(60px) brightness(0.4)";
                const imgRatio = coverImgObj.naturalWidth / coverImgObj.naturalHeight;
                const canvasRatio = w / h;
                let dw, dh, dx, dy;
                if (imgRatio > canvasRatio) {
                    dh = h * 1.3;
                    dw = dh * imgRatio;
                } else {
                    dw = w * 1.3;
                    dh = dw / imgRatio;
                }
                dx = (w - dw) / 2;
                dy = (h - dh) / 2;
                const driftX = Math.sin(vizTime * 0.3) * 8 * dpr;
                const driftY = Math.cos(vizTime * 0.2) * 6 * dpr;
                ctx.drawImage(coverImgObj, dx + driftX, dy + driftY, dw, dh);
                ctx.restore();
            }
        }

        // --- Layer 2: Breathing color wash ---
        const cx = w / 2, cy = h / 2;
        const glowR = Math.min(w, h) * (0.5 + bass * 0.12);
        const breathAlpha = 0.08 + energy * 0.14;

        const wash = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
        wash.addColorStop(0, `rgba(252, 60, 68, ${breathAlpha})`);
        wash.addColorStop(0.45, `rgba(175, 82, 222, ${breathAlpha * 0.6})`);
        wash.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = wash;
        ctx.fillRect(0, 0, w, h);
    }

    function stopVisualizer() {
        if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
    }
    // Helpers
    function formatTime(sec) {
        if (!sec || sec < 0) return "0:00";
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    }

    function showStatus(text) {
        statusText.textContent = text;
        statusBar.classList.remove("hidden");
        clearTimeout(showStatus._t);
        showStatus._t = setTimeout(() => statusBar.classList.add("hidden"), 4000);
    }

    function showPersistentStatus(text) {
        statusText.textContent = text;
        statusBar.classList.remove("hidden");
    }

    function hideStatus() {
        statusBar.classList.add("hidden");
    }

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }

    // Favorites
    function getFavorites() {
        try { return JSON.parse(localStorage.getItem("favorites") || "[]"); }
        catch { return []; }
    }

    function saveFavorites(favs) {
        localStorage.setItem("favorites", JSON.stringify(favs));
    }

    function syncFavoriteToServer(item) {
        fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...item, favorited_at: new Date().toISOString() }),
        }).catch(() => {});
    }

    function deleteFavoriteFromServer(id) {
        fetch(`/api/favorites/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
    }

    function isFavorited(id) {
        return getFavorites().some(f => f.id === id);
    }

    function toggleFavorite(item) {
        let favs = getFavorites();
        if (favs.some(f => f.id === item.id)) {
            favs = favs.filter(f => f.id !== item.id);
            deleteFavoriteFromServer(item.id);
        } else {
            favs.unshift({ ...item, favorited_at: new Date().toISOString() });
            syncFavoriteToServer(item);
        }
        saveFavorites(favs);
        renderFavorites();
        updateFavButton();
        renderResults();
    }

    function updateFavButton() {
        if (!currentVideoInfo) return;
        const fav = isFavorited(currentVideoInfo.id);
        $("icon-fav-empty").classList.toggle("hidden", fav);
        $("icon-fav-filled").classList.toggle("hidden", !fav);
        btnFavorite.classList.toggle("active", fav);
        favLabel.textContent = fav ? "已收藏" : "收藏";
    }

    // Render results
    function renderResults() {
        resultsList.innerHTML = "";
        if (currentResults.length === 0) {
            resultsEmpty.classList.remove("hidden");
            return;
        }
        resultsEmpty.classList.add("hidden");
        currentResults.forEach((item, i) => {
            const el = document.createElement("div");
            el.className = "song-item" + (activePlaylist === "results" && i === currentIndex ? " playing" : "");
            const fav = isFavorited(item.id);
            el.innerHTML = `
                <span class="song-idx">${i === currentIndex && isPlaying
                    ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="var(--accent)"><path d="M3 9v6h4l5 5V4L7 9H3z"/><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>'
                    : i + 1}</span>
                <div class="song-thumb">${item.thumbnail ? `<img src="${item.thumbnail}" alt="" loading="lazy">` : ""}</div>
                <div class="song-info">
                    <div class="song-name">${escapeHtml(item.title)}</div>
                    <div class="song-artist">${escapeHtml(item.uploader || "")}</div>
                </div>
                <span class="song-dur">${formatTime(item.duration)}</span>
                <div class="song-actions">
                    <button class="btn-fav ${fav ? "active" : ""}" data-idx="${i}" title="收藏">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="${fav ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                    </button>
                </div>
            `;
            el.addEventListener("click", (e) => {
                if (e.target.closest(".btn-fav")) {
                    toggleFavorite(currentResults[parseInt(e.target.closest(".btn-fav").dataset.idx)]);
                    return;
                }
                playTrack(i);
            });
            resultsList.appendChild(el);
        });
    }

    // Render favorites
    function renderFavorites(filter = "") {
        const favs = getFavorites();
        if (activePlaylist === "favorites") {
            favoritesPlaylist = favs;
        }
        favoritesList.innerHTML = "";
        const filtered = filter
            ? favs.filter(f => f.title.toLowerCase().includes(filter.toLowerCase()) || (f.artist || "").toLowerCase().includes(filter.toLowerCase()))
            : favs;
        if (filtered.length === 0) {
            favoritesEmpty.classList.remove("hidden");
            return;
        }
        favoritesEmpty.classList.add("hidden");
        filtered.forEach((item, i) => {
            const el = document.createElement("div");
            el.className = "song-item" + (activePlaylist === "favorites" && i === currentIndex ? " playing" : "");
            el.innerHTML = `
                <span class="song-idx">${i + 1}</span>
                <div class="song-thumb">${item.thumbnail ? `<img src="${item.thumbnail}" alt="" loading="lazy">` : ""}</div>
                <div class="song-info">
                    <div class="song-name">${escapeHtml(item.title)}</div>
                    <div class="song-artist">${escapeHtml(item.artist || item.source)}</div>
                </div>
                <span class="song-dur">${formatTime(item.duration)}</span>
                <div class="song-actions" style="opacity:1">
                    <button class="btn-fav active" title="取消收藏">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                    </button>
                </div>
            `;
            el.addEventListener("click", (e) => {
                if (e.target.closest(".btn-fav")) {
                    toggleFavorite(item);
                    return;
                }
                playFavoriteTrack(item, i);
            });
            favoritesList.appendChild(el);
        });
    }

    // Play
    async function playTrack(index) {
        if (index < 0 || index >= currentResults.length) return;
        activePlaylist = "results";
        currentIndex = index;
        const item = currentResults[index];
        currentVideoInfo = item;

        renderResults();
        renderFavorites();
        showPersistentStatus("获取播放链接中...");

        try {
            const resp = await fetch("/api/play", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ video_url: item.url, mode: playMode, quality: videoQuality }),
            });
            const data = await resp.json();
            hideStatus();
            try {
                startPlayback(data, item);
            } catch (e) {
                showStatus("播放初始化失败");
            }
        } catch (e) {
            showStatus("播放失败");
        }
    }

    async function playFavoriteTrack(item, idx) {
        activePlaylist = "favorites";
        favoritesPlaylist = getFavorites();
        currentIndex = idx !== undefined ? idx : favoritesPlaylist.findIndex(f => f.id === item.id);
        currentVideoInfo = item;

        renderFavorites();
        renderResults();

        showPersistentStatus("获取播放链接中...");
        try {
            const resp = await fetch("/api/play", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ video_url: item.url, mode: playMode, quality: videoQuality }),
            });
            const data = await resp.json();
            hideStatus();
            try {
                startPlayback(data, item);
            } catch (e) {
                showStatus("播放初始化失败");
            }
        } catch (e) {
            showStatus("播放失败");
        }
    }

    function getStreamUrl(streamInfo) {
        if (streamInfo.video_url && streamInfo.audio_url) {
            return `/api/stream/merge?video_url=${encodeURIComponent(streamInfo.video_url)}&audio_url=${encodeURIComponent(streamInfo.audio_url)}`;
        }
        return `/api/stream/proxy?url=${encodeURIComponent(streamInfo.url)}`;
    }

    function startPlayback(streamInfo, item) {
        playerArea.classList.remove("hidden");
        nowTitle.textContent = item.title;
        nowSource.textContent = `${item.source} · ${formatTime(item.duration)}`;

        // Set thumbnail
        if (item.thumbnail) {
            coverImg.src = `/api/image/proxy?url=${encodeURIComponent(item.thumbnail)}`;
            coverImg.classList.remove("hidden");
        } else {
            coverImg.classList.add("hidden");
        }

        const streamUrl = getStreamUrl(streamInfo);
        const isMerge = streamInfo.video_url && streamInfo.audio_url;

        if (playMode === "audio") {
            audioPlayer.src = streamUrl;
            audioPlayer.onerror = () => { showStatus("音频加载失败"); };
            audioPlayer.play().catch(() => {});
            syncVolume();
            videoPlayer.classList.add("hidden");
            videoPlayer.pause();
            coverArt.querySelector(".cover-placeholder").classList.add("hidden");
            coverImg.classList.remove("hidden");
            visualizer.classList.remove("hidden");
            initVisualizer();
            drawVisualizer();
        } else {
            stopVisualizer();
            audioPlayer.pause();
            coverImg.classList.add("hidden");
            if (isMerge) showPersistentStatus("正在合并音视频，请稍候...");
            else showPersistentStatus("加载视频中...");
            videoPlayer.onerror = () => {
                hideStatus();
                const err = videoPlayer.error;
                showStatus("视频加载失败" + (err ? ` (code ${err.code})` : ""));
            };
            videoPlayer.oncanplay = () => {
                hideStatus();
                syncVolume();
                videoPlayer.play().catch(e => {
                    showStatus("播放被阻止: " + e.message);
                });
            };
            videoPlayer.src = streamUrl;
            videoPlayer.load();
            videoPlayer.classList.remove("hidden");
            coverArt.querySelector(".cover-placeholder").classList.add("hidden");
            visualizer.classList.add("hidden");
        }

        isPlaying = true;
        updatePlayButton();
        updateFavButton();
        updateVideoControls();
        syncVolume();
    }

    function updatePlayButton() {
        $("icon-play").classList.toggle("hidden", isPlaying);
        $("icon-pause").classList.toggle("hidden", !isPlaying);
    }

    function togglePlay() {
        const el = playMode === "audio" ? audioPlayer : videoPlayer;
        if (el.paused) {
            el.play().catch(() => {});
            isPlaying = true;
        } else {
            el.pause();
            isPlaying = false;
        }
        updatePlayButton();
    }

    function playNext() {
        if (activePlaylist === "favorites") {
            if (currentIndex < favoritesPlaylist.length - 1) {
                playFavoriteTrack(favoritesPlaylist[currentIndex + 1], currentIndex + 1);
            }
        } else {
            if (currentIndex < currentResults.length - 1) playTrack(currentIndex + 1);
        }
    }

    function playPrev() {
        if (activePlaylist === "favorites") {
            if (currentIndex > 0) {
                playFavoriteTrack(favoritesPlaylist[currentIndex - 1], currentIndex - 1);
            }
        } else {
            if (currentIndex > 0) playTrack(currentIndex - 1);
        }
    }

    // Progress
    let isSeeking = false;

    function setupProgressSync() {
        audioPlayer.addEventListener("timeupdate", onProgressUpdate);
        audioPlayer.addEventListener("ended", playNext);
        videoPlayer.addEventListener("timeupdate", onProgressUpdate);
        videoPlayer.addEventListener("ended", playNext);
    }

    function onProgressUpdate() {
        if (isSeeking) return;
        const el = playMode === "audio" ? audioPlayer : videoPlayer;
        if (!el.duration || isNaN(el.duration)) return;
        const pct = (el.currentTime / el.duration) * 100;
        progressBar.value = pct;
        progressFill.style.width = pct + "%";
        timeCurrent.textContent = formatTime(el.currentTime);
        timeTotal.textContent = formatTime(el.duration);
    }

    // While dragging: update visual fill only, don't seek yet
    progressBar.addEventListener("input", () => {
        progressFill.style.width = progressBar.value + "%";
        const el = playMode === "audio" ? audioPlayer : videoPlayer;
        if (el.duration && !isNaN(el.duration)) {
            timeCurrent.textContent = formatTime((progressBar.value / 100) * el.duration);
        }
    });

    // On drag start: suppress timeupdate from overwriting the slider
    progressBar.addEventListener("mousedown", () => { isSeeking = true; });
    progressBar.addEventListener("touchstart", () => { isSeeking = true; }, { passive: true });

    // On drag end: perform the actual seek
    progressBar.addEventListener("change", () => {
        const el = playMode === "audio" ? audioPlayer : videoPlayer;
        if (el.duration && !isNaN(el.duration)) {
            el.currentTime = (progressBar.value / 100) * el.duration;
        }
        isSeeking = false;
    });

    // Volume control
    let isMuted = false;
    let prevVolume = 80;

    function syncVolume() {
        const val = parseInt(volumeSlider.value);
        const v = val / 100;
        try { audioPlayer.volume = v; } catch(e) {}
        try { videoPlayer.volume = v; } catch(e) {}
        try { if (gainNode) gainNode.gain.value = v; } catch(e) {}
        volFill.style.width = val + "%";
        volLabel.textContent = val;
    }

    function updateMuteIcon() {
        const muted = parseInt(volumeSlider.value) === 0;
        $("icon-vol-on").classList.toggle("hidden", muted);
        $("icon-vol-off").classList.toggle("hidden", !muted);
        btnMute.classList.toggle("muted", muted);
    }

    // Initialize
    syncVolume();

    // Bind both input (real-time drag) and change (on release) events
    function onVolumeChange() {
        const val = parseInt(volumeSlider.value);
        syncVolume();
        if (val > 0) {
            isMuted = false;
            prevVolume = val;
        } else {
            isMuted = true;
        }
        updateMuteIcon();
    }
    volumeSlider.addEventListener("input", onVolumeChange);
    volumeSlider.addEventListener("change", onVolumeChange);

    btnMute.addEventListener("click", () => {
        if (isMuted) {
            isMuted = false;
            volumeSlider.value = prevVolume;
        } else {
            isMuted = true;
            prevVolume = parseInt(volumeSlider.value) || 80;
            volumeSlider.value = 0;
        }
        syncVolume();
        updateMuteIcon();
    });

    // Mode toggle
    let switchingMode = false;
    btnMode.addEventListener("click", async () => {
        if (switchingMode) return;
        const newMode = playMode === "audio" ? "video" : "audio";
        playMode = newMode;
        $("icon-audio").classList.toggle("hidden", newMode !== "audio");
        $("icon-video").classList.toggle("hidden", newMode !== "video");
        modeLabel.textContent = newMode === "audio" ? "音频" : "视频";
        btnMode.classList.toggle("active", newMode === "video");
        updateVideoControls();

        if (currentVideoInfo) {
            switchingMode = true;
            const currentProgress = newMode === "video"
                ? audioPlayer.currentTime
                : videoPlayer.currentTime;

            // Pause both players immediately
            audioPlayer.pause();
            videoPlayer.pause();
            stopVisualizer();

            showPersistentStatus("切换中...");
            try {
                const resp = await fetch("/api/play", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ video_url: currentVideoInfo.url, mode: newMode, quality: videoQuality }),
                });
                const data = await resp.json();
                const streamUrl = getStreamUrl(data);
                const isMerge = data.video_url && data.audio_url;

                if (newMode === "audio") {
                    audioPlayer.src = streamUrl;
                    audioPlayer.play().catch(() => {});
                    videoPlayer.classList.add("hidden");
                    coverArt.querySelector(".cover-placeholder").classList.add("hidden");
                    coverImg.classList.remove("hidden");
                    visualizer.classList.remove("hidden");
                    initVisualizer();
                            drawVisualizer();
                    hideStatus();
                } else {
                    coverImg.classList.add("hidden");
                    if (isMerge) showPersistentStatus("正在合并音视频，请稍候...");
                    else showPersistentStatus("加载视频中...");
                    videoPlayer.onerror = () => {
                        hideStatus();
                        const err = videoPlayer.error;
                        showStatus("视频加载失败" + (err ? ` (code ${err.code})` : ""));
                    };
                    videoPlayer.oncanplay = () => {
                        hideStatus();
                        videoPlayer.play().catch(e => {
                            showStatus("播放被阻止: " + e.message);
                        });
                    };
                    videoPlayer.src = streamUrl;
                    videoPlayer.load();
                    videoPlayer.classList.remove("hidden");
                    coverArt.querySelector(".cover-placeholder").classList.add("hidden");
                    visualizer.classList.add("hidden");
                }
            } catch {
                showStatus("切换失败");
            } finally {
                switchingMode = false;
            }
        }
    });

    // Video controls visibility
    function updateVideoControls() {
        const isVideo = playMode === "video";
        qualityWrapper.classList.toggle("hidden", !isVideo);
        btnFullscreen.classList.toggle("hidden", !isVideo);
        if (!isVideo) qualityMenu.classList.add("hidden");
    }

    // Quality selector
    btnQuality.addEventListener("click", (e) => {
        e.stopPropagation();
        qualityMenu.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
        if (!qualityWrapper.contains(e.target)) {
            qualityMenu.classList.add("hidden");
        }
    });

    document.querySelectorAll(".quality-option").forEach(opt => {
        opt.addEventListener("click", async (e) => {
            e.stopPropagation();
            const newQuality = opt.dataset.quality;
            if (newQuality === videoQuality) {
                qualityMenu.classList.add("hidden");
                return;
            }
            videoQuality = newQuality;
            qualityLabel.textContent = newQuality;
            document.querySelectorAll(".quality-option").forEach(o => o.classList.remove("active"));
            opt.classList.add("active");
            qualityMenu.classList.add("hidden");

            // Re-fetch stream with new quality if currently playing video
            if (currentVideoInfo && playMode === "video") {
                showPersistentStatus(`切换到 ${newQuality}...`);
                try {
                    const resp = await fetch("/api/play", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ video_url: currentVideoInfo.url, mode: "video", quality: newQuality }),
                    });
                    const data = await resp.json();
                    hideStatus();
                    startPlayback(data, currentVideoInfo);
                } catch {
                    showStatus("切换清晰度失败");
                }
            }
        });
    });

    // Fullscreen
    btnFullscreen.addEventListener("click", () => {
        const container = document.querySelector(".player-visual");
        if (!container) return;
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        } else {
            container.requestFullscreen().catch(() => {
                // Fallback for webkit
                if (videoPlayer.webkitRequestFullscreen) videoPlayer.webkitRequestFullscreen();
            });
        }
    });

    // Favorite button
    btnFavorite.addEventListener("click", () => {
        if (currentVideoInfo) toggleFavorite(currentVideoInfo);
    });

    // Chat / Search
    async function sendMessage() {
        const msg = chatInput.value.trim();
        if (!msg) return;
        chatInput.value = "";

        showPersistentStatus("搜索中...");

        try {
            const resp = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: msg }),
            });

            const reader = resp.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                const lines = buffer.split("\n");
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.startsWith("event:")) {
                        var eventType = line.slice(6).trim();
                    } else if (line.startsWith("data:") && eventType) {
                        const data = line.slice(5).trim();
                        handleSSE(eventType, data);
                        eventType = null;
                    }
                }
            }
        } catch (e) {
            showStatus("请求失败");
        }
    }

    function handleSSE(event, data) {
        switch (event) {
            case "thinking":
            case "searching":
            case "done":
                showPersistentStatus(data);
                break;
            case "found":
                try {
                    currentResults = JSON.parse(data);
                    currentIndex = -1;
                    renderResults();
                    hideStatus();
                } catch {}
                break;
            case "error":
                showStatus(data);
                break;
        }
    }

    // Settings
    async function loadSettings() {
        try {
            const resp = await fetch("/api/config");
            const cfg = await resp.json();
            $("cfg-provider").value = cfg.llm.provider;
            $("cfg-api-key").value = "";
            $("cfg-model").value = cfg.llm.model;
            $("cfg-base-url").value = cfg.llm.base_url || "";
            const mode = cfg.player.default_mode;
            const radio = document.querySelector(`input[name="cfg-mode"][value="${mode}"]`);
            if (radio) {
                radio.checked = true;
                document.querySelectorAll('.seg-item').forEach(s => s.classList.remove('active'));
                radio.closest('.seg-item')?.classList.add('active');
            }
            playMode = mode;
            // Update Bilibili login status
            const hasSessdata = !!cfg.player.bilibili_sessdata;
            $('bili-dot').classList.toggle('logged-in', hasSessdata);
            $('bili-status-text').textContent = hasSessdata ? '已登录' : '未登录';
        } catch {}
    }

    btnSettings.addEventListener("click", () => {
        loadSettings();
        settingsModal.classList.remove("hidden");
    });

    document.querySelectorAll('.seg-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.seg-item').forEach(s => s.classList.remove('active'));
            item.classList.add('active');
        });
    });

    btnCloseSettings.addEventListener("click", () => settingsModal.classList.add("hidden"));
    settingsModal.addEventListener("click", (e) => {
        if (e.target === settingsModal) settingsModal.classList.add("hidden");
    });

    btnSaveSettings.addEventListener("click", async () => {
        const selectedMode = document.querySelector('input[name="cfg-mode"]:checked')?.value || "audio";
        const updates = {
            llm_provider: $("cfg-provider").value,
            llm_api_key: $("cfg-api-key").value,
            llm_model: $("cfg-model").value,
            llm_base_url: $("cfg-base-url").value,
            player_default_mode: selectedMode,
        };
        try {
            await fetch("/api/config", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });
            playMode = selectedMode;
            settingsModal.classList.add("hidden");
            showStatus("设置已保存");
        } catch (e) {
            showStatus("保存失败");
        }
    });

    // Bilibili QR Code Login
    let qrPollTimer = null;

    $("btn-bili-qr").addEventListener("click", async () => {
        const qrArea = $("qr-area");
        const qrImage = $("qr-image");
        const qrStatus = $("qr-status");

        // Stop any existing poll
        if (qrPollTimer) { clearInterval(qrPollTimer); qrPollTimer = null; }

        qrStatus.textContent = "正在生成二维码...";
        qrStatus.className = "qr-status";
        qrArea.classList.remove("hidden");

        try {
            const resp = await fetch("/api/bilibili/qrcode");
            const data = await resp.json();
            if (data.error) {
                qrStatus.textContent = data.error;
                qrStatus.className = "qr-status error";
                return;
            }

            qrImage.src = data.qr_image;
            qrStatus.textContent = "请用B站 App 扫描二维码";
            qrStatus.className = "qr-status";

            // Poll for scan result
            const key = data.qrcode_key;
            qrPollTimer = setInterval(async () => {
                try {
                    const pollResp = await fetch(`/api/bilibili/qrcode/poll?key=${encodeURIComponent(key)}`);
                    const pollData = await pollResp.json();

                    qrStatus.textContent = pollData.message;

                    if (pollData.status === "scanned") {
                        qrStatus.className = "qr-status scanned";
                    } else if (pollData.status === "success") {
                        qrStatus.className = "qr-status success";
                        clearInterval(qrPollTimer);
                        qrPollTimer = null;
                        $("bili-dot").classList.add("logged-in");
                        $("bili-status-text").textContent = "已登录";
                        setTimeout(() => qrArea.classList.add("hidden"), 2000);
                    } else if (pollData.status === "expired" || pollData.status === "error") {
                        qrStatus.className = "qr-status error";
                        clearInterval(qrPollTimer);
                        qrPollTimer = null;
                    }
                } catch {
                    qrStatus.textContent = "网络错误";
                    qrStatus.className = "qr-status error";
                    clearInterval(qrPollTimer);
                    qrPollTimer = null;
                }
            }, 2000);

        } catch {
            qrStatus.textContent = "生成二维码失败";
            qrStatus.className = "qr-status error";
        }
    });

    // Clean up poll when modal closes
    const origCloseSettings = () => {
        settingsModal.classList.add("hidden");
        if (qrPollTimer) { clearInterval(qrPollTimer); qrPollTimer = null; }
        $("qr-area").classList.add("hidden");
    };
    btnCloseSettings.removeEventListener("click", origCloseSettings);
    btnCloseSettings.addEventListener("click", origCloseSettings);

    // Tabs
    document.querySelectorAll(".tab").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            const target = tab.dataset.tab;
            $("results-panel").classList.toggle("hidden", target !== "results");
            $("favorites-panel").classList.toggle("hidden", target !== "favorites");
            if (target === "favorites") renderFavorites();
        });
    });

    favFilter.addEventListener("input", () => renderFavorites(favFilter.value));

    // Player controls
    btnPlay.addEventListener("click", togglePlay);
    btnNext.addEventListener("click", playNext);
    btnPrev.addEventListener("click", playPrev);

    // Chat input
    btnSend.addEventListener("click", sendMessage);
    chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendMessage();
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
        if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
        if (e.code === "Space") { e.preventDefault(); togglePlay(); }
        if (e.code === "ArrowRight") playNext();
        if (e.code === "ArrowLeft") playPrev();
    });

    // Heartbeat - auto-shutdown server when browser closes
    function sendHeartbeat() {
        fetch("/api/heartbeat", { method: "POST" }).catch(() => {});
    }

    setInterval(sendHeartbeat, 5000);
    sendHeartbeat();

    window.addEventListener("beforeunload", () => {
        navigator.sendBeacon("/api/heartbeat");
    });

    // Init
    setupProgressSync();
    renderFavorites();
    loadSettings();

    // Apple Premium Theme Switcher Logic
    let currentTheme = localStorage.getItem("theme") || "light";
    function applyTheme(theme) {
        if (theme === "light") {
            document.body.classList.add("light-theme");
            iconThemeDark.classList.add("hidden");
            iconThemeLight.classList.remove("hidden");
        } else {
            document.body.classList.remove("light-theme");
            iconThemeDark.classList.remove("hidden");
            iconThemeLight.classList.add("hidden");
        }
        localStorage.setItem("theme", theme);
    }
    btnTheme.addEventListener("click", () => {
        currentTheme = currentTheme === "dark" ? "light" : "dark";
        applyTheme(currentTheme);
    });
    applyTheme(currentTheme);
})();
