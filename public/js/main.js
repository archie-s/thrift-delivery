// Main JavaScript file for client-side functionality

document.addEventListener('DOMContentLoaded', () => {
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

    // Simple modal open/close handlers
    const openButtons = document.querySelectorAll('[data-open-modal]');
    const closeButtons = document.querySelectorAll('[data-close-modal]');

    function toggleModal(modal, show) {
        if (!modal) return;
        if (show) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        } else {
            modal.classList.remove('flex');
            modal.classList.add('hidden');
        }
    }

    openButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const selector = btn.getAttribute('data-open-modal');
            const modal = document.querySelector(selector);
            toggleModal(modal, true);
        });
    });

    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const selector = btn.getAttribute('data-close-modal');
            const modal = document.querySelector(selector);
            toggleModal(modal, false);
        });
    });
});