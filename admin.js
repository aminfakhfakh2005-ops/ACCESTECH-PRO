const SUPABASE_URL = 'https://yxhcpyridgyuexzierwn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2h2I-n85SCu4MtQzZCXxIw_1U8mzZeQ';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = id => document.getElementById(id);

let orders = [];
let products = [];

async function boot() {
  const { data: { session } } = await db.auth.getSession();

  if (session) {
    showApp(session);
  } else {
    $('loginView').hidden = false;
  }
}

function showApp(session) {
  $('loginView').hidden = true;
  $('app').hidden = false;
  $('userEmail').textContent = session.user.email || '';
  loadAll();
}

$('loginForm').onsubmit = async (e) => {
  e.preventDefault();

  const email = $('email').value.trim();
  const password = $('password').value;

  $('loginMsg').textContent = 'Connexion…';

  console.log('LOGIN START');
  console.log('Email:', email);

  try {
    const { data, error } = await db.auth.signInWithPassword({
      email: email,
      password: password
    });

    console.log('LOGIN RESULT:', data);
    console.log('LOGIN ERROR:', error);

    if (error) {
      $('loginMsg').textContent = 'Erreur : ' + error.message;
      return;
    }

    if (data.session) {
      showApp(data.session);
    } else {
      $('loginMsg').textContent = 'Connexion sans session.';
    }

  } catch (err) {
    console.error('LOGIN EXCEPTION:', err);
    $('loginMsg').textContent = 'Erreur : ' + err.message;
  }
};
  e.preventDefault();

  $('loginMsg').textContent = 'Connexion…';
  console.log('Tentative de connexion...');
  console.log('Email:', $('email').value);

  const { data, error } = await db.auth.signInWithPassword({
    email: $('email').value.trim(),
    password: $('password').value
  });

  console.log('Auth result:', data);
  console.log('Auth error:', error);

  if (error) {
    $('loginMsg').textContent =
      'Erreur: ' + error.message;
    return;
  }

  $('loginMsg').textContent = 'Connexion réussie ✓';

  showApp(data.session);
};

  const { data, error } = await db.auth.signInWithPassword({
    email: $('email').value,
    password: $('password').value
  });

  if (error) {
    $('loginMsg').textContent = 'Email ou mot de passe incorrect.';
    return;
  }

  showApp(data.session);
};

$('logout').onclick = async () => {
  await db.auth.signOut();
  location.reload();
};

async function loadAll() {
  await Promise.all([
    loadOrders(),
    loadProducts()
  ]);

  renderDashboard();
}

async function loadOrders() {
  const { data, error } = await db
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Orders error:', error);
    orders = [];
  } else {
    orders = data || [];
  }

  renderOrders();
}

async function loadProducts() {
  const { data, error } = await db
    .from('products')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Products error:', error);
    products = [];
  } else {
    products = data || [];
  }

  renderProducts();
}

function money(v) {
  return `${Number(v || 0).toFixed(2)} TND`;
}

function renderDashboard() {
  $('statOrders').textContent = orders.length;

  $('statPending').textContent =
    orders.filter(x => x.status === 'pending').length;

  $('statRevenue').textContent =
    money(
      orders.reduce(
        (s, x) => s + Number(x.total || 0),
        0
      )
    );

  $('statProducts').textContent =
    products.filter(x => x.active !== false).length;

  $('recentOrders').innerHTML =
    orders.slice(0, 6).map(orderRow).join('') ||
    '<div class="empty">Aucune commande.</div>';
}

function orderRow(o) {
  const date = o.created_at
    ? new Date(o.created_at).toLocaleString('fr-FR')
    : '';

  const prods = Array.isArray(o.products)
    ? o.products
        .map(p => `${p.name} × ${p.quantity}`)
        .join(', ')
    : '';

  return `
    <div class="recent">
      <b>${escapeHtml(o.customer_name || 'Client')}</b>
      <span>
        ${escapeHtml(o.phone || '')} · ${money(o.total)}
      </span>
      <small>
        ${escapeHtml(prods)} · ${escapeHtml(date)}
      </small>
    </div>
  `;
}

function renderOrders() {
  const q = ($('orderSearch')?.value || '').toLowerCase();

  const filtered = orders.filter(o =>
    `${o.customer_name || ''} ${o.phone || ''}`
      .toLowerCase()
      .includes(q)
  );

  $('ordersBody').innerHTML =
    filtered.map(o => {

      const prods = Array.isArray(o.products)
        ? o.products
            .map(
              p =>
                `${escapeHtml(p.name)} × ${p.quantity}`
            )
            .join('<br>')
        : '';

      return `
        <tr>
          <td>
            ${
              o.created_at
                ? new Date(o.created_at)
                    .toLocaleString('fr-FR')
                : ''
            }
          </td>

          <td>
            <b>${escapeHtml(o.customer_name || '')}</b>
            <br>
            <small>${escapeHtml(o.address || '')}</small>
          </td>

          <td>
            ${escapeHtml(o.phone || '')}
          </td>

          <td>
            ${prods}
          </td>

          <td>
            ${money(o.total)}
          </td>

          <td>
            <select
              class="status"
              data-order="${o.id}"
            >
              <option value="pending"
                ${o.status === 'pending' ? 'selected' : ''}>
                Nouveau
              </option>

              <option value="processing"
                ${o.status === 'processing' ? 'selected' : ''}>
                En traitement
              </option>

              <option value="shipped"
                ${o.status === 'shipped' ? 'selected' : ''}>
                Expédiée
              </option>

              <option value="completed"
                ${o.status === 'completed' ? 'selected' : ''}>
                Terminée
              </option>

              <option value="cancelled"
                ${o.status === 'cancelled' ? 'selected' : ''}>
                Annulée
              </option>
            </select>
          </td>
        </tr>
      `;
    }).join('') ||
    '<tr><td colspan="6" class="empty">Aucune commande.</td></tr>';

  document.querySelectorAll('[data-order]').forEach(select => {

    select.onchange = async () => {

      const id = select.dataset.order;

      const { error } = await db
        .from('orders')
        .update({
          status: select.value
        })
        .eq('id', id);

      if (error) {
        alert('Erreur lors de la mise à jour.');
        console.error(error);
        return;
      }

      await loadOrders();
      renderDashboard();
    };

  });
}

function renderProducts() {

  const q =
    ($('productSearch')?.value || '').toLowerCase();

  const filtered = products.filter(p =>
    `${p.name || ''} ${p.category || ''}`
      .toLowerCase()
      .includes(q)
  );

  $('productsBody').innerHTML =
    filtered.map(p => `
      <tr>

        <td>
          <b>${escapeHtml(p.name)}</b>
          <br>
          <small>
            ${escapeHtml(p.description || '')}
          </small>
        </td>

        <td>
          ${escapeHtml(p.category || '')}
        </td>

        <td>
          ${money(p.price)}
        </td>

        <td>
          ${p.active !== false ? 'Oui' : 'Non'}
        </td>

        <td class="actions-cell">

          <button
            class="small-btn"
            onclick="editProduct('${p.id}')">
            Modifier
          </button>

          <button
            class="small-btn danger"
            onclick="deleteProduct('${p.id}')">
            Supprimer
          </button>

        </td>

      </tr>
    `).join('') ||
    '<tr><td colspan="5" class="empty">Aucun produit.</td></tr>';
}

window.editProduct = id => {

  const p = products.find(x => x.id === id);

  if (!p) return;

  $('productModalTitle').textContent =
    'Modifier le produit';

  $('productId').value = p.id;

  $('pName').value = p.name || '';

  $('pCategory').value =
    p.category || '';

  $('pPrice').value =
    p.price ?? 0;

  $('pBadge').value =
    p.badge || '';

  $('pImage').value =
    p.image_url || '';

  $('pDescription').value =
    p.description || '';

  if ($('pSort')) {
    $('pSort').value = 100;
  }

  $('pActive').checked =
    p.active !== false;

  $('productMsg').textContent = '';

  $('productModal').hidden = false;
};

window.deleteProduct = async id => {

  if (!confirm('Supprimer ce produit ?')) {
    return;
  }

  const { error } = await db
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    alert(
      'Suppression impossible : ' +
      error.message
    );

    console.error(error);
    return;
  }

  await loadProducts();
  renderDashboard();
};

$('addProduct').onclick = () => {

  $('productModalTitle').textContent =
    'Ajouter un produit';

  $('productForm').reset();

  $('productId').value = '';

  $('pActive').checked = true;

  $('productMsg').textContent = '';

  $('productModal').hidden = false;
};

$('closeProduct').onclick = () => {
  $('productModal').hidden = true;
};

$('productForm').onsubmit = async e => {

  e.preventDefault();

  const id = $('productId').value;

  const row = {

    name:
      $('pName').value.trim(),

    category:
      $('pCategory').value.trim(),

    image_url:
      $('pImage').value.trim(),

    description:
      $('pDescription').value.trim(),

    price:
      Number($('pPrice').value || 0),

    active:
      $('pActive').checked

  };

  $('productMsg').textContent =
    'Enregistrement…';

  let r;

  if (id) {

    r = await db
      .from('products')
      .update(row)
      .eq('id', id);

  } else {

    r = await db
      .from('products')
      .insert(row);

  }

  if (r.error) {

    $('productMsg').textContent =
      'Erreur : ' + r.error.message;

    console.error(r.error);

    return;
  }

  $('productMsg').textContent =
    'Enregistré ✓';

  await loadProducts();

  renderDashboard();

  setTimeout(() => {
    $('productModal').hidden = true;
  }, 500);
};

function escapeHtml(v) {

  return String(v ?? '').replace(
    /[&<>'"]/g,
    m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[m])
  );
}

document.querySelectorAll('.nav').forEach(b => {

  b.onclick = () => {

    document
      .querySelectorAll('.nav')
      .forEach(x =>
        x.classList.remove('active')
      );

    b.classList.add('active');

    document
      .querySelectorAll('.view')
      .forEach(v => v.hidden = true);

    $(b.dataset.view + 'View').hidden = false;

    $('viewTitle').textContent =
      b.textContent.replace(/^[^ ]+ /, '');

    if (b.dataset.view === 'orders') {
      renderOrders();
    }

    if (b.dataset.view === 'products') {
      renderProducts();
    }

  };

});

if ($('orderSearch')) {
  $('orderSearch').oninput = renderOrders;
}

if ($('productSearch')) {
  $('productSearch').oninput = renderProducts;
}

if ($('refreshOrders')) {
  $('refreshOrders').onclick = loadOrders;
}

boot();
