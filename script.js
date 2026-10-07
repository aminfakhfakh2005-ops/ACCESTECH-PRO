const db = window.supabase.createClient(
"https://yxhcpyridgyuexzierwn.supabase.co",
"sb_publishable_2h2I-n85SCu4MtQzZCXxIw_1U8mzZeQ"
);

let cart = JSON.parse(localStorage.getItem("accestech_cart") || "[]");

const count = document.getElementById("cartCount");
const cm = document.getElementById("cartModal");
const items = document.getElementById("cartItems");
const ct = document.getElementById("cartTotal");

function render() {
if (count) {
count.textContent = cart.reduce((s, x) => s + x.q, 0);
}

let total = 0;

if (items) {
items.innerHTML = cart.length
? cart.map((x, i) => {
total += x.p * x.q;

      return `
        <div class="cart-item">
          <span>
            ${escapeHtml(x.n)}<br>
            ${x.p.toFixed(2)} TND × ${x.q}
          </span>

          <span>
            <button onclick="chg(${i},-1)">−</button>
            <button onclick="chg(${i},1)">+</button>
          </span>
        </div>
      `;
    }).join("")
  : "<p>Votre panier est vide.</p>";

}

if (ct) {
ct.textContent = total.toFixed(2) + " TND";
}

localStorage.setItem("accestech_cart", JSON.stringify(cart));
}

window.chg = (i, d) => {
if (!cart[i]) return;

cart[i].q += d;

if (cart[i].q < 1) {
cart.splice(i, 1);
}

render();
};

function bindProducts() {

document.querySelectorAll(".add-btn").forEach(button => {
button.onclick = () => {
addToCart(
button.dataset.product,
Number(button.dataset.price)
);
};
});

document.querySelectorAll(".order-btn").forEach(button => {
button.onclick = () => {
openOrder(
button.dataset.product,
Number(button.dataset.price),
1
);
};
});
}

function addToCart(name, price) {

if (Number(price) <= 0) {
alert("Prix à définir pour ce produit.");
return;
}

const existing = cart.find(
x => x.n === name && x.p === price
);

if (existing) {
existing.q++;
} else {
cart.push({
n: name,
p: price,
q: 1
});
}

render();
}

const cartLink = document.getElementById("cartLink");

if (cartLink) {
cartLink.onclick = e => {
e.preventDefault();
render();

if (cm) {
  cm.hidden = false;
}

};
}

const closeCart = document.getElementById("closeCart");

if (closeCart) {
closeCart.onclick = () => {
if (cm) cm.hidden = true;
};
}

/* =========================
ORDER MODAL
========================= */

const orderModal = document.getElementById("orderModal");
const product = document.getElementById("product");
const price = document.getElementById("price");
const quantity = document.getElementById("quantity");
const selectedProduct = document.getElementById("selectedProduct");
const orderTotal = document.getElementById("orderTotal");
const orderMessage = document.getElementById("orderMessage");

function openOrder(name, productPrice, qty) {

if (Number(productPrice) <= 0) {
alert("Prix à définir pour ce produit.");
return;
}

if (product) product.value = name;
if (price) price.value = productPrice;
if (quantity) quantity.value = qty;

if (selectedProduct) {
selectedProduct.textContent =
name + " — " + productPrice.toFixed(2) + " TND";
}

if (orderTotal) {
orderTotal.textContent =
(productPrice * qty).toFixed(2) + " TND";
}

if (orderMessage) {
orderMessage.textContent = "";
}

if (orderModal) {
orderModal.hidden = false;
}
}

const closeOrder = document.getElementById("closeOrder");

if (closeOrder) {
closeOrder.onclick = () => {
if (orderModal) orderModal.hidden = true;
};
}

if (quantity) {
quantity.oninput = () => {

const p = Number(price?.value || 0);
const q = Math.max(1, Number(quantity.value || 1));

if (orderTotal) {
  orderTotal.textContent =
    (p * q).toFixed(2) + " TND";
}

};
}

/* =========================
CART CHECKOUT
========================= */

const cartCheckout = document.getElementById("cartCheckout");

if (cartCheckout) {

cartCheckout.onclick = () => {

if (!cart.length) {
  alert("Votre panier est vide.");
  return;
}

const names = cart
  .map(x => `${x.n} × ${x.q}`)
  .join(", ");

const total = cart.reduce(
  (s, x) => s + x.p * x.q,
  0
);

if (cm) cm.hidden = true;

openOrder(names, total, 1);

};
}

/* =========================
SEND ORDER
========================= */

const orderForm = document.getElementById("orderForm");

if (orderForm) {

orderForm.onsubmit = async e => {

e.preventDefault();

if (orderMessage) {
  orderMessage.textContent = "Enregistrement…";
}

const q = Math.max(
  1,
  Number(quantity?.value || 1)
);

const p = Number(
  price?.value || 0
);

const governorate =
  document.getElementById("governorate")?.value.trim() || "";

const address =
  document.getElementById("address")?.value.trim() || "";

const notes =
  document.getElementById("notes")?.value.trim() || "";

const customerName =
  document.getElementById("customer_name")?.value.trim() || "";

const phone =
  document.getElementById("phone")?.value.trim() || "";

/* =========================
   VALIDATION
========================= */

if (!customerName || !phone || !governorate || !address) {

  if (orderMessage) {
    orderMessage.textContent =
      "Veuillez remplir toutes les informations obligatoires.";
  }

  return;
}

if (p <= 0 || q <= 0) {

  if (orderMessage) {
    orderMessage.textContent =
      "Produit ou quantité invalide.";
  }

  return;
}


/* =========================
   CREATE ORDER
========================= */

const orderData = {
  customer_name: customerName,
  phone: phone,
  address:
    address +
    (governorate ? " — " + governorate : "") +
    (notes ? " — Note: " + notes : ""),
  total: Number((p * q).toFixed(2)),
  status: "pending"
};


const {
  data: order,
  error: orderError
} = await db
  .from("orders")
  .insert([orderData])
  .select("id")
  .single();


if (orderError) {

  console.error("ORDER ERROR:", orderError);

  if (orderMessage) {
    orderMessage.textContent =
        "Erreur: " + (orderError.message || "Erreur inconnue");
  }

  return;
}


/* =========================
   CREATE ORDER ITEM
========================= */

const orderItem = {
order_id: order.id,
product_name: product?.value || "",
price: p,
quantity: q,
subtotal: Number((p * q).toFixed(2))
};

const {
  error: itemError
} = await db
  .from("order_items")
  .insert([orderItem]);


if (itemError) {

  console.error("ORDER ITEM ERROR:", itemError);

  /* محاولة حذف الطلب الرئيسي إذا فشل order_items */
  await db
    .from("orders")
    .delete()
    .eq("id", order.id);


  if (orderMessage) {
    orderMessage.textContent =
        "Erreur produit: " + (itemError.message || "Erreur inconnue");
  }

  return;
}


/* =========================
   SUCCESS
========================= */

if (orderMessage) {
  orderMessage.textContent =
    "Commande confirmée avec succès ✓";
}

cart = [];

render();

localStorage.removeItem("accestech_cart");

};
}

/* =========================
LOAD PRODUCTS FROM SUPABASE
========================= */

async function loadProducts() {

const grid = document.querySelector(".products");

if (!grid) return;

const {
data,
error
} = await db
.from("products")
.select(
"id,name,description,price,image_url,category,stock,active,created_at"
)
.eq("active", true)
.order("created_at", {
ascending: true
});

if (error) {

console.error(
  "PRODUCTS ERROR:",
  error
);

bindProducts();

return;

}

if (!data || !data.length) {

grid.innerHTML =
  "<p>Aucun produit disponible.</p>";

return;

}

grid.innerHTML = data.map(p => {

const category =
  p.category || "Accessoires";

const cls =
  category
    .toLowerCase()
    .replace(/\s+/g, "-");


let visual = "";

if (p.image_url) {

  visual = `
    <img
      src="${escapeAttr(p.image_url)}"
      alt="${escapeAttr(p.name)}"
      loading="lazy"
    >
  `;

} else {

  visual = `
    <span>
      ${escapeHtml(category)}
    </span>
  `;
}


const productPrice =
  Number(p.price || 0);

const stock =
  Number(p.stock || 0);


const unavailable =
  stock <= 0 || productPrice <= 0;


return `
  <article
    class="card"
    data-category="${escapeAttr(category)}"
  >

    <div class="visual ${escapeAttr(cls)}">
      ${visual}
    </div>

    <p class="tag">
      ${escapeHtml(category)}
    </p>

    <h3>
      ${escapeHtml(p.name)}
    </h3>

    <p class="product-desc">
      ${escapeHtml(p.description || "")}
    </p>

    <div class="bottom">

      <strong class="price">
        ${
          productPrice > 0
            ? productPrice.toFixed(2) + " TND"
            : "Prix à définir"
        }
      </strong>

      <div class="product-actions">

        ${
          unavailable
            ? `
              <button
                class="add-btn"
                type="button"
                disabled
              >
                ${
                  stock <= 0
                    ? "Rupture de stock"
                    : "Prix à définir"
                }
              </button>
            `
            : `
              <button
                class="add-btn"
                type="button"
                data-product="${escapeAttr(p.name)}"
                data-price="${productPrice}"
              >
                Ajouter au panier
              </button>

              <button
                class="order-btn"
                type="button"
                data-product="${escapeAttr(p.name)}"
                data-price="${productPrice}"
              >
                Commander
              </button>
            `
        }

      </div>

    </div>

  </article>
`;

}).join("");

bindProducts();
}

/* =========================
SECURITY / HTML ESCAPE
========================= */

function escapeHtml(value) {

return String(value ?? "")
.replace(
/[&<>'"]/g,
character => ({
"&": "&",
"<": "<",
">": ">",
"'": "'",
'"': """
})[character]
);
}

function escapeAttr(value) {

return escapeHtml(value)
.replace(/`/g, "`");
}

/* =========================
START
========================= */

render();

loadProducts();
