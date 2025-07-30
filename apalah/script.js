document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMEN DOM ---
    const currentTimeEl = document.getElementById('current-time');
    const expenseForm = document.getElementById('expense-form');
    const descriptionInput = document.getElementById('description');
    const priceInput = document.getElementById('price');
    const expenseListEl = document.getElementById('expense-list');
    const monthFilterEl = document.getElementById('month-filter');
    const monthlyTotalEl = document.getElementById('monthly-total');

    // --- ELEMEN DOM BARU UNTUK TANGGAL CUSTOM ---
    const customDateCheckbox = document.getElementById('cd');
    const dateTimeContainer = document.getElementById('date-time-container');
    const dateInput = document.getElementById('date');
    const timeInput = document.getElementById('time');

    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

    // --- FUNGSI-FUNGSI ---

    function updateTime() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
        currentTimeEl.textContent = now.toLocaleDateString('id-ID', options);
    }

    function saveExpenses() {
        localStorage.setItem('expenses', JSON.stringify(expenses));
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    }
    
    function renderExpenses(filteredExpenses) {
        expenseListEl.innerHTML = '';
        const expensesToRender = filteredExpenses || expenses;
        if (expensesToRender.length === 0) {
            expenseListEl.innerHTML = '<li>Tumben hemat</li>';
            return;
        }
        
        // Urutkan pengeluaran dari yang terbaru ke terlama sebelum ditampilkan
        expensesToRender.sort((a, b) => new Date(b.date) - new Date(a.date));

        expensesToRender.forEach(expense => {
            const item = document.createElement('li');
            item.className = 'expense-item';
            const expenseDate = new Date(expense.date);
            const formattedDateTime = expenseDate.toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            item.innerHTML = `
                <div class="info">
                    <span class="description">${expense.description}</span>
                    <span class="date">${formattedDateTime}</span>
                </div>
                <span class="price">${formatCurrency(expense.price)}</span>
                <button class="delete-btn" data-id="${expense.id}">Hapus</button>
            `;
            expenseListEl.appendChild(item);
        });
    }

    function updateSummary() {
        const uniqueMonths = [...new Set(expenses.map(exp => new Date(exp.date).toISOString().slice(0, 7)))];
        monthFilterEl.innerHTML = '<option value="all">Semua Bulan</option>';
        uniqueMonths.sort().reverse().forEach(monthStr => {
            const date = new Date(monthStr + '-02');
            const option = document.createElement('option');
            option.value = monthStr;
            option.textContent = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
            monthFilterEl.appendChild(option);
        });
        calculateMonthlyTotal();
    }

    function calculateMonthlyTotal() {
        const selectedMonth = monthFilterEl.value;
        let filtered = expenses;
        if (selectedMonth !== 'all') {
            filtered = expenses.filter(exp => exp.date.startsWith(selectedMonth));
        }
        const total = filtered.reduce((sum, exp) => sum + exp.price, 0);
        monthlyTotalEl.textContent = formatCurrency(total);
        renderExpenses(filtered);
    }
    
    // --- FUNGSI BARU: Mengatur nilai default untuk input tanggal & waktu ---
    function setDefaultDateTime() {
        const now = new Date();
        // Format YYYY-MM-DD
        const date = now.toISOString().substring(0, 10);
        // Format HH:MM
        const time = now.toTimeString().substring(0, 5);
        dateInput.value = date;
        timeInput.value = time;
    }

    // --- EVENT LISTENERS ---

    // Event listener untuk checkbox tanggal custom
    customDateCheckbox.addEventListener('change', () => {
        const isChecked = customDateCheckbox.checked;
        dateTimeContainer.style.display = isChecked ? 'block' : 'none';
        dateInput.required = isChecked;
        timeInput.required = isChecked;
    });

    // Event listener untuk form submit (diperbarui)
    expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const description = descriptionInput.value.trim();
        const priceString = priceInput.value.replace(/\D/g, '');
        const price = parseFloat(priceString);

        if (description === '' || isNaN(price) || price <= 0) {
            alert('Mohon isi deskripsi dan harga dengan benar.');
            return;
        }

        let expenseDate;
        if (customDateCheckbox.checked) {
            // Jika checkbox dicentang, gabungkan tanggal dan waktu dari input
            if (!dateInput.value || !timeInput.value) {
                alert('Mohon isi tanggal dan waktu custom.');
                return;
            }
            expenseDate = new Date(`${dateInput.value}T${timeInput.value}`);
        } else {
            // Jika tidak, gunakan waktu saat ini
            expenseDate = new Date();
        }

        const newExpense = {
            id: Date.now(),
            description: description,
            price: price,
            date: expenseDate.toISOString()
        };

        expenses.push(newExpense);
        saveExpenses();
        updateSummary();
        
        expenseForm.reset();
        descriptionInput.focus();
        // Sembunyikan lagi container tanggal setelah reset
        dateTimeContainer.style.display = 'none';
        setDefaultDateTime(); // Setel ulang tanggal default untuk inputan berikutnya
    });
    
    priceInput.addEventListener('input', (e) => {
        let value = e.target.value;
        let numberString = value.replace(/\D/g, '');
        if (numberString) {
            const formatted = new Intl.NumberFormat('id-ID').format(Number(numberString));
            e.target.value = formatted;
        } else {
            e.target.value = '';
        }
    });

    expenseListEl.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = parseInt(e.target.dataset.id);
            if (confirm('Yakin hapus?')) {
                expenses = expenses.filter(exp => exp.id !== id);
                saveExpenses();
                updateSummary();
            }
        }
    });
    
    monthFilterEl.addEventListener('change', calculateMonthlyTotal);

    // --- INISIALISASI ---
    setInterval(updateTime, 1000);
    updateTime();
    setDefaultDateTime(); // Panggil saat pertama kali load
    updateSummary();

});