// DOM Elements
const elements = {
    authSection: document.getElementById('auth-section'),
    dashboardSection: document.getElementById('dashboard-section'),
    
    // Tabs
    tabLogin: document.getElementById('tab-login'),
    tabRegister: document.getElementById('tab-register'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    
    // Auth inputs
    loginEmail: document.getElementById('login-email'),
    loginPass: document.getElementById('login-password'),
    regName: document.getElementById('reg-name'),
    regEmail: document.getElementById('reg-email'),
    regPass: document.getElementById('reg-password'),
    
    // Dashboard
    userEmailDisplay: document.getElementById('user-email-display'),
    logoutBtn: document.getElementById('logout-btn'),
    mainBalance: document.getElementById('main-balance'),
    mainAccountId: document.getElementById('main-account-id'),
    txList: document.getElementById('transaction-list'),
    refreshBtn: document.getElementById('refresh-btn'),
    
    // Transaction Form
    txForm: document.getElementById('transaction-form'),
    txType: document.getElementById('tx-type'),
    txAmount: document.getElementById('tx-amount'),
    txDest: document.getElementById('tx-destination'),
    txDesc: document.getElementById('tx-desc'),
    txDestGroup: document.getElementById('tx-destination-group'),
    
    // Modal
    modal: document.getElementById('approval-modal'),
    modalType: document.getElementById('modal-tx-type'),
    modalAmount: document.getElementById('modal-tx-amount'),
    modalCancel: document.getElementById('modal-cancel'),
    modalApprove: document.getElementById('modal-approve'),
    
    toastContainer: document.getElementById('toast-container')
};

// State
let state = {
    token: localStorage.getItem('nexus_token'),
    user: null,
    account: null,
    pendingTxId: null
};

// --- Initialization ---
function init() {
    setupEventListeners();
    
    if (state.token) {
        fetchUserData();
    } else {
        showAuth();
    }
}

// --- UI Navigation ---
function showAuth() {
    elements.authSection.classList.remove('hidden');
    elements.dashboardSection.classList.add('hidden');
}

function showDashboard() {
    elements.authSection.classList.add('hidden');
    elements.dashboardSection.classList.remove('hidden');
    elements.userEmailDisplay.textContent = state.user.email;
    elements.mainAccountId.textContent = state.account.id;
    refreshLedger();
}

// --- Event Listeners ---
function setupEventListeners() {
    // Auth Tabs
    elements.tabLogin.addEventListener('click', () => {
        elements.tabLogin.classList.add('active');
        elements.tabRegister.classList.remove('active');
        elements.loginForm.classList.remove('hidden');
        elements.registerForm.classList.add('hidden');
    });

    elements.tabRegister.addEventListener('click', () => {
        elements.tabRegister.classList.add('active');
        elements.tabLogin.classList.remove('active');
        elements.registerForm.classList.remove('hidden');
        elements.loginForm.classList.add('hidden');
    });

    // Auth Submit
    elements.loginForm.addEventListener('submit', handleLogin);
    elements.registerForm.addEventListener('submit', handleRegister);
    elements.logoutBtn.addEventListener('click', handleLogout);

    // Transaction Logic
    elements.txType.addEventListener('change', (e) => {
        if (e.target.value === 'TRANSFER') {
            elements.txDestGroup.classList.remove('hidden');
            elements.txDest.required = true;
        } else {
            elements.txDestGroup.classList.add('hidden');
            elements.txDest.required = false;
        }
    });

    elements.txForm.addEventListener('submit', handleTransactionInitiate);
    elements.refreshBtn.addEventListener('click', refreshLedger);

    // Modal
    elements.modalCancel.addEventListener('click', () => {
        elements.modal.classList.add('hidden');
        state.pendingTxId = null;
    });
    
    elements.modalApprove.addEventListener('click', handleTransactionComplete);
}

// --- API Calls ---
async function apiCall(endpoint, method = 'GET', body = null, headers = {}) {
    const config = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    };

    if (state.token) {
        config.headers['Authorization'] = `Bearer ${state.token}`;
    }

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(endpoint, config);
        const data = await response.json();
        
        if (!response.ok) {
            if (response.status === 401) {
                handleLogout(); // Session expired or blacklisted
            }
            throw new Error(data.message || 'API Request Failed');
        }
        return data;
    } catch (error) {
        showToast(error.message, 'error');
        throw error;
    }
}

// --- Auth Functions ---
async function handleLogin(e) {
    e.preventDefault();
    try {
        const data = await apiCall('/auth/login', 'POST', {
            email: elements.loginEmail.value,
            password: elements.loginPass.value
        });
        
        state.token = data.token;
        localStorage.setItem('nexus_token', data.token);
        fetchUserData();
        showToast('Authentication successful', 'success');
    } catch (err) {
        showToast(err.message || 'Login failed', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    try {
        const data = await apiCall('/auth/register', 'POST', {
            accountName: elements.regName.value,
            email: elements.regEmail.value,
            password: elements.regPass.value
        });
        
        state.token = data.token;
        localStorage.setItem('nexus_token', data.token);
        fetchUserData();
        showToast('Account initialized successfully', 'success');
    } catch (err) {
        showToast(err.message || 'Registration failed', 'error');
    }
}

async function handleLogout() {
    try {
        if (state.token) {
            await apiCall('/auth/logout', 'POST');
        }
    } catch (err) {}
    
    state.token = null;
    state.user = null;
    state.account = null;
    localStorage.removeItem('nexus_token');
    showAuth();
}

async function fetchUserData() {
    try {
        const data = await apiCall('/auth/me');
        state.user = data.user;
        state.account = data.account;
        showDashboard();
    } catch (err) {
        // Handled by apiCall (logs out on 401)
    }
}

// --- Ledger Functions ---
async function refreshLedger() {
    try {
        // Fetch Balance
        const balData = await apiCall(`/accounts/${state.account.id}/balance`);
        elements.mainBalance.textContent = `$${balData.balance.toFixed(2)}`;
        
        // Fetch Transactions
        const txData = await apiCall(`/transactions/${state.account.id}`);
        renderTransactions(txData.transactions);
    } catch (err) {}
}

function renderTransactions(transactions) {
    elements.txList.innerHTML = '';
    
    if (transactions.length === 0) {
        elements.txList.innerHTML = '<div class="empty-state">No transactions found in ledger.</div>';
        return;
    }

    transactions.forEach(tx => {
        const isCredit = tx.entryType === 'CREDIT';
        const sign = isCredit ? '+' : '-';
        const colorClass = isCredit ? 'credit' : 'debit';
        
        // Define badge color based on tx.status
        let badgeClass = 'badge-completed';
        if (tx.status === 'PENDING') badgeClass = 'badge-pending';
        if (tx.status === 'FAILED') badgeClass = 'badge-failed';

        const el = document.createElement('div');
        el.className = 'tx-item';
        el.innerHTML = `
            <div class="tx-info">
                <span class="tx-title">${tx.type} ${tx.description ? `(${tx.description})` : ''}</span>
                <span class="tx-date">${new Date(tx.date).toLocaleString()}</span>
                <span class="badge ${badgeClass}">${tx.status}</span>
            </div>
            <div class="tx-amount-group">
                <span class="tx-amount ${colorClass}">${sign}$${tx.amount.toFixed(2)}</span>
            </div>
        `;
        elements.txList.appendChild(el);
    });
}

// --- Transaction Flow ---
async function handleTransactionInitiate(e) {
    e.preventDefault();
    
    const payload = {
        type: elements.txType.value,
        amount: parseFloat(elements.txAmount.value),
        accountId: state.account.id,
        description: elements.txDesc.value
    };

    if (payload.type === 'TRANSFER') {
        payload.toAccountId = elements.txDest.value;
    }

    // Generate idempotency key for safe retries
    const idempotencyKey = crypto.randomUUID();

    try {
        const data = await apiCall('/transactions', 'POST', payload, {
            'Idempotency-Key': idempotencyKey
        });
        
        // Show Approval Modal
        state.pendingTxId = data.transaction._id;
        elements.modalType.textContent = payload.type;
        elements.modalAmount.textContent = `$${payload.amount.toFixed(2)}`;
        elements.modal.classList.remove('hidden');
        
        elements.txForm.reset();
        elements.txType.dispatchEvent(new Event('change'));
        
    } catch (err) {}
}

async function handleTransactionComplete() {
    if (!state.pendingTxId) return;
    
    const originalText = elements.modalApprove.textContent;
    elements.modalApprove.textContent = 'Processing...';
    elements.modalApprove.disabled = true;

    try {
        await apiCall(`/transactions/${state.pendingTxId}/complete`, 'POST');
        showToast('Transaction fully authorized and recorded', 'success');
        elements.modal.classList.add('hidden');
        state.pendingTxId = null;
        refreshLedger();
    } catch (err) {
        elements.modal.classList.add('hidden');
    } finally {
        elements.modalApprove.textContent = originalText;
        elements.modalApprove.disabled = false;
    }
}

// --- Utilities ---
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Boot up
document.addEventListener('DOMContentLoaded', init);
