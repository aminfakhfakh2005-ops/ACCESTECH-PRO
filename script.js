/* ========================================================= ACCESTECH PRO SUPABASE + PRODUCTS + CART + ORDERS ========================================================= */ const db = window.supabase.createClient( "https://yxhcpyridgyuexzierwn.supabase.co", "sb_publishable_2h2I-n85SCu4MtQzZCXxIw_1U8mzZeQ" ); /* ========================================================= CART ========================================================= */ let cart = JSON.parse( localStorage.getItem("accestech_cart") || "[]" ); const count = document.getElementById("cartCount"); const cm = document.getElementById("cartModal"); const items = document.getElementById("cartItems"); const ct = document.getElementById("cartTotal"); function render() { if (count) { count.textContent = cart.reduce( (sum, item) => sum + Number(item.q || 0), 0 ); } let total = 0; if (items) { if (!cart.length) { items.innerHTML = "<p>Votre panier est vide.</p>"; } else { items.innerHTML = cart.map((item, index) => { const price = Number(item.p || 0); const quantity = Number(item.q || 1); total += price * quantity; return ` <div class="cart-item"> <span> ${escapeHtml(item.n)}<br> ${price.toFixed(2)} TND × ${quantity} </span> <span> <button type="button" onclick="chg(${index},-1)">−</button> <button type="button" onclick="chg(${index},1)">+</button> </span> </div> `; }).join(""); } } if (ct) { ct.textContent = total.toFixed(2) + " TND"; } localStorage.setItem( "accestech_cart", JSON.stringify(cart) ); } window.chg = function(index, difference) { if (!cart[index]) return; cart[index].q += difference; if (cart[index].q < 1) { cart.splice(index, 1); } render(); }; /* ========================================================= PRODUCTS BUTTONS ========================================================= */ function bindProducts() { document.querySelectorAll(".add-btn").forEach(button => { button.onclick = () => { const name = button.dataset.product; const price = Number(button.dataset.price); addToCart(name, price); }; }); document.querySelectorAll(".order-btn").forEach(button => { button.onclick = () => { const name = button.dataset.product; const price = Number(button.dataset.price); openOrder(name, price, 1); }; }); } /* ========================================================= ADD TO CART ========================================================= */ function addToCart(name, price) { if (!name || Number(price) <= 0) { alert("Prix à définir pour ce produit."); return; } const existing = cart.find( item => item.n === name && Number(item.p) === Number(price) ); if (existing) { existing.q++; } else { cart.push({ n: name, p: Number(price), q: 1 }); } render(); } /* ========================================================= CART OPEN / CLOSE ========================================================= */ const cartLink = document.getElementById("cartLink"); if (cartLink) { cartLink.onclick = event => { event.preventDefault(); render(); if (cm) { cm.hidden = false; } }; } const closeCart = document.getElementById("closeCart"); if (closeCart) { closeCart.onclick = () => { if (cm) { cm.hidden = true; } }; } /* ========================================================= ORDER MODAL ========================================================= */ const orderModal = document.getElementById("orderModal"); const product = document.getElementById("product"); const price = document.getElementById("price"); const quantity = document.getElementById("quantity"); const selectedProduct = document.getElementById("selectedProduct"); const orderTotal = document.getElementById("orderTotal"); const orderMessage = document.getElementById("orderMessage"); function openOrder(name, productPrice, qty) { productPrice = Number(productPrice); qty = Math.max(1, Number(qty || 1)); if (!name || productPrice <= 0) { alert("Prix à définir pour ce produit."); return; } if (product) { product.value = name; } if (price) { price.value = productPrice; } if (quantity) { quantity.value = qty; } if (selectedProduct) { selectedProduct.textContent = name + " — " + productPrice.toFixed(2) + " TND"; } if (orderTotal) { orderTotal.textContent = (productPrice * qty).toFixed(2) + " TND"; } if (orderMessage) { orderMessage.textContent = ""; } if (orderModal) { orderModal.hidden = false; } } /* ========================================================= CLOSE ORDER ========================================================= */ const closeOrder = document.getElementById("closeOrder"); if (closeOrder) { closeOrder.onclick = () => { if (orderModal) { orderModal.hidden = true; } }; } /* ========================================================= QUANTITY CHANGE ========================================================= */ if (quantity) { quantity.oninput = () => { const p = Number(price?.value || 0); const q = Math.max( 1, Number(quantity.value || 1) ); if (orderTotal) { orderTotal.textContent = (p * q).toFixed(2) + " TND"; } }; } /* ========================================================= CART CHECKOUT ========================================================= */ const cartCheckout = document.getElementById("cartCheckout"); if (cartCheckout) { cartCheckout.onclick = () => { if (!cart.length) { alert("Votre panier est vide."); return; } const names = cart .map(item => `${item.n} × ${item.q}` ) .join(", "); const total = cart.reduce( (sum, item) => sum + Number(item.p) * Number(item.q), 0 ); if (cm) { cm.hidden = true; } openOrder( names, total, 1 ); }; } /* =========================================================
   SEND ORDER
========================================================= */

const orderForm =
  document.getElementById("orderForm");

if (orderForm) {

  orderForm.onsubmit = async event => {

    event.preventDefault();

    if (orderMessage) {
      orderMessage.textContent =
        "Enregistrement…";
    }


    const governorate =
      document
        .getElementById("governorate")
        ?.value
        .trim() || "";

    const address =
      document
        .getElementById("address")
        ?.value
        .trim() || "";

    const notes =
      document
        .getElementById("notes")
        ?.value
        .trim() || "";

    const customerName =
      document
        .getElementById("customer_name")
        ?.value
        .trim() || "";

    const phone =
      document
        .getElementById("phone")
        ?.value
        .trim() || "";


    /* =========================
       VALIDATION
    ========================= */

    if (
      !customerName ||
      !phone ||
      !governorate ||
      !address
    ) {

      if (orderMessage) {
        orderMessage.textContent =
          "Veuillez remplir toutes les informations obligatoires.";
      }

      return;
    }


    if (!cart.length) {

      if (orderMessage) {
        orderMessage.textContent =
          "Votre panier est vide.";
      }

      return;
    }


    /* =========================
       PREPARE ORDER ITEMS
    ========================= */

    const orderItems = cart.map(item => {

      const itemPrice =
        Number(item.p || 0);

      const itemQuantity =
        Number(item.q || 1);

      return {
        product_name: item.n,
        price: itemPrice,
        quantity: itemQuantity,
        subtotal: Number(
          (itemPrice * itemQuantity).toFixed(2)
        )
      };

    });


    /* =========================
       TOTAL
    ========================= */

    const total = orderItems.reduce(
      (sum, item) =>
        sum + item.subtotal,
      0
    );


    const fullAddress =
      address +
      (governorate
        ? " — " + governorate
        : "") +
      (notes
        ? " — Note: " + notes
        : "");


    /* =========================
       CREATE ORDER
       SECURE RPC
    ========================= */

    const {
      data: orderId,
      error
    } = await db.rpc(
      "create_public_order",
      {
        p_customer_name:
          customerName,

        p_phone:
          phone,

        p_address:
          fullAddress,

        p_total:
          Number(total.toFixed(2)),

        p_items:
          orderItems
      }
    );


    if (error) {

      console.error(
        "ORDER ERROR:",
        error
      );

      if (orderMessage) {

        orderMessage.textContent =
          "Erreur: " +
          (
            error.message ||
            "Erreur inconnue"
          );
      }

      return;
    }


    /* =========================
       SUCCESS
    ========================= */

    console.log(
      "Commande créée:",
      orderId
    );


    if (orderMessage) {

      orderMessage.textContent =
        "Commande confirmée avec succès ✓";
    }


    /* تفريغ panier */

    cart = [];

    localStorage.removeItem(
      "accestech_cart"
    );

    render();

  };

} /* ========================================================= LOAD PRODUCTS FROM SUPABASE IMPORTANT: THE WEBSITE USES ONLY SUPABASE PRODUCTS ========================================================= */ async function loadProducts() { const grid = document.querySelector(".products"); if (!grid) { console.error( "Erreur: .products introuvable dans Index.html" ); return; } /* CLEAR OLD HTML PRODUCTS FIRST */ grid.innerHTML = '<p class="loading-products">Chargement des produits...</p>'; const { data, error } = await db .from("products") .select( "id,name,description,price,image_url,category,stock,active,created_at" ) .eq("active", true) .order("created_at", { ascending: true }); if (error) { console.error( "PRODUCTS ERROR:", error ); grid.innerHTML = ` <p> Impossible de charger les produits. </p> `; return; } if (!data || data.length === 0) { grid.innerHTML = ` <p> Aucun produit disponible. </p> `; return; } /* CREATE PRODUCTS FROM SUPABASE ONLY */ grid.innerHTML = data .map(p => { const category = p.category || "Accessoires"; const cls = category .toLowerCase() .replace(/\s+/g, "-"); const productPrice = Number(p.price || 0); const stock = Number(p.stock || 0); let visual = ""; if (p.image_url) { visual = ` <img src="${escapeAttr(p.image_url)}" alt="${escapeAttr(p.name)}" loading="lazy" > `; } else { visual = ` <span> ${escapeHtml(category)} </span> `; } const unavailable = stock <= 0 || productPrice <= 0; return ` <article class="card" data-category="${escapeAttr(category)}" data-product-id="${p.id}" > <div class="visual ${escapeAttr(cls)}"> ${visual} </div> <p class="tag"> ${escapeHtml(category)} </p> <h3> ${escapeHtml(p.name)} </h3> <p class="product-desc"> ${escapeHtml(p.description || "")} </p> <div class="bottom"> <strong class="price"> ${ productPrice > 0 ? productPrice.toFixed(2) + " TND" : "Prix à définir" } </strong> <div class="product-actions"> ${ unavailable ? ` <button class="add-btn" type="button" disabled > ${ stock <= 0 ? "Rupture de stock" : "Prix à définir" } </button> ` : ` <button class="add-btn" type="button" data-product="${escapeAttr(p.name)}" data-price="${productPrice}" > Ajouter au panier </button> <button class="order-btn" type="button" data-product="${escapeAttr(p.name)}" data-price="${productPrice}" > Commander </button> ` } </div> </div> </article> `; }) .join(""); /* BIND BUTTONS */ bindProducts(); } /* ========================================================= SECURITY ========================================================= */ function escapeHtml(value) { return String(value ?? "") .replace(/[&<>'"]/g, character => { const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }; return entities[character]; }); } function escapeAttr(value) { return escapeHtml(value) .replace(/`/g, "&#96;"); } /* ========================================================= START ========================================================= */ render(); loadProducts();
