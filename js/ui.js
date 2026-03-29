// ============================================================
// UI.JS — Toast thông báo & Tiện ích Modal
// ============================================================

// --- TOAST THÔNG BÁO ---
export function showNotification(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const icon = type === 'success'
        ? '<i class="fa-solid fa-circle-check text-green-400"></i>'
        : '<i class="fa-solid fa-bell text-amber-400"></i>';

    toast.className = `bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg flex items-center space-x-2 animate-bounce transition-opacity duration-300`;
    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- MỞ MODAL ---
export function openModal(modalType, state, { formatForInput, formatDateOnlyForInput, addDays }) {
    const modal = document.getElementById(`${modalType}-modal`);

    if (modalType === 'task') {
        // Populate danh sách mục tiêu vào dropdown
        document.getElementById('task-goal').innerHTML =
            `<option value="">-- Không gắn mục tiêu --</option>` +
            state.goals.map(g => `<option value="${g.id}">${g.title}</option>`).join('');

        document.getElementById('task-start').value = formatForInput(new Date());
        document.getElementById('task-end').value = formatForInput(new Date(Date.now() + 3600000));
    } else if (modalType === 'goal') {
        document.getElementById('goal-start').value = formatDateOnlyForInput(new Date());
        document.getElementById('goal-end').value = formatDateOnlyForInput(addDays(new Date(), 30));
    }

    modal.classList.remove('hidden');
    setTimeout(() => {
        document.getElementById(`${modalType}-modal-content`).classList.remove('scale-95');
    }, 10);
}

// --- ĐÓNG MODAL ---
export function closeModal(modalType) {
    const content = document.getElementById(`${modalType}-modal-content`);
    content.classList.add('scale-95');
    setTimeout(() => {
        document.getElementById(`${modalType}-modal`).classList.add('hidden');
    }, 200);
}
