alert("admin js ok");
const SUPABASE_URL = 'https://yxhcpyridgyuexzierwn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2h2I-n85SCu4MtQzZCXxIw_1U8mzZeQ';

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const $ = (id) => document.getElementById(id);

let orders = [];
let products = [];

/* =========================
   AUTH / LOGIN
========================= */

async function boot() {
  const { data, error } = await db.auth.getSession();

  if (error) {
    console.error('Session error:', error);
    $('loginMsg').textContent = 'Erreur de connexion à Supabase.';
    return;
  }

  if (data.session) {
    showApp(data.session);
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

  try {
    const { data, error } = await db.auth.signInWithPassword({
      email: email,
      password: password
    });

    console.log('LOGIN DATA:', data);
    console.log('LOGIN ERROR:', error);

    if (error) {
      $('loginMsg').textContent = 'Erreur : ' + error.message;
      return;
    }

    if (!data.session) {
      $('loginMsg').textContent = 'Connexion sans session.';
      return;
    }

    $('loginMsg').textContent = '';

    showApp(data.session);

  } catch (err) {
    console.error('LOGIN EXCEPTION:', err);
    $('loginMsg').textContent = 'Erreur : ' + err.message;
  }
};

$('logout').onclick = async () => {
  await db.auth.signOut();
  location.reload();
};


/* =========================
   LOAD DATA
========================= */

async function loadAll() {
  await Promise.all([
    loadOrders(),
    loadProducts()
  ]);

  renderDashboard();
}


/* =========================
   ORDERS
========================= */

async function loadOrders() {
  const { data, error } = await db
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Orders error:', error);
    orders = [];
    $('ordersBody').innerHTML =
      '<tr><td colspan="6" class="empty">Erreur de chargement des commandes.</td></tr>';
    return;
  }

  orders = data || [];

  renderOrders();
}


function renderOrders() {
  const q = ($('orderSearch')?.value || '').toLowerCase();

  const filtered = orders.filter((o) => {
    return `${o.customer_name || ''} ${o.phone || ''}`
      .toLowerCase()
      .includes(q);
  });

  $('ordersBody').innerHTML =
    filtered.map((o) => {

      const productsText = Array.isArray(o.products)
        ? o.products.map((p) =>
            `${escapeHtml(p.name || '')} × ${p.quantity || 1}`
          ).join('<br>')
        : '';

      return `
        <tr>
          <td>
            ${o.created_at
              ? new Date(o.created_at).toLocaleString('fr-FR')
              : ''}
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
            ${productsText}
          </td>

          <td>
            ${money(o.total)}
          </td>

          <td>
            <select class="status" data-order="${o.id}">
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

  document.querySelectorAll('[data-order]').forEach((select) => {

    select.onchange = async () => {

      const id = select.dataset.order;

      const { error } = await db
        .from('orders')
        .update({
          status: select.value
        })
        .eq('id', id);

      if (error) {
        console.error('Status update error:', error);
        alert('Impossible de modifier le statut.');
        return;
      }

      await loadOrders();
      renderDashboard();
    };
  });
}


/* =========================
   PRODUCTS
========================= */

async function loadProducts() {

  const { data, error } = await db
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Products error:', error);

    products = [];

    $('productsBody').innerHTML =
      '<tr><td colspan="5" class="empty">Erreur de chargement des produits.</td></tr>';

    return;
  }

  products = data || [];

  renderProducts();
}


function renderProducts() {

  const q = ($('productSearch')?.value || '').toLowerCase();

  const filtered = products.filter((p) => {

    return `${p.name || ''} ${p.category || ''}`
      .toLowerCase()
      .includes(q);

  });

  $('productsBody').innerHTML =
    filtered.map((p) => {

      return `
        <tr>

          <td>
            <b>${escapeHtml(p.name || '')}</b>
            <br>
            <small>${escapeHtml(p.description || '')}</small>
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
      `;

    }).join('') ||
    '<tr><td colspan="5" class="empty">Aucun produit.</td></tr>';
}


/* =========================
   ADD PRODUCT
========================= */

$('addProduct').onclick = () => {

  $('productModalTitle').textContent = 'Ajouter un produit';

  $('productForm').reset();

  $('productId').value = '';

  $('pActive').checked = true;

  $('productMsg').textContent = '';

  $('productModal').hidden = false;
};


/* =========================
   EDIT PRODUCT
========================= */

window.editProduct = (id) => {

  const p = products.find((x) => String(x.id) === String(id));

  if (!p) return;

  $('productModalTitle').textContent = 'Modifier le produit';

  $('productId').value = p.id;

  $('pName').value = p.name || '';

  $('pCategory').value = p.category || '';

  $('pPrice').value = p.price ?? '';

  $('pBadge').value = p.badge || '';

  $('pImage').value = p.image_url || '';

  $('pDescription').value = p.description || '';

  $('pSort').value = 100;

  $('pActive').checked = p.active !== false;

  $('productMsg').textContent = '';

  $('productModal').hidden = false;
};


/* =========================
   DELETE PRODUCT
========================= */

window.deleteProduct = async (id) => {

  const ok = confirm('Supprimer ce produit ?');

  if (!ok) return;

  const { error } = await db
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {

    console.error('Delete product error:', error);

    alert(
      'Suppression impossible : ' +
      error.message
    );

    return;
  }

  await loadProducts();

  renderDashboard();
};


/* =========================
   SAVE PRODUCT
========================= */

$('productForm').onsubmit = async (e) => {

  e.preventDefault();

  const id = $('productId').value;

  const row = {

    name: $('pName').value.trim(),

    category: $('pCategory').value,

    price: Number($('pPrice').value),

    image_url: $('pImage').value.trim(),

    description: $('pDescription').value.trim(),

    active: $('pActive').checked

  };

  $('productMsg').textContent = 'Enregistrement…';

  let result;

  if (id) {

    result = await db
      .from('products')
      .update(row)
      .eq('id', id);

  } else {

    result = await db
      .from('products')
      .insert(row);

  }

  if (result.error) {

    console.error('Product save error:', result.error);

    $('productMsg').textContent =
      'Erreur : ' + result.error.message;

    return;
  }

  $('productMsg').textContent = 'Enregistré ✓';

  await loadProducts();

  renderDashboard();

  setTimeout(() => {

    $('productModal').hidden = true;

  }, 500);
};


/* =========================
   CLOSE MODAL
========================= */

$('closeProduct').onclick = () => {

  $('productModal').hidden = true;

};


/* =========================
   DASHBOARD
========================= */

function renderDashboard() {

  $('statOrders').textContent =
    orders.length;

  $('statPending').textContent =
    orders.filter(
      (x) => x.status === 'pending'
    ).length;

  $('statRevenue').textContent =
    money(
      orders.reduce(
        (sum, x) =>
          sum + Number(x.total || 0),
        0
      )
    );

  $('statProducts').textContent =
    products.filter(
      (x) => x.active !== false
    ).length;

  $('recentOrders').innerHTML =
    orders
      .slice(0, 6)
      .map(orderRow)
      .join('') ||
    '<div class="empty">Aucune commande.</div>';
}


function orderRow(o) {

  const date = o.created_at
    ? new Date(o.created_at).toLocaleString('fr-FR')
    : '';

  const prods = Array.isArray(o.products)
    ? o.products.map((p) =>
        `${p.name || ''} × ${p.quantity || 1}`
      ).join(', ')
    : '';

  return `
    <div class="recent">

      <b>
        ${escapeHtml(o.customer_name || 'Client')}
      </b>

      <span>
        ${escapeHtml(o.phone || '')}
        ·
        ${money(o.total)}
      </span>

      <small>
        ${escapeHtml(prods)}
        ·
        ${escapeHtml(date)}
      </small>

    </div>
  `;
}


/* =========================
   NAVIGATION
========================= */

document.querySelectorAll('.nav').forEach((button) => {

  button.onclick = () => {

    document
      .querySelectorAll('.nav')
      .forEach((x) =>
        x.classList.remove('active')
      );

    button.classList.add('active');

    document
      .querySelectorAll('.view')
      .forEach((view) =>
        view.hidden = true
      );

    const viewName = button.dataset.view;

    $(viewName + 'View').hidden = false;

    $('viewTitle').textContent =
      button.textContent.replace(/^[^ ]+ /, '');

    if (viewName === 'orders') {
      renderOrders();
    }

    if (viewName === 'products') {
      renderProducts();
    }

  };

});


/* =========================
   SEARCH / REFRESH
========================= */

$('orderSearch').oninput = renderOrders;

$('productSearch').oninput = renderProducts;

$('refreshOrders').onclick = async () => {

  await loadOrders();

  renderDashboard();

};


/* =========================
   HELPERS
========================= */

function money(value) {

  return `${Number(value || 0).toFixed(2)} TND`;

}


function escapeHtml(value) {

  return String(value ?? '').replace(
    /[&<>'"]/g,
    (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[m])
  );

}


/* =========================
   START
========================= */

boot();
