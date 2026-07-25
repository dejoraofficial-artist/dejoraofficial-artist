// Global Audio Manager
const AudioManager = {
    audio: new Audio(),
    currentUrl: null,
    playingButtons: [],

    play(url, buttons) {
        if (this.currentUrl === url && !this.audio.paused) {
            this.pause();
            return;
        }
        
        this.resetButtons();
        
        if (this.currentUrl !== url) {
            this.audio.src = url;
            this.currentUrl = url;
        }
        
        this.playingButtons = buttons;
        this.audio.play().catch(e => console.error("Audio play failed:", e));
        
        buttons.forEach(btn => {
            if(btn) {
                btn.classList.add('playing');
                const i = btn.querySelector('i');
                if (i) {
                    i.className = 'fas fa-pause'; // Force pause icon
                }
            }
        });
    },

    pause() {
        this.audio.pause();
        this.resetButtons();
    },
    
    stop() {
        this.pause();
        this.audio.currentTime = 0;
    },

    resetButtons() {
        this.playingButtons.forEach(btn => {
            if(btn) {
                btn.classList.remove('playing');
                const i = btn.querySelector('i');
                if(i) {
                    // Check if it's a play-lyrics combo button or minimal button
                    if (btn.classList.contains('latest-play-lyrics-btn')) {
                        i.className = 'fas fa-play';
                    } else {
                        i.className = 'fas fa-play';
                    }
                }
            }
        });
        this.playingButtons = [];
    }
};

AudioManager.audio.addEventListener('ended', () => {
    AudioManager.resetButtons();
});

document.addEventListener('DOMContentLoaded', () => {
    // Current Year for Footer
    document.getElementById('current-year').textContent = new Date().getFullYear();

    // Load Data
    if (typeof websiteData !== 'undefined') {
        buildWebsite(websiteData);
        // Initialize 3D scroll animations, hover effects, and rings after DOM is built
        setTimeout(() => {
            initScrollAnimations();
            initTiltEffect();
            initHeroRings();
            initVinylParticles();
        }, 100);
    } else {
        console.error('Error loading data: websiteData is not defined.');
        document.getElementById('artist-name').textContent = "Error loading data.";
    }
});

function buildWebsite(data) {
    // 1. Artist Info
    document.getElementById('artist-name').textContent = data.artist.name;
    document.getElementById('footer-name').textContent = data.artist.name;
    document.title = `${data.artist.name} | Official Site`;
    
    const artistImg = document.getElementById('artist-img');
    artistImg.src = data.artist.image;

    // Extract artist image colors for the hero background
    artistImg.addEventListener('load', () => {
        applyArtistBackground(artistImg);
    });
    // If already cached
    if (artistImg.complete && artistImg.naturalWidth) {
        applyArtistBackground(artistImg);
    }

    if (data.artist.badge) {
        const badge = document.getElementById('artist-badge');
        
        // Inner HTML for text and optional dropdown
        let badgeHTML = `<span class="badge-text">${data.artist.badge} <i class="fas fa-chevron-down" style="font-size: 0.7em;"></i></span>`;
        
        // Check if there are streaming platforms defined
        if (data.artist.streamingPlatforms && Object.keys(data.artist.streamingPlatforms).length > 0) {
            const platformMap = {
                spotify: { name: 'Spotify', icon: 'fab fa-spotify' },
                appleMusic: { name: 'Apple Music', icon: 'fab fa-apple' },
                youtubeMusic: { name: 'YouTube Music', icon: 'fas fa-play-circle' },
                soundcloud: { name: 'SoundCloud', icon: 'fab fa-soundcloud' },
                tidal: { name: 'Tidal', icon: 'fas fa-water' },
                amazonMusic: { name: 'Amazon Music', icon: 'fab fa-amazon' },
            };
            
            let dropdownHTML = `<div class="badge-dropdown">`;
            for (const [key, url] of Object.entries(data.artist.streamingPlatforms)) {
                const info = platformMap[key] || { name: key.charAt(0).toUpperCase() + key.slice(1), icon: 'fas fa-music' };
                dropdownHTML += `<a href="${url}" target="_blank" class="badge-link"><i class="${info.icon}"></i> ${info.name}</a>`;
            }
            dropdownHTML += `</div>`;
            badgeHTML += dropdownHTML;
        } else {
            // No dropdown, just text
            badgeHTML = `<span class="badge-text">${data.artist.badge}</span>`;
            badge.style.cursor = 'default';
        }
        
        badge.innerHTML = badgeHTML;
        badge.classList.remove('hidden');

        // Handle interaction (Desktop Hover & Mobile Click)
        const dropdown = badge.querySelector('.badge-dropdown');
        if (dropdown) {
            const artistName = document.getElementById('artist-name');
            
            const expandMenu = () => {
                dropdown.classList.add('show');
                artistName.classList.add('fade-out');
            };
            
            const collapseMenu = () => {
                dropdown.classList.remove('show');
                artistName.classList.remove('fade-out');
            };

            // Desktop Hover
            badge.addEventListener('mouseenter', expandMenu);
            badge.addEventListener('mouseleave', collapseMenu);

            // Mobile/Desktop Click Toggle
            badge.addEventListener('click', (e) => {
                e.stopPropagation();
                if (dropdown.classList.contains('show')) {
                    // if clicking while already open, don't collapse on desktop because mouseleave handles it,
                    // but on mobile we might want it to toggle.
                    // Actually, toggle is best:
                    if (e.pointerType !== "mouse") {
                        collapseMenu();
                    }
                } else {
                    expandMenu();
                }
            });

            // Close dropdown if clicking outside
            document.addEventListener('click', (e) => {
                if (!badge.contains(e.target)) {
                    collapseMenu();
                }
            });
        }
    }

    // Remove old about section logic as we use bio section now
    
    // Bio Section
    if (data.settings.showAbout && data.artist.bio) {
        document.getElementById('artist-bio-text').textContent = data.artist.bio;
        const bioImg = document.getElementById('bio-img');
        // Use bioImage if provided, otherwise fallback to hero artist image
        bioImg.src = data.artist.bioImage || data.artist.image;
        
        // Render Bio Socials
        const bioSocialsContainer = document.getElementById('bio-socials');
        if (bioSocialsContainer && data.artist.socials && data.artist.socials.length > 0) {
            bioSocialsContainer.innerHTML = data.artist.socials.map(social => 
                `<a href="${social.url}" target="_blank" class="bio-social-pill"><i class="${social.icon}"></i> ${social.platform}</a>`
            ).join('');
        }
        
        document.getElementById('bio-section').classList.remove('hidden');
    }

    // Note: Old hero socials container removed. Socials are now in the bio section.

    // 3. Latest Release
    if (data.settings.showLatestRelease && data.latestRelease) {
        document.getElementById('latest-type').textContent = data.latestRelease.type;
        document.getElementById('latest-title').textContent = data.latestRelease.title;
        
        const latestImg = document.getElementById('latest-img');
        latestImg.src = data.latestRelease.image;
        
        // Extract Color for Background when image loads
        latestImg.addEventListener('load', () => {
            applyDynamicColor(latestImg);
        });
        // If already cached/loaded
        if (latestImg.complete && latestImg.naturalWidth) {
            applyDynamicColor(latestImg);
        }

        const latestLinks = document.getElementById('latest-links');
        data.latestRelease.links.forEach(link => {
            const a = document.createElement('a');
            a.href = link.url;
            a.target = "_blank";
            a.className = "platform-link";
            a.innerHTML = `<i class="${link.icon}"></i> ${link.platform}`;
            latestLinks.appendChild(a);
        });
        
        // Lyrics Flip Logic for Latest Release
        const latestCard = document.getElementById('latest-release-card');
        const latestFlipper = document.getElementById('latest-flipper');
        const latestCardBack = document.getElementById('latest-card-back');
        
        const previewUrl = data.latestRelease.preview;
        const hasPreview = !!previewUrl;
        
        // Append Play button to the front content
        const latestCardContent = document.querySelector('.card-content');
        
        if (hasPreview) {
            const playBtn = document.createElement('button');
            playBtn.className = 'latest-play-lyrics-btn';
            playBtn.innerHTML = `<i class="fas fa-play"></i> Play Preview`;
            latestCardContent.appendChild(playBtn);
            
            playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                AudioManager.play(previewUrl, [playBtn]);
            });
        }
        
        // Remove the unused back card since lyrics are disabled for Latest Release
        if (latestCardBack) {
            latestCardBack.remove();
        }
        
        document.getElementById('latest-release-section').classList.remove('hidden');
    }

    // 4. Discography (Grouped intelligently with Tabs)
    if (data.settings.showDiscography && data.discography && data.discography.length > 0) {
        const discographySection = document.getElementById('discography-section');
        const gridContainer = document.getElementById('discography-grid');
        const tabsContainer = document.getElementById('discography-tabs');
        gridContainer.innerHTML = ''; // clear generic stuff
        tabsContainer.innerHTML = ''; // clear generic stuff

        // Group by type
        const grouped = data.discography.reduce((acc, release) => {
            const type = release.type.toUpperCase();
            if (!acc[type]) acc[type] = [];
            acc[type].push(release);
            return acc;
        }, {});

        const types = Object.keys(grouped);

        // Render Tabs and Groups
        types.forEach((type, index) => {
            const isFirst = index === 0;
            const tabName = type + (grouped[type].length > 1 && !type.endsWith('S') ? 'S' : '');
            
            // 1. Create Tab Button
            const tabBtn = document.createElement('button');
            tabBtn.className = `tab-btn ${isFirst ? 'active' : ''}`;
            tabBtn.textContent = tabName;
            tabBtn.dataset.target = type;
            tabsContainer.appendChild(tabBtn);

            // 2. Create Group Grid
            const groupGrid = document.createElement('div');
            groupGrid.className = 'discography-group-grid';
            groupGrid.id = `group-${type}`;
            if (!isFirst) {
                groupGrid.classList.add('hidden');
            }

            grouped[type].forEach(release => {
                const card = document.createElement('div');
                card.className = "disco-card";
                
                // Generate Links HTML securely handling missing links
                const linksHTML = (release.links || []).map(link => 
                    `<a href="${link.url}" target="_blank" class="platform-link"><i class="${link.icon}"></i> ${link.platform}</a>`
                ).join('');
                
                const previewUrl = release.preview;
                const hasPreview = !!previewUrl;
                
                const frontPlayBtnHTML = hasPreview ? `<button class="audio-player-btn front-play"><i class="fas fa-play"></i></button>` : '';
                const backPlayBtnHTML = hasPreview ? `<button class="audio-player-btn back-play"><i class="fas fa-play"></i></button>` : '';
                
                const lyrics = release.lyrics || "No lyrics available.";

                card.innerHTML = `
                    <div class="card-flipper">
                        <div class="card-front">
                            <div class="card-image-container">
                                <img src="${release.image}" alt="${release.title}" style="aspect-ratio: 1/1; object-fit: cover;">
                                ${frontPlayBtnHTML}
                            </div>
                            <span class="release-type">${release.type}</span>
                            <h3 class="release-title">${release.title}</h3>
                            <div class="links-container">
                                ${linksHTML}
                            </div>
                            <button class="latest-play-lyrics-btn disco-lyrics-btn" style="margin-top:15px; width:100%; justify-content:center;"><i class="fas fa-align-left"></i> Lyrics</button>
                        </div>
                        <div class="card-back">
                            ${backPlayBtnHTML}
                            <button class="back-btn"><i class="fas fa-arrow-left"></i> Back to Artwork</button>
                            <h4 class="lyrics-title">Lyrics</h4>
                            <div class="lyrics-text">${lyrics}</div>
                        </div>
                    </div>
                `;
                
                const flipper = card.querySelector('.card-flipper');
                const frontPlayBtn = card.querySelector('.front-play');
                const backPlayBtn = card.querySelector('.back-play');
                const lyricsBtn = card.querySelector('.disco-lyrics-btn');
                const backBtn = card.querySelector('.back-btn');
                
                if (frontPlayBtn) {
                    frontPlayBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        AudioManager.play(previewUrl, [frontPlayBtn, backPlayBtn]);
                    });
                }
                
                if (backPlayBtn) {
                    backPlayBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        AudioManager.play(previewUrl, [frontPlayBtn, backPlayBtn]);
                    });
                }
                
                lyricsBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    flipper.classList.add('flipped');
                });
                
                backBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    flipper.classList.remove('flipped');
                    AudioManager.stop();
                });
                
                groupGrid.appendChild(card);
            });
            gridContainer.appendChild(groupGrid);
        });

        // Add Tab Click Logic
        const tabBtns = tabsContainer.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Deactivate all
                tabBtns.forEach(t => t.classList.remove('active'));
                const grids = gridContainer.querySelectorAll('.discography-group-grid');
                grids.forEach(g => g.classList.add('hidden'));
                
                // Activate clicked
                btn.classList.add('active');
                const targetGrid = document.getElementById(`group-${btn.dataset.target}`);
                if (targetGrid) {
                    targetGrid.classList.remove('hidden');
                }
            });
        });
        
        discographySection.classList.remove('hidden');
    }
}

// Extract colors from artist image → paint the page top, fade to black
function applyArtistBackground(imageElement) {
    try {
        const colorThief = new ColorThief();
        const palette = colorThief.getPalette(imageElement, 5);
        if (!palette || palette.length < 2) return;

        const [r0, g0, b0] = palette[0];
        const [r1, g1, b1] = palette[1];
        const [r2, g2, b2] = palette[2] || palette[1];

        const bg = document.getElementById('dynamic-bg');

        // A tall, multi-stop vertical gradient that saturates at top and bleeds to black
        bg.style.backgroundImage = `
            linear-gradient(
                to bottom,
                rgba(${r0}, ${g0}, ${b0}, 0.55)  0%,
                rgba(${r1}, ${g1}, ${b1}, 0.35) 25%,
                rgba(${r2}, ${g2}, ${b2}, 0.18) 50%,
                rgba(10,  10,  10,  0.8)          75%,
                rgb(10, 10, 10)                  100%
            ),
            radial-gradient(ellipse at 50% 0%, rgba(${r0}, ${g0}, ${b0}, 0.4) 0%, transparent 65%)
        `;

        // Also store dominant color as CSS var so cards can use it
        document.documentElement.style.setProperty('--artist-color', `rgb(${r0}, ${g0}, ${b0})`);
        document.documentElement.style.setProperty('--artist-color-alpha', `rgba(${r0}, ${g0}, ${b0}, 0.4)`);
    } catch (e) {
        console.log('Artist color extraction failed:', e);
    }
}

function applyDynamicColor(imageElement) {
    // Set the animated blurred album art background immediately so it shows locally
    const releaseCardBg = document.getElementById('release-card-bg');
    if (releaseCardBg) {
        releaseCardBg.style.backgroundImage = `url('${imageElement.src}')`;
    }

    try {
        const colorThief = new ColorThief();
        // Get dominant color and a palette of 4 colors
        const color = colorThief.getColor(imageElement);
        const palette = colorThief.getPalette(imageElement, 4);
        
        if (color) {
            const bg = document.getElementById('dynamic-bg');
            
            // Create a multi-point mesh gradient
            const color1 = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.25)`;
            let color2 = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.15)`;
            let color3 = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.1)`;
            
            if (palette && palette.length >= 3) {
                color2 = `rgba(${palette[1][0]}, ${palette[1][1]}, ${palette[1][2]}, 0.2)`;
                color3 = `rgba(${palette[2][0]}, ${palette[2][1]}, ${palette[2][2]}, 0.15)`;
            }
            
            // Set CSS variables for global dynamic styling
            document.documentElement.style.setProperty('--dominant-color', `rgb(${color[0]}, ${color[1]}, ${color[2]})`);
            document.documentElement.style.setProperty('--dominant-color-alpha', `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.5)`);
            
            if (palette && palette.length >= 3) {
                document.documentElement.style.setProperty('--palette-1', `rgb(${palette[1][0]}, ${palette[1][1]}, ${palette[1][2]})`);
                document.documentElement.style.setProperty('--palette-2', `rgb(${palette[2][0]}, ${palette[2][1]}, ${palette[2][2]})`);
            }

            // Apply a multi-gradient background
            bg.style.backgroundImage = `
                radial-gradient(circle at 0% 0%, ${color1} 0%, transparent 50%),
                radial-gradient(circle at 100% 100%, ${color2} 0%, transparent 50%),
                radial-gradient(circle at 50% 50%, ${color3} 0%, transparent 60%)
            `;
        }
    } catch (e) {
        console.log("ColorThief failed. Background will remain default.", e);
    }
}

// Interactive 3D Tilt Effect
function initTiltEffect() {
    const cards = document.querySelectorAll('.release-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Calculate tilt (max 8 degrees)
            const rotateX = ((y - centerY) / centerY) * -8;
            const rotateY = ((x - centerX) / centerX) * 8;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = ''; // Reset on leave to allow CSS transition
        });
    });
}

// Init Parallax Hero Rings
function initHeroRings() {
    const ringsContainer = document.getElementById('hero-rings');
    if (!ringsContainer) return;
    
    // Create 4 randomized concentric rings with orbiting vinyls
    for (let i = 0; i < 4; i++) {
        const wrapper = document.createElement('div');
        wrapper.className = 'hero-ring-wrapper';
        
        const ring = document.createElement('div');
        ring.className = 'hero-ring';
        
        // Base size increases per ring
        const size = 380 + (i * 220) + (Math.random() * 80);
        wrapper.style.width = `${size}px`;
        wrapper.style.height = `${size}px`;
        
        // Randomize orbit speed and direction
        const spinDuration = 30 + (Math.random() * 40);
        const direction = i % 2 === 0 ? 'normal' : 'reverse';
        ring.style.animation = `vinylOrbitSpin ${spinDuration}s linear infinite ${direction}`;
        
        // Create the orbiting vinyl that sits on the ring line
        const vinyl = document.createElement('i');
        vinyl.className = 'fas fa-compact-disc orbiting-vinyl';
        
        // Size it proportionally to the ring index
        const vSize = 20 + (i * 8);
        vinyl.style.fontSize = `${vSize}px`;
        vinyl.style.top = `-${vSize / 2}px`; // Center vertically on the border
        
        // Give the vinyl its own local spin on its axis
        const selfSpinDuration = 3 + Math.random() * 4;
        vinyl.style.animation = `vinylSelfSpin ${selfSpinDuration}s linear infinite`;
        
        ring.appendChild(vinyl);
        wrapper.appendChild(ring);
        ringsContainer.appendChild(wrapper);
    }

    // Cache the wrappers OUTSIDE the scroll event to save CPU
    const wrappers = document.querySelectorAll('.hero-ring-wrapper');
    
    // Scroll parallax effect
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrollY = window.scrollY;
                
                // Scroll the rings up to match the page scroll
                if (ringsContainer) {
                    ringsContainer.style.transform = `translateY(-${scrollY}px)`;
                }
                
                wrappers.forEach((wrapper, index) => {
                    const speed = 1 + (index * 0.2);
                    const scale = 1 + (scrollY * scrollY * 0.000004 * speed);
                    const opacity = Math.max(0, 0.7 - (scrollY * 0.001) - (index * 0.08));
                    
                    wrapper.style.transform = `translate(-50%, -50%) scale(${scale})`;
                    wrapper.style.opacity = opacity;
                });
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
    
    // Trigger initial calculation
    window.dispatchEvent(new Event('scroll'));
}

// Init Vinyl Background Particles
function initVinylParticles() {
    const container = document.getElementById('vinyl-particles-container');
    if (!container) return;

    const particleCount = 10; // Reduced by 60% (from 25 to 10) for a cleaner look

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('i');
        // Using font-awesome compact disc icon for a vinyl look
        particle.className = 'fas fa-compact-disc vinyl-particle';
        
        // Randomize size (make them bigger)
        const size = 20 + Math.random() * 35; 
        particle.style.fontSize = `${size}px`;
        
        // Randomize position across the entire viewport
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        particle.style.left = `${left}vw`;
        particle.style.top = `${top}vh`;
        
        // Randomize animation durations and delays so they are independent
        const floatDuration = 15 + Math.random() * 25; // 15s to 40s
        const twinkleDuration = 4 + Math.random() * 6; // 4s to 10s
        const delay = Math.random() * 10;
        
        // Apply animations
        particle.style.animation = `vinylFloat ${floatDuration}s linear infinite, vinylTwinkle ${twinkleDuration}s ease-in-out ${delay}s infinite`;
        
        container.appendChild(particle);
    }
}

// 3D Scroll Reveal Effect (Lightweight)
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Stop observing once it has appeared
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Elements to animate (Added tabs and bio sections that were missing)
    const elementsToAnimate = document.querySelectorAll('.release-card, .disco-card, .group-title, .hero-content, .tabs-container, .bio-content-wrapper');
    elementsToAnimate.forEach(el => {
        el.classList.add('scroll-reveal');
        observer.observe(el);
    });
}
