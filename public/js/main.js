// Main JavaScript file for client-side functionality

document.addEventListener('DOMContentLoaded', () => {
    // Mobile navbar functionality
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const closeMobileMenu = document.getElementById('closeMobileMenu');
    const mainNav = document.getElementById('mainNav');
    const navOverlay = document.getElementById('navOverlay');

    function openMobileMenu() {
        mainNav.classList.remove('-translate-x-full');
        navOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeMobileMenuFunc() {
        mainNav.classList.add('-translate-x-full');
        navOverlay.classList.add('hidden');
        document.body.style.overflow = '';
    }

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', openMobileMenu);
    }

    if (closeMobileMenu) {
        closeMobileMenu.addEventListener('click', closeMobileMenuFunc);
    }

    if (navOverlay) {
        navOverlay.addEventListener('click', closeMobileMenuFunc);
    }

    // Close menu when clicking on nav links (mobile)
    const navLinks = mainNav.querySelectorAll('a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 1024) {
                closeMobileMenuFunc();
            }
        });
    });

    // Flash message handling
    const flashMessages = document.querySelectorAll('.flash-message');
    flashMessages.forEach(message => {
        setTimeout(() => {
            message.classList.add('fade-out');
            setTimeout(() => message.remove(), 300);
        }, 5000);
    });

    // Form validation
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            const requiredFields = form.querySelectorAll('[required]');
            requiredFields.forEach(field => {
                if (!field.value) {
                    e.preventDefault();
                    field.classList.add('border-red-500');
                } else {
                    field.classList.remove('border-red-500');
                }
            });
        });
    });

    // Status updates
    const statusButtons = document.querySelectorAll('.status-update-btn');
    statusButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            const deliveryId = button.dataset.deliveryId;
            const newStatus = button.dataset.status;
            
            try {
                const response = await fetch(`/api/deliveries/${deliveryId}/status`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ status: newStatus }),
                });

                if (response.ok) {
                    window.location.reload();
                }
            } catch (error) {
                console.error('Error updating status:', error);
            }
        });
    });
});