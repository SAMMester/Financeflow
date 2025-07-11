let transactions = [];
let filteredTransactions = [];
let categoryChart = null;
let trendChart = null;

// Initialize charts
function initCharts() {
const categoryCtx = document.getElementById('categoryChart').getContext('2d');
const trendCtx = document.getElementById('trendChart').getContext('2d');

categoryChart = new Chart(categoryCtx, {
    type: 'doughnut',
    data: {
        labels: [],
        datasets: [{
            data: [],
            backgroundColor: [
                '#667eea', '#764ba2', '#f093fb', '#f5576c',
                '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
                '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3'
            ],
            borderWidth: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom'
            }
        }
    }
});

trendChart = new Chart(trendCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Income',
            data: [],
            borderColor: '#48bb78',
            backgroundColor: 'rgba(72, 187, 120, 0.1)',
            tension: 0.4,
            fill: true
        }, {
            label: 'Expenses',
            data: [],
            borderColor: '#f56565',
            backgroundColor: 'rgba(245, 101, 101, 0.1)',
            tension: 0.4,
            fill: true
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return '$' + value.toLocaleString();
                    }
                }
            }
        }
    }
});
}

// Transaction form handler
document.getElementById('transactionForm').addEventListener('submit', function(e) {e.preventDefault();

const date = document.getElementById('transactionDate').value;
const amount = parseFloat(document.getElementById('transactionAmount').value);
const description = document.getElementById('transactionDescription').value.trim();
const category = document.getElementById('transactionCategory').value;

// Validation
if (!date || !description || isNaN(amount) || !category) {
    showError('Please fill in all required fields');
    return;
}

// Create new transaction
const newTransaction = {
    date: new Date(date),
    description: description,
    amount: amount,
    category: category,
    id: Date.now() // Simple ID for potential future use
};

// Add to transactions array
transactions.unshift(newTransaction); // Add to beginning for recent display
filteredTransactions = [...transactions];

// Update dashboard
updateDashboard();

// Show success message
showSuccess(`Transaction "${description}" added successfully!`);

// Clear form
clearForm();
});

// Clear form function
function clearForm() {
document.getElementById('transactionForm').reset();
document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0]; // Set to today
}

// Show success message
function showSuccess(message) {
const successDiv = document.getElementById('success');
successDiv.textContent = message;
successDiv.style.display = 'block';
setTimeout(() => {
    successDiv.style.display = 'none';
}, 3000);
}

// Show error message
function showError(message) {
const errorDiv = document.getElementById('error');
errorDiv.textContent = message;
errorDiv.style.display = 'block';
setTimeout(() => {
    errorDiv.style.display = 'none';
}, 3000);
}

// Update dashboard
function updateDashboard() {
updateStats();
updateCharts();
updateTransactionTable();
updateCategoryFilter();
}

// Update statistics
function updateStats() {
const income = filteredTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
const expenses = Math.abs(filteredTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
const balance = income - expenses;

document.getElementById('totalBalance').textContent = '$' + balance.toLocaleString('en-US', {minimumFractionDigits: 2});
document.getElementById('totalIncome').textContent = '$' + income.toLocaleString('en-US', {minimumFractionDigits: 2});
document.getElementById('totalExpenses').textContent = '$' + expenses.toLocaleString('en-US', {minimumFractionDigits: 2});
document.getElementById('transactionCount').textContent = filteredTransactions.length.toLocaleString();
}

// Update charts
function updateCharts() {
updateCategoryChart();
updateTrendChart();
}

// Update category chart
function updateCategoryChart() {
const expensesByCategory = {};
filteredTransactions
    .filter(t => t.amount < 0)
    .forEach(t => {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + Math.abs(t.amount);
    });

const labels = Object.keys(expensesByCategory);
const data = Object.values(expensesByCategory);

categoryChart.data.labels = labels;
categoryChart.data.datasets[0].data = data;
categoryChart.update();
}

// Update trend chart
function updateTrendChart() {
const monthlyData = {};

filteredTransactions.forEach(t => {
    const monthKey = t.date.getFullYear() + '-' + String(t.date.getMonth() + 1).padStart(2, '0');
    if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 };
    }
    
    if (t.amount > 0) {
        monthlyData[monthKey].income += t.amount;
    } else {
        monthlyData[monthKey].expenses += Math.abs(t.amount);
    }
});

const sortedMonths = Object.keys(monthlyData).sort();
const incomeData = sortedMonths.map(month => monthlyData[month].income);
const expenseData = sortedMonths.map(month => monthlyData[month].expenses);

trendChart.data.labels = sortedMonths;
trendChart.data.datasets[0].data = incomeData;
trendChart.data.datasets[1].data = expenseData;
trendChart.update();
}

// Update transaction table
function updateTransactionTable() {
const tbody = document.getElementById('transactionsBody');

if (filteredTransactions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #666; padding: 40px;">No transactions found</td></tr>';
    return;
}

tbody.innerHTML = filteredTransactions
    .sort((a, b) => b.date - a.date)
    .slice(0, 100) // Show only recent 100 transactions
    .map(t => `
        <tr>
            <td>${t.date.toLocaleDateString()}</td>
            <td>${t.description}</td>
            <td><span class="category-tag">${t.category}</span></td>
            <td class="${t.amount >= 0 ? 'amount-positive' : 'amount-negative'}">
                ${t.amount >= 0 ? '+' : ''}$${Math.abs(t.amount).toLocaleString('en-US', {minimumFractionDigits: 2})}
            </td>
        </tr>
    `).join('');
}

// Update category filter
function updateCategoryFilter() {
const categories = [...new Set(transactions.map(t => t.category))].sort();
const select = document.getElementById('categoryFilter');

select.innerHTML = '<option value="">All Categories</option>' + 
    categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

// Apply filters
function applyFilters() {
const searchTerm = document.getElementById('searchFilter').value.toLowerCase();
const categoryFilter = document.getElementById('categoryFilter').value;
const dateFrom = document.getElementById('dateFromFilter').value;
const dateTo = document.getElementById('dateToFilter').value;

filteredTransactions = transactions.filter(t => {
    const matchesSearch = !searchTerm || t.description.toLowerCase().includes(searchTerm);
    const matchesCategory = !categoryFilter || t.category === categoryFilter;
    const matchesDateFrom = !dateFrom || t.date >= new Date(dateFrom);
    const matchesDateTo = !dateTo || t.date <= new Date(dateTo);

    return matchesSearch && matchesCategory && matchesDateFrom && matchesDateTo;
});

updateDashboard();
}

// Clear filters
function clearFilters() {
document.getElementById('searchFilter').value = '';
document.getElementById('categoryFilter').value = '';
document.getElementById('dateFromFilter').value = '';
document.getElementById('dateToFilter').value = '';

filteredTransactions = [...transactions];
updateDashboard();
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
initCharts();
// Set today's date as default
document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];

// Add some sample transactions for demonstration
addSampleTransactions();
});

// Add sample transactions for demonstration
function addSampleTransactions() {
const sampleTransactions = [
    {
        date: new Date('2024-07-01'),
        description: 'Salary Deposit',
        amount: 3500.00,
        category: 'Income'
    },
    {
        date: new Date('2024-06-30'),
        description: 'Grocery Store',
        amount: -125.50,
        category: 'Food & Dining'
    },
    {
        date: new Date('2024-06-29'),
        description: 'Gas Station',
        amount: -45.00,
        category: 'Transportation'
    },
    {
        date: new Date('2024-06-28'),
        description: 'Netflix Subscription',
        amount: -15.99,
        category: 'Entertainment'
    },
    {
        date: new Date('2024-06-27'),
        description: 'Coffee Shop',
        amount: -8.75,
        category: 'Food & Dining'
    }
];

transactions = sampleTransactions;
filteredTransactions = [...transactions];
updateDashboard();
}

    // CSV Import functionality
document.getElementById('csvFile').addEventListener('change', function(e) {
const file = e.target.files[0];
if (!file) return;

if (!file.name.toLowerCase().endsWith('.csv')) {
  showError('Please select a CSV file');
  return;
}

const loading = document.getElementById('importLoading');
loading.style.display = 'block';

const reader = new FileReader();
reader.onload = function(e) {
  try {
      const csv = e.target.result;
      const importedTransactions = parseCSV(csv);
      
      if (importedTransactions.length > 0) {
          // Clear existing data and replace with imported transactions
          transactions = [...importedTransactions];
          filteredTransactions = [...transactions];
          
          updateDashboard();
          showSuccess(`Successfully imported ${importedTransactions.length} transactions! Previous data has been replaced.`);
      } else {
          showError('No valid transactions found in the CSV file');
      }
  } catch (error) {
      showError('Error reading CSV file: ' + error.message);
  } finally {
      loading.style.display = 'none';
      // Reset file input
      e.target.value = '';
  }
};

reader.onerror = function() {
  showError('Error reading file');
  loading.style.display = 'none';
};

reader.readAsText(file);
});

// Parse CSV function
function parseCSV(csvText) {
const lines = csvText.split('\n').filter(line => line.trim());
if (lines.length < 2) {
  throw new Error('CSV file must contain at least a header and one data row');
}

const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
const transactions = [];

// Expected headers (case insensitive)
const expectedHeaders = ['date', 'description', 'amount', 'category'];
const headerMap = {};

// Map CSV headers to expected fields
expectedHeaders.forEach(expected => {
  const foundIndex = headers.findIndex(h => 
      h.toLowerCase().includes(expected) || expected.includes(h.toLowerCase())
  );
  if (foundIndex !== -1) {
      headerMap[expected] = foundIndex;
  }
});

// Check if all required headers are present
const missingHeaders = expectedHeaders.filter(h => !(h in headerMap));
if (missingHeaders.length > 0) {
  throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
}

// Parse data rows
for (let i = 1; i < lines.length; i++) {
  const values = parseCSVLine(lines[i]);
  if (values.length < headers.length) continue; // Skip incomplete rows

  try {
      const transaction = {
          date: parseDate(values[headerMap.date]),
          description: values[headerMap.description].trim(),
          amount: parseFloat(values[headerMap.amount]),
          category: values[headerMap.category].trim(),
          id: Date.now() + i // Simple ID generation
      };

      // Validate transaction
      if (isValidTransaction(transaction)) {
          transactions.push(transaction);
      }
  } catch (error) {
      console.warn(`Skipping invalid row ${i + 1}: ${error.message}`);
  }
}

return transactions;
}

// Parse CSV line (handles quoted fields)
function parseCSVLine(line) {
const result = [];
let current = '';
let inQuotes = false;

for (let i = 0; i < line.length; i++) {
  const char = line[i];
  
  if (char === '"') {
      inQuotes = !inQuotes;
  } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
  } else {
      current += char;
  }
}

result.push(current.trim().replace(/^"|"$/g, ''));
return result;
}

// Parse date from various formats
function parseDate(dateString) {
const cleaned = dateString.trim();

// Try different date formats
const formats = [
  /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
  /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
  /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
  /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
];

let parsedDate;

if (formats[0].test(cleaned)) {
  parsedDate = new Date(cleaned);
} else if (formats[1].test(cleaned)) {
  const [month, day, year] = cleaned.split('/');
  parsedDate = new Date(year, month - 1, day);
} else if (formats[2].test(cleaned)) {
  const [month, day, year] = cleaned.split('-');
  parsedDate = new Date(year, month - 1, day);
} else if (formats[3].test(cleaned)) {
  parsedDate = new Date(cleaned.replace(/\//g, '-'));
} else {
  parsedDate = new Date(cleaned);
}

if (isNaN(parsedDate.getTime())) {
  throw new Error(`Invalid date format: ${dateString}`);
}

return parsedDate;
}

// Validate transaction
function isValidTransaction(transaction) {
return transaction.date instanceof Date && 
    !isNaN(transaction.date.getTime()) &&
    typeof transaction.description === 'string' && 
    transaction.description.length > 0 &&
    typeof transaction.amount === 'number' && 
    !isNaN(transaction.amount) &&
    typeof transaction.category === 'string' && 
    transaction.category.length > 0;
}

// CSV Export functionality
function exportToCSV() {
if (transactions.length === 0) {
  showError('No transactions to export');
  return;
}

const headers = ['Date', 'Description', 'Amount', 'Category'];
const csvContent = [
  headers.join(','),
  ...transactions.map(t => [
      t.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      `"${t.description.replace(/"/g, '""')}"`, // Escape quotes
      t.amount,
      `"${t.category.replace(/"/g, '""')}"` // Escape quotes
  ].join(','))
].join('\n');

downloadCSV(csvContent, 'financeflow_transactions.csv');
showSuccess(`Successfully exported ${transactions.length} transactions!`);
}

// Download CSV file
function downloadCSV(csvContent, filename) {
const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
const link = document.createElement('a');

if (link.download !== undefined) {
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
} else {
  // Fallback for browsers that don't support download attribute
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  URL.revokeObjectURL(url);
}
}        

// Authentication System for Finance Flow
// Add this to the beginning of your existing script.js file

class AuthSystem {
    constructor() {
        this.users = this.loadUsers();
        this.currentUser = this.getCurrentUser();
        this.init();
    }

    init() {
        // Create auth UI
        this.createAuthUI();
        
        // Check if user is already logged in
        if (this.currentUser) {
            this.showMainApp();
        } else {
            this.showAuthForm();
        }
    }

    createAuthUI() {
        // Create auth container
        const authContainer = document.createElement('div');
        authContainer.id = 'authContainer';
        authContainer.className = 'auth-container';
        authContainer.innerHTML = `
            <div class="auth-box">
                <!-- Login Form -->
                <div id="loginForm" class="auth-section">
                    <div class="auth-header">
                        <h2>💰 Finance Flow</h2>
                        <p>Welcome back! Please sign in to your account.</p>
                    </div>
                    <div class="auth-form">
                        <div id="loginMessage"></div>
                        <form id="loginFormElement">
                            <div class="auth-form-group">
                                <label for="loginEmail">Email Address</label>
                                <input type="email" id="loginEmail" required>
                            </div>
                            <div class="auth-form-group">
                                <label for="loginPassword">Password</label>
                                <input type="password" id="loginPassword" required>
                            </div>
                            <button type="submit" class="auth-btn">Sign In</button>
                        </form>
                        <div class="auth-toggle">
                            <p>Don't have an account? <a href="#" onclick="authSystem.showRegisterForm()">Create Account</a></p>
                        </div>
                    </div>
                </div>

                <!-- Register Form -->
                <div id="registerForm" class="auth-section hidden">
                    <div class="auth-header">
                        <h2>💰 Finance Flow</h2>
                        <p>Create your account to get started.</p>
                    </div>
                    <div class="auth-form">
                        <div id="registerMessage"></div>
                        <form id="registerFormElement">
                            <div class="auth-form-group">
                                <label for="registerName">Full Name</label>
                                <input type="text" id="registerName" required>
                            </div>
                            <div class="auth-form-group">
                                <label for="registerEmail">Email Address</label>
                                <input type="email" id="registerEmail" required>
                            </div>
                            <div class="auth-form-group">
                                <label for="registerPassword">Password</label>
                                <input type="password" id="registerPassword" required minlength="6">
                            </div>
                            <div class="auth-form-group">
                                <label for="confirmPassword">Confirm Password</label>
                                <input type="password" id="confirmPassword" required minlength="6">
                            </div>
                            <button type="submit" class="auth-btn">Create Account</button>
                        </form>
                        <div class="auth-toggle">
                            <p>Already have an account? <a href="#" onclick="authSystem.showLoginForm()">Sign In</a></p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add navigation bar
        const navBar = document.createElement('div');
        navBar.id = 'topNav';
        navBar.className = 'top-nav hidden';
        navBar.innerHTML = `
            <div class="nav-container">
                <div class="user-info">
                    <div class="user-avatar" id="userAvatar"></div>
                    <span id="welcomeMessage"></span>
                </div>
                <div>
                    <button class="logout-btn" onclick="authSystem.logout()">Logout</button>
                </div>
            </div>
        `;

        // Add users section
        const usersSection = document.createElement('div');
        usersSection.id = 'usersSection';
        usersSection.className = 'users-section hidden';
        usersSection.innerHTML = `
            <h2>👥 All Users</h2>
            <div class="users-grid" id="usersGrid"></div>
        `;

        // Insert into DOM
        document.body.insertBefore(authContainer, document.body.firstChild);
        document.body.insertBefore(navBar, document.querySelector('.container'));
        document.querySelector('.container').insertBefore(usersSection, document.querySelector('.header').nextSibling);

        // Add event listeners
        this.attachEventListeners();
    }

    attachEventListeners() {
        document.getElementById('loginFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        document.getElementById('registerFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.register();
        });
    }

    loadUsers() {
        const users = localStorage.getItem('financeFlowUsers');
        return users ? JSON.parse(users) : [];
    }

    saveUsers() {
        localStorage.setItem('financeFlowUsers', JSON.stringify(this.users));
    }

    getCurrentUser() {
        const user = localStorage.getItem('financeFlowCurrentUser');
        return user ? JSON.parse(user) : null;
    }

    setCurrentUser(user) {
        localStorage.setItem('financeFlowCurrentUser', JSON.stringify(user));
        this.currentUser = user;
    }

    getUserTransactions(userId) {
        const userTransactions = localStorage.getItem(`financeFlowTransactions_${userId}`);
        return userTransactions ? JSON.parse(userTransactions) : [];
    }

    saveUserTransactions(userId, transactions) {
        localStorage.setItem(`financeFlowTransactions_${userId}`, JSON.stringify(transactions));
    }

    register() {
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validation
        if (!name || !email || !password) {
            this.showMessage('registerMessage', 'Please fill in all fields!', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showMessage('registerMessage', 'Passwords do not match!', 'error');
            return;
        }

        if (password.length < 6) {
            this.showMessage('registerMessage', 'Password must be at least 6 characters long!', 'error');
            return;
        }

        // Check if user already exists
        const existingUser = this.users.find(user => user.email.toLowerCase() === email.toLowerCase());
        if (existingUser) {
            this.showMessage('registerMessage', 'User with this email already exists!', 'error');
            return;
        }

        // Create new user
        const newUser = {
            id: Date.now(),
            name: name,
            email: email,
            password: password, // In production, hash this!
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };

        this.users.push(newUser);
        this.saveUsers();
        this.showMessage('registerMessage', 'Account created successfully!', 'success');
        
        // Auto login
        setTimeout(() => {
            this.setCurrentUser(newUser);
            this.showMainApp();
        }, 1000);
    }

    login() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.showMessage('loginMessage', 'Please fill in all fields!', 'error');
            return;
        }

        const user = this.users.find(u => 
            u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );
        
        if (user) {
            // Update last login
            user.lastLogin = new Date().toISOString();
            this.saveUsers();
            
            this.setCurrentUser(user);
            this.showMainApp();
        } else {
            this.showMessage('loginMessage', 'Invalid email or password!', 'error');
        }
    }

    logout() {
        // Save current transactions before logging out
        if (this.currentUser && window.transactions) {
            this.saveUserTransactions(this.currentUser.id, window.transactions);
        }
        
        localStorage.removeItem('financeFlowCurrentUser');
        this.currentUser = null;
        this.showAuthForm();
    }

    showMessage(elementId, message, type) {
        const element = document.getElementById(elementId);
        element.innerHTML = `<div class="auth-${type}">${message}</div>`;
        setTimeout(() => {
            element.innerHTML = '';
        }, 3000);
    }

    showLoginForm() {
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('registerForm').classList.add('hidden');
    }

    showRegisterForm() {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('registerForm').classList.remove('hidden');
    }

    showAuthForm() {
        document.getElementById('authContainer').classList.remove('hidden');
        document.getElementById('topNav').classList.add('hidden');
        document.getElementById('usersSection').classList.add('hidden');
        document.querySelector('.container').style.display = 'none';
    }

    showMainApp() {
        document.getElementById('authContainer').classList.add('hidden');
        document.getElementById('topNav').classList.remove('hidden');
        document.getElementById('usersSection').classList.remove('hidden');
        document.querySelector('.container').style.display = 'block';
        
        // Update navigation
        this.updateNavigation();
        
        // Load user's transactions
        this.loadUserTransactions();
        
        // Update users display
        this.updateUsersDisplay();
    }

    updateNavigation() {
        const userAvatar = document.getElementById('userAvatar');
        const welcomeMessage = document.getElementById('welcomeMessage');
        
        if (this.currentUser) {
            userAvatar.textContent = this.currentUser.name.charAt(0).toUpperCase();
            welcomeMessage.textContent = `Welcome, ${this.currentUser.name}!`;
        }
    }

    loadUserTransactions() {
        if (this.currentUser) {
            const userTransactions = this.getUserTransactions(this.currentUser.id);
            
            // Convert date strings back to Date objects
            const processedTransactions = userTransactions.map(t => ({
                ...t,
                date: new Date(t.date)
            }));
            
            // Set global transactions variable
            window.transactions = processedTransactions;
            window.filteredTransactions = [...processedTransactions];
            
            // Update dashboard if functions are available
            if (typeof updateDashboard === 'function') {
                updateDashboard();
            }
        }
    }

    updateUsersDisplay() {
        const usersGrid = document.getElementById('usersGrid');
        usersGrid.innerHTML = '';
        
        this.users.forEach(user => {
            const userTransactions = this.getUserTransactions(user.id);
            const totalTransactions = userTransactions.length;
            const totalIncome = userTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
            const totalExpenses = Math.abs(userTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
            
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            userCard.innerHTML = `
                <h3>${user.name}</h3>
                <p>📧 ${user.email}</p>
                <p>📅 Joined: ${new Date(user.createdAt).toLocaleDateString()}</p>
                <div class="user-stats">
                    <span>💳 ${totalTransactions} transactions</span>
                    <span>💰 $${(totalIncome - totalExpenses).toFixed(2)}</span>
                </div>
            `;
            usersGrid.appendChild(userCard);
        });
    }

    // Method to save current transactions (call this when transactions are modified)
    saveCurrentTransactions() {
        if (this.currentUser && window.transactions) {
            this.saveUserTransactions(this.currentUser.id, window.transactions);
        }
    }
}

// Initialize auth system
let authSystem;

// Modify your existing DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    // Initialize auth system first
    authSystem = new AuthSystem();
    
    // Only initialize charts and other functionality if user is logged in
    if (authSystem.currentUser) {
        initCharts();
        // Set today's date as default
        document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
    }
});

// Override the existing transaction form handler to save transactions per user
document.addEventListener('DOMContentLoaded', function() {
    // Wait for auth system to be ready
    setTimeout(() => {
        const transactionForm = document.getElementById('transactionForm');
        if (transactionForm) {
            // Remove existing event listener and add new one
            transactionForm.removeEventListener('submit', arguments.callee);
            
            transactionForm.addEventListener('submit', function(e) {
                e.preventDefault();

                const date = document.getElementById('transactionDate').value;
                const amount = parseFloat(document.getElementById('transactionAmount').value);
                const description = document.getElementById('transactionDescription').value.trim();
                const category = document.getElementById('transactionCategory').value;

                // Validation
                if (!date || !description || isNaN(amount) || !category) {
                    showError('Please fill in all required fields');
                    return;
                }

                // Create new transaction
                const newTransaction = {
                    date: new Date(date),
                    description: description,
                    amount: amount,
                    category: category,
                    id: Date.now(),
                    userId: authSystem.currentUser.id // Add user ID
                };

                // Add to transactions array
                if (!window.transactions) window.transactions = [];
                window.transactions.unshift(newTransaction);
                window.filteredTransactions = [...window.transactions];

                // Save to user's storage
                authSystem.saveCurrentTransactions();

                // Update dashboard
                updateDashboard();

                // Show success message
                showSuccess(`Transaction "${description}" added successfully!`);

                // Clear form
                clearForm();
            });
        }
    }, 500);
});

// Override CSV import to save to user's storage
function parseCSV(csvText) {
    // Your existing parseCSV function code here
    // ... (keep all the existing logic)
    
    // At the end, after parsing transactions, add user ID to each transaction
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
        throw new Error('CSV file must contain at least a header and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const transactions = [];

    // Expected headers (case insensitive)
    const expectedHeaders = ['date', 'description', 'amount', 'category'];
    const headerMap = {};

    // Map CSV headers to expected fields
    expectedHeaders.forEach(expected => {
        const foundIndex = headers.findIndex(h => 
            h.toLowerCase().includes(expected) || expected.includes(h.toLowerCase())
        );
        if (foundIndex !== -1) {
            headerMap[expected] = foundIndex;
        }
    });

    // Check if all required headers are present
    const missingHeaders = expectedHeaders.filter(h => !(h in headerMap));
    if (missingHeaders.length > 0) {
        throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length < headers.length) continue;

        try {
            const transaction = {
                date: parseDate(values[headerMap.date]),
                description: values[headerMap.description].trim(),
                amount: parseFloat(values[headerMap.amount]),
                category: values[headerMap.category].trim(),
                id: Date.now() + i,
                userId: authSystem.currentUser.id // Add user ID
            };

            if (isValidTransaction(transaction)) {
                transactions.push(transaction);
            }
        } catch (error) {
            console.warn(`Skipping invalid row ${i + 1}: ${error.message}`);
        }
    }

    return transactions;
}

// Override the CSV import event listener to save to user's storage
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const csvFileInput = document.getElementById('csvFile');
        if (csvFileInput) {
            csvFileInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (!file) return;

                if (!file.name.toLowerCase().endsWith('.csv')) {
                    showError('Please select a CSV file');
                    return;
                }

                const loading = document.getElementById('importLoading');
                loading.style.display = 'block';

                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const csv = e.target.result;
                        const importedTransactions = parseCSV(csv);
                        
                        if (importedTransactions.length > 0) {
                            window.transactions = [...importedTransactions];
                            window.filteredTransactions = [...window.transactions];
                            
                            // Save to user's storage
                            authSystem.saveCurrentTransactions();
                            
                            updateDashboard();
                            showSuccess(`Successfully imported ${importedTransactions.length} transactions!`);
                        } else {
                            showError('No valid transactions found in the CSV file');
                        }
                    } catch (error) {
                        showError('Error reading CSV file: ' + error.message);
                    } finally {
                        loading.style.display = 'none';
                        e.target.value = '';
                    }
                };

                reader.onerror = function() {
                    showError('Error reading file');
                    loading.style.display = 'none';
                };

                reader.readAsText(file);
            });
        }
    }, 500);
});