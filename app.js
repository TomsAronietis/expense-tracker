/* global window, document, supabase */

const statusEl = document.getElementById('status');
const totalEl = document.getElementById('total');
const expenseListEl = document.getElementById('expense-list');
const form = document.getElementById('expense-form');

const today = new Date().toISOString().slice(0, 10);
document.getElementById('spent_on').value = today;

const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.APP_CONFIG || {};

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes('YOUR_PROJECT_REF')) {
  setStatus('Update config.js with your Supabase URL and anon key.', true);
}

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = {
    title: String(formData.get('title')).trim(),
    amount: Number(formData.get('amount')),
    spent_on: String(formData.get('spent_on'))
  };

  if (!payload.title || Number.isNaN(payload.amount) || payload.amount <= 0 || !payload.spent_on) {
    setStatus('Please provide valid description, amount, and date.', true);
    return;
  }

  setStatus('Saving expense...');
  const { error } = await client.from('expenses').insert(payload);
  if (error) {
    setStatus(`Could not save expense: ${error.message}`, true);
    return;
  }

  form.reset();
  document.getElementById('spent_on').value = today;
  setStatus('Expense added.');
  await loadExpenses();
});

async function loadExpenses() {
  setStatus('Loading expenses...');
  const { data, error } = await client
    .from('expenses')
    .select('id, title, amount, spent_on, created_at')
    .order('spent_on', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    setStatus(`Failed to load expenses: ${error.message}`, true);
    return;
  }

  renderList(data || []);
  setStatus(data.length ? 'Loaded expenses.' : 'No expenses yet. Add your first item.');
}

function renderList(rows) {
  expenseListEl.innerHTML = '';

  const total = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  totalEl.textContent = `Total: $${total.toFixed(2)}`;

  for (const row of rows) {
    const item = document.createElement('li');
    item.className = 'expense-item';

    const meta = document.createElement('div');
    meta.className = 'expense-meta';
    const title = document.createElement('span');
    title.className = 'expense-title';
    title.textContent = row.title;
    const date = document.createElement('span');
    date.className = 'expense-date';
    date.textContent = new Date(row.spent_on).toLocaleDateString();

    meta.append(title, date);

    const actions = document.createElement('div');
    actions.className = 'expense-actions';

    const amount = document.createElement('strong');
    amount.textContent = `$${Number(row.amount).toFixed(2)}`;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', async () => {
      const confirmed = window.confirm(`Delete expense "${row.title}"?`);
      if (!confirmed) return;

      setStatus('Deleting expense...');
      const { error } = await client.from('expenses').delete().eq('id', row.id);
      if (error) {
        setStatus(`Could not delete expense: ${error.message}`, true);
        return;
      }

      setStatus('Expense deleted.');
      await loadExpenses();
    });

    actions.append(amount, deleteBtn);
    item.append(meta, actions);
    expenseListEl.append(item);
  }
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? '#b91c1c' : '#4b5563';
}

void loadExpenses();
