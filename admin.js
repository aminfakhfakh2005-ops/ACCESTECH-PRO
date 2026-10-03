const SUPABASE_URL = 'https://yxhcpyridgyuexzierwn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2h2I-n85SCu4MtQzZCXxIw_1U8mzZeQ';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = id => document.getElementById(id);

async function boot() {
    console.log('ADMIN JS: démarrage');

    const { data, error } = await db.auth.getSession();

    console.log('SESSION:', data);
    console.log('SESSION ERROR:', error);

    if (data.session) {
        showApp(data.session);
    } else {
        $('loginView').hidden = false;
    }
}

function showApp(session) {
    console.log('ADMIN CONNECTÉ');

    $('loginView').hidden = true;
    $('app').hidden = false;
    $('userEmail').textContent = session.user.email || '';

    loadAll();
}

$('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = $('email').value.trim();
    const password = $('password').value;

    $('loginMsg').textContent = 'Connexion…';

    console.log('EMAIL:', email);
    console.log('Tentative de connexion...');

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
        $('loginMsg').textContent = 'Connexion impossible : aucune session.';
        return;
    }

    $('loginMsg').textContent = 'Connexion réussie ✓';

    showApp(data.session);
});

$('logout').addEventListener('click', async function() {
    await db.auth.signOut();
    location.reload();
});

async function loadAll() {
    console.log('Chargement des données...');

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

    console.log('ORDERS:', data);
    console.log('ORDERS ERROR:', error);

    orders = data || [];

    renderOrders();
}

async function loadProducts() {
    const { data, error } = await db
        .from('products')
        .select('*')
        .order('sort_order', { ascending: true });

    console.log('PRODUCTS:', data);
    console.log('PRODUCTS ERROR:', error);

    products = data || [];

    renderProducts();
}

let orders = [];
let products = [];

function money(value) {
    return Number(value || 0).toFixed(2) + ' TND';
}

function renderDashboard() {
    if (!$('statOrders')) return;

    $('statOrders').textContent = orders.length;

    $('statPending').textContent =
        orders.filter(x => x.status === 'pending').length;

    $('statRevenue').textContent =
        money(orders.reduce((sum, x) => sum + Number(x.total || 0), 0));

    $('statProducts').textContent =
        products.filter(x => x.active !== false).length;

    $('recentOrders').innerHTML =
        orders.length
            ? orders.slice(0, 6).map(order => `
                <div class="recent">
                    <b>${escapeHtml(order.customer_name || 'Client')}</b>
                    <span>${escapeHtml(order.phone || '')} · ${money(order.total)}</span>
                </div>
            `).join('')
            : '<div class="empty">Aucune commande.</div>';
}

function renderOrders() {
    if (!$('ordersBody')) return;

    $('ordersBody').innerHTML = orders.map(o => {
        const productsText = Array.isArray(o.products)
            ? o.products.map(p =>
                `${escapeHtml(p.name)} × ${p.quantity}`
              ).join('<br>')
            : '';

        return `
            <tr>
                <td>${o.created_at ? new Date(o.created_at).toLocaleString('fr-FR') : ''}</td>

                <td>
                    <b>${escapeHtml(o.customer_name || '')}</b><br>
                    <small>${escapeHtml(o.address || '')}</small>
                </td>

                <td>${escapeHtml(o.phone || '')}</td>

                <td>${productsText}</td>

                <td>${money(o.total)}</td>

                <td>
                    <select class="status" data-order="${o.id}">
                        <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Nouveau</option>
                        <option value="processing" ${o.status === 'processing' ? 'selected' : ''}>En traitement</option>
                        <option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>Expédiée</option>
                        <option value="completed" ${o.status === 'completed' ? 'selected' : ''}>Terminée</option>
                        <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Annulée</option>
                    </select>
                </td>
            </tr>
        `;
    }).join('') || `
        <tr>
            <td colspan="6" class="empty">Aucune commande.</td>
        </tr>
    `;

    document.querySelectorAll('[data-order]').forEach(select => {
        select.onchange = async function() {
            await db
                .from('orders')
                .update({ status: select.value })
                .eq('id', select.dataset.order);

            await loadOrders();
            renderDashboard();
        };
    });
}

function renderProducts() {
    if (!$('productsBody')) return;

    $('productsBody').innerHTML = products.map(p => `
        <tr>
            <td>
                <b>${escapeHtml(p.name)}</b>
                <br>
                <small>${escapeHtml(p.description || '')}</small>
            </td>

            <td>${escapeHtml(p.category || '')}</td>

            <td>${money(p.price)}</td>

            <td>${p.active ? 'Oui' : 'Non'}</td>

            <td>
                <button class="small-btn" onclick="editProduct('${p.id}')">
                    Modifier
                </button>

                <button class="small-btn danger" onclick="deleteProduct('${p.id}')">
                    Supprimer
                </button>
            </td>
        </tr>
    `).join('') || `
        <tr>
            <td colspan="5" class="empty">Aucun produit.</td>
        </tr>
    `;
}

window.editProduct = function(id) {
    const p = products.find(x => x.id === id);

    if (!p) return;

    $('productModalTitle').textContent = 'Modifier le produit';

    $('productId').value = p.id;
    $('pName').value = p.name || '';
    $('pCategory').value = p.category || 'ACCESSOIRES';
    $('pPrice').value = p.price || 0;
    $('pBadge').value = p.badge || '';
    $('pImage').value = p.image_url || '';
    $('pDescription').value = p.description || '';
    $('pSort').value = p.sort_order || 100;
    $('pActive').checked = p.active !== false;

    $('productModal').hidden = false;
};

window.deleteProduct = async function(id) {
    if (!confirm('Supprimer ce produit ?')) return;

    const { error } = await db
        .from('products')
        .delete()
        .eq('id', id);

    if (error) {
        alert('Erreur : ' + error.message);
        return;
    }

    await loadProducts();
    renderDashboard();
};

$('addProduct').onclick = function() {
    $('productForm').reset();

    $('productId').value = '';
    $('pActive').checked = true;

    $('productModalTitle').textContent = 'Ajouter un produit';

    $('productModal').hidden = false;
};

$('closeProduct').onclick = function() {
    $('productModal').hidden = true;
};

$('productForm').onsubmit = async function(e) {
    e.preventDefault();

    const id = $('productId').value;

    const row = {
        name: $('pName').value.trim(),
        category: $('pCategory').value,
        price: Number($('pPrice').value),
        badge: $('pBadge').value.trim(),
        image_url: $('pImage').value.trim(),
        description: $('pDescription').value.trim(),
        sort_order: Number($('pSort').value || 100),
        active: $('pActive').checked
    };

    $('productMsg').textContent = 'Enregistrement…';

    const result = id
        ? await db.from('products').update(row).eq('id', id)
        : await db.from('products').insert(row);

    if (result.error) {
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

document.querySelectorAll('.nav').forEach(button => {
    button.onclick = function() {

        document.querySelectorAll('.nav')
            .forEach(x => x.classList.remove('active'));

        button.classList.add('active');

        document.querySelectorAll('.view')
            .forEach(v => v.hidden = true);

        const view = $(button.dataset.view + 'View');

        if (view) view.hidden = false;

        if (button.dataset.view === 'orders') {
            renderOrders();
        }

        if (button.dataset.view === 'products') {
            renderProducts();
        }

        if (button.dataset.view === 'dashboard') {
            renderDashboard();
        }

        $('viewTitle').textContent =
            button.textContent.replace(/^[^ ]+ /, '');
    };
});

$('orderSearch').oninput = renderOrders;
$('productSearch').oninput = renderProducts;
$('refreshOrders').onclick = loadOrders;

function escapeHtml(value) {
    return String(value ?? '').replace(
        /[&<>'"]/g,
        function(m) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[m];
        }
    );
}

boot();
