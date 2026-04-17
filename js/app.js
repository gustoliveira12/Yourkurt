// Esprokurt - Social Network JavaScript
// Adding interactivity and animations

document.addEventListener('DOMContentLoaded', function() {
    // Hide loading screen
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
        }, 1500);
    }

    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe post cards and other elements
    document.querySelectorAll('.post-card, .widget, .profile-card').forEach(el => {
        observer.observe(el);
    });

    // Notification badge animation
    const badges = document.querySelectorAll('.badge');
    badges.forEach(badge => {
        setInterval(() => {
            badge.classList.toggle('pulse');
        }, 2000);
    });

    // Mood selector interaction
    const moodBtns = document.querySelectorAll('.mood-btn');
    moodBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            moodBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Search functionality placeholder
    const searchInput = document.querySelector('.nav-search input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            // Placeholder for search functionality
            console.log('Searching for:', this.value);
        });
    }

    // Navbar actions
    const navTargets = {
        'Mensagens': 'pages/messages.html',
        'Amigos': 'pages/friends.html'
    };

    const notificationIcon = document.querySelector('.nav-icon[title="Notificações"]');
    let notificationBubble = null;

    const closeNotificationBubble = () => {
        if (notificationBubble) {
            notificationBubble.remove();
            notificationBubble = null;
        }
    };

    const createNotificationBubble = () => {
        const bubble = document.createElement('div');
        bubble.className = 'notification-bubble';
        bubble.innerHTML = `
            <h4>Notificações recentes</h4>
            <div class="notification-item">
              <div class="notification-dot"></div>
              <div class="notification-content">
                <div class="notification-title">Nova mensagem de Ana</div>
                <div class="notification-text">"Vamos marcar aquela reunião amanhã às 10h?"</div>
              </div>
            </div>
            <div class="notification-item">
              <div class="notification-dot"></div>
              <div class="notification-content">
                <div class="notification-title">Pedro comentou seu post</div>
                <div class="notification-text">"Amei essa foto! Onde foi tirada?"</div>
              </div>
            </div>
            <div class="notification-item">
              <div class="notification-dot"></div>
              <div class="notification-content">
                <div class="notification-title">Convite para comunidade</div>
                <div class="notification-text">Você foi convidado para "Design Coletivo".</div>
              </div>
            </div>
            <div class="notification-footer">
              <span>Toque para fechar.</span>
              <a href="pages/notifications.html">Ver todas</a>
            </div>
        `;
        return bubble;
    };

    if (notificationIcon) {
        notificationIcon.addEventListener('click', (event) => {
            event.stopPropagation();
            if (notificationBubble) {
                closeNotificationBubble();
                return;
            }
            closeNotificationBubble();
            notificationBubble = createNotificationBubble();
            document.body.appendChild(notificationBubble);
            requestAnimationFrame(() => notificationBubble.classList.add('show'));
        });
    }

    document.addEventListener('click', (event) => {
        if (notificationBubble && !notificationBubble.contains(event.target) && event.target !== notificationIcon) {
            closeNotificationBubble();
        }
    });

    document.querySelectorAll('.nav-icon').forEach(icon => {
        const target = navTargets[icon.title];
        if (target) {
            icon.addEventListener('click', () => {
                window.location.href = target;
            });
        }
    });

    const avatarButton = document.querySelector('.nav-avatar');
    if (avatarButton) {
        avatarButton.addEventListener('click', () => {
            window.location.href = 'profile.html';
        });
    }

    const logoButton = document.querySelector('.nav-logo');
    if (logoButton) {
        logoButton.style.cursor = 'pointer';
        logoButton.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    const setTheme = theme => {
        document.body.classList.toggle('theme-light', theme === 'light');
        const icon = document.querySelector('.theme-toggle');
        if (icon) icon.textContent = theme === 'light' ? '🌙' : '☀️';
        localStorage.setItem('esprokurt-theme', theme);
    };

    const toggleTheme = () => {
        const current = document.body.classList.contains('theme-light') ? 'light' : 'dark';
        setTheme(current === 'dark' ? 'light' : 'dark');
    };

    const themeToggle = document.createElement('button');
    themeToggle.type = 'button';
    themeToggle.className = 'theme-toggle';
    themeToggle.setAttribute('aria-label', 'Alternar tema');
    document.querySelector('.nav-icons')?.appendChild(themeToggle);
    themeToggle.addEventListener('click', toggleTheme);

    const storedTheme = localStorage.getItem('esprokurt-theme');
    setTheme(storedTheme === 'light' ? 'light' : 'dark');

    // Post actions
    const actionBtns = document.querySelectorAll('.action-btn');
    actionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('liked');
            // Placeholder for like/share/comment actions
        });
    });

    // Stories interaction
    const storyItems = document.querySelectorAll('.story-item');
    storyItems.forEach(item => {
        item.addEventListener('click', function() {
            // Placeholder for story viewing
            alert('Story feature coming soon!');
        });
    });

    // Notification filters
    const filterBtns = document.querySelectorAll('.filter-btn');
    const notificationCards = document.querySelectorAll('.notification-card');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            notificationCards.forEach(card => {
                if (filter === 'all' || card.getAttribute('data-type') === filter) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // Responsive menu toggle (for mobile)
    const createMobileMenu = () => {
        if (window.innerWidth < 768) {
            const nav = document.querySelector('nav');
            const menuToggle = document.createElement('div');
            menuToggle.className = 'menu-toggle';
            menuToggle.innerHTML = '☰';
            menuToggle.style.cssText = `
                display: none;
                position: fixed;
                top: 10px;
                right: 10px;
                background: var(--surface);
                border: 1px solid var(--border);
                border-radius: 8px;
                padding: 8px;
                cursor: pointer;
                z-index: 101;
            `;
            nav.appendChild(menuToggle);

            const navIcons = document.querySelector('.nav-icons');
            navIcons.style.display = 'none';

            menuToggle.addEventListener('click', () => {
                navIcons.style.display = navIcons.style.display === 'none' ? 'flex' : 'none';
            });
        }
    };

    createMobileMenu();
    window.addEventListener('resize', createMobileMenu);

    // Loading animation
    const addLoadingAnimation = () => {
        const loader = document.createElement('div');
        loader.className = 'page-loader';
        loader.innerHTML = `
            <div class="loader-content">
                <div class="orbita-logo">E</div>
                <div class="loading-text">Carregando Esprokurt...</div>
            </div>
        `;
        document.body.appendChild(loader);

        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 500);
        }, 1500);
    };

    addLoadingAnimation();
});