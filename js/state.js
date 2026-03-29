// ============================================================
// STATE.JS — Dữ liệu & Quản lý trạng thái ứng dụng
// ============================================================

// --- HELPER FUNCTIONS ---
export const getTodayAt = (hours) => {
    const d = new Date();
    d.setHours(hours, 0, 0, 0);
    return d;
};

export const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};

export const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

export const formatForInput = (date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
};

export const formatDateOnlyForInput = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
};

// --- DEFAULT STATE ---
const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

export const defaultState = {
    activeTab: 'calendar',
    calendarView: 'week',
    currentDate: new Date(),
    dailySettings: { workStart: 8, workEnd: 17 },

    goals: [
        {
            id: 1,
            title: 'Hoàn thành khóa học Tiếng Anh',
            type: 'Monthly',
            color: 'blue',
            startDate: startOfMonth.toISOString(),
            endDate: endOfMonth.toISOString()
        },
        {
            id: 2,
            title: 'Đọc Sách Bồi Dưỡng Kỹ Năng',
            type: 'Monthly',
            color: 'green',
            startDate: startOfMonth.toISOString(),
            endDate: endOfMonth.toISOString()
        },
    ],

    tasks: [
        {
            id: 101,
            goalId: 1,
            title: 'Học từ vựng Unit 1',
            description: 'Học 20 từ mới trên Quizlet',
            startTime: getTodayAt(9),
            endTime: getTodayAt(10),
            status: 'Completed',
            notifiedOverdue: true
        },
        {
            id: 102,
            goalId: 2,
            title: 'Đọc',
            description: 'Đọc Đắc Nhân Tâm trang 10-30',
            startTime: getTodayAt(14),
            endTime: getTodayAt(15),
            status: 'Pending',
            notifiedOverdue: false
        },
        {
            // Demo popup nhắc nhở — xoá dòng này khi deploy production
            id: 105,
            goalId: null,
            title: 'Task Sắp Hết Hạn',
            description: 'Để test popup thông báo',
            startTime: new Date(Date.now() - 60000),
            endTime: new Date(Date.now() + 5000),
            status: 'Pending',
            notifiedOverdue: false
        },
    ]
};

// --- STATE INSTANCE (singleton) ---
export let state = { ...defaultState };

// --- LOCAL STORAGE ---
const STORAGE_KEY = 'flexical_data_v3';

export function loadState() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            parsed.currentDate = new Date(parsed.currentDate);
            parsed.tasks.forEach(t => {
                t.startTime = new Date(t.startTime);
                t.endTime = new Date(t.endTime);
            });
            // Gán trực tiếp các thuộc tính vào state object đang được export
            Object.assign(state, parsed);
        } catch (e) {
            console.error('Lỗi load state:', e);
            Object.assign(state, defaultState);
        }
    }
}

export function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
