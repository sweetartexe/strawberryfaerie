/* Strawberry Faerie: shared site script (all pages). */
(function () {
  "use strict";

  var categories = window.SF_CATEGORIES || [];
  var products = window.SF_PRODUCTS || [];
  var disclosure = window.SF_COTTAGE_DISCLOSURE || "";

  function $(sel) { return document.querySelector(sel); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function price(p) { return typeof p === "number" ? "$" + p.toFixed(2).replace(/\.00$/, "") : "$—"; }
  function findCat(id) { return categories.find(function (c) { return c.id === id; }); }
  function findProduct(id) { return products.find(function (p) { return p.id === id; }); }

  /* ---------- Mobile nav ---------- */
  var toggle = $(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
        toggle.focus();
      }
    });
  }

  /* ---------- Toast ---------- */
  var toastEl = $("[data-toast]");
  var toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-visible"); }, 3200);
  }

  /* ---------- Cart (localStorage, shared by all pages) ----------
   * No payments yet. TODO: wire to Square or Stripe checkout (see README).
   */
  var CART_KEY = "sf-cart";
  function loadCart() {
    try { var c = JSON.parse(localStorage.getItem(CART_KEY)); return Array.isArray(c) ? c : []; }
    catch (e) { return []; }
  }
  var cart = loadCart();
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
    renderCount();
    renderCartPage();
  }
  function cartCount() { return cart.reduce(function (s, i) { return s + i.qty; }, 0); }
  function renderCount() {
    var n = cartCount();
    var countEl = $("[data-cart-count]");
    var btn = $("[data-cart-button]");
    if (countEl) { countEl.textContent = n; countEl.classList.toggle("has-items", n > 0); }
    if (btn) btn.setAttribute("aria-label", "Cart, " + n + (n === 1 ? " item" : " items"));
  }
  function addToCart(id, quantity) {
    quantity = Number.isInteger(quantity) && quantity > 0 ? Math.min(quantity, 99) : 1;
    var line = cart.find(function (i) { return i.id === id; });
    if (line) line.qty = Math.min(99, line.qty + quantity); else cart.push({ id: id, qty: quantity });
    saveCart();
    toast("Added to your basket! Online checkout is coming soon.");
  }
  function setQty(id, qty) {
    cart = cart.map(function (i) { return i.id === id ? { id: i.id, qty: qty } : i; })
               .filter(function (i) { return i.qty > 0; });
    saveCart();
  }
  // keep other open tabs in sync
  window.addEventListener("storage", function (e) {
    if (e.key === CART_KEY) { cart = loadCart(); renderCount(); renderCartPage(); }
  });
  window.SFCart = { get: function () { return cart.slice(); }, add: addToCart, setQty: setQty, clear: function () { cart = []; saveCart(); } };

  /* ---------- Category link tiles (home + about) ---------- */
  document.querySelectorAll("[data-category-links]").forEach(function (list) {
    categories.forEach(function (c) {
      var li = el("li");
      var a = el("a", "category-link");
      a.href = "shop.html#" + c.id;
      a.appendChild(el("span", "tab-icon", c.icon)).setAttribute("aria-hidden", "true");
      a.appendChild(el("span", "cl-name", c.name));
      a.appendChild(el("span", "cl-blurb", c.blurb));
      a.appendChild(el("span", "tab-note " + (c.fulfillment === "local" ? "is-local" : "is-ship"), shortNote(c)));
      li.appendChild(a);
      list.appendChild(li);
    });
  });
  function shortNote(c) {
    if (c.fulfillment === "local") return "Texas pickup only";
    return c.fulfillmentNote === "Ships anywhere" ? "Ships anywhere" : "Details soon";
  }

  /* ---------- Shop page ---------- */
  var tabsEl = $("[data-category-tabs]");
  if (tabsEl && categories.length) initShop();

  function initShop() {
    var infoEl = $("[data-category-info]");
    var gridEl = $("[data-product-grid]");
    var panelEl = $("[data-category-panel]");
    panelEl.id = "shop-panel";

    categories.forEach(function (c) {
      var b = el("button", "category-tab");
      b.type = "button";
      b.id = "tab-" + c.id;
      b.setAttribute("role", "tab");
      b.setAttribute("aria-controls", "shop-panel");
      b.dataset.cat = c.id;
      b.appendChild(el("span", "tab-icon", c.icon)).setAttribute("aria-hidden", "true");
      b.appendChild(el("span", "tab-name", c.name));
      b.appendChild(el("span", "tab-note " + (c.fulfillment === "local" ? "is-local" : "is-ship"), shortNote(c)));
      b.addEventListener("click", function () { select(c.id, false, true); });
      tabsEl.appendChild(b);
    });

    tabsEl.addEventListener("keydown", function (e) {
      var tabs = Array.prototype.slice.call(tabsEl.querySelectorAll("[role=tab]"));
      var idx = tabs.indexOf(document.activeElement);
      if (idx < 0) return;
      var next = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (idx + 1) % tabs.length;
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (idx - 1 + tabs.length) % tabs.length;
      if (e.key === "Home") next = 0;
      if (e.key === "End") next = tabs.length - 1;
      if (next !== null) { e.preventDefault(); select(tabs[next].dataset.cat, true, true); }
    });

    function select(catId, focus, updateHash) {
      var cat = findCat(catId) || categories[0];
      tabsEl.querySelectorAll("[role=tab]").forEach(function (t) {
        var on = t.dataset.cat === cat.id;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        if (on) {
          if (focus) t.focus();
          if (t.scrollIntoView && tabsEl.scrollWidth > tabsEl.clientWidth) {
            tabsEl.scrollLeft = t.offsetLeft - (tabsEl.clientWidth - t.offsetWidth) / 2;
          }
        }
      });
      panelEl.setAttribute("aria-labelledby", "tab-" + cat.id);
      if (updateHash && history.replaceState) history.replaceState(null, "", "#" + cat.id);

      infoEl.innerHTML = "";
      infoEl.appendChild(el("h2", "category-title", cat.name));
      infoEl.appendChild(el("p", "category-blurb", cat.blurb));
      var badge = el("p", "fulfillment " + (cat.fulfillment === "local" ? "is-local" : "is-ship"));
      badge.appendChild(el("span", "", cat.fulfillment === "local" ? "📍 " : "📦 ")).setAttribute("aria-hidden", "true");
      badge.appendChild(document.createTextNode(cat.fulfillmentNote));
      infoEl.appendChild(badge);
      if (cat.cottageFood) {
        var d = el("p", "disclosure");
        d.appendChild(el("strong", "", "Cottage food notice: "));
        d.appendChild(document.createTextNode(disclosure));
        infoEl.appendChild(d);
      }

      gridEl.innerHTML = "";
      products.filter(function (p) { return p.category === cat.id; }).forEach(function (p) {
        var card = el("article", "product-card" + (p.placeholder ? " is-placeholder" : ""));
        var media = el("div", "product-media");
        if (p.image) {
          var img = el("img");
          img.src = p.image; img.alt = p.imageAlt || p.name; img.loading = "lazy";
          media.appendChild(img);
        } else {
          media.innerHTML = '<svg aria-hidden="true" class="ph-berry"><use href="#berry"/></svg>';
          media.appendChild(el("span", "ph-text", "Photo coming soon"));
        }
        if (p.placeholder) media.appendChild(el("span", "ribbon", "Placeholder"));
        card.appendChild(media);

        var body = el("div", "product-body");
        body.appendChild(el("h3", "product-name", p.name));
        body.appendChild(el("p", "product-price", price(p.price)));
        if (p.description) body.appendChild(el("p", "product-desc", p.description));
        if (cat.cottageFood) {
          var lab = el("dl", "food-label");
          lab.appendChild(el("dt", "", "Ingredients"));
          lab.appendChild(el("dd", "", p.ingredients || "To be added"));
          lab.appendChild(el("dt", "", "Allergens"));
          lab.appendChild(el("dd", "", p.allergens || "To be added"));
          body.appendChild(lab);
        }
        if (p.preorderTrial) {
          var controls = el("div", "product-order");
          var button = el("button", "btn btn-primary", "Order"); button.type = "button";
          button.setAttribute("aria-expanded", "false");
          var qtyPanel = el("div", "order-quantity-panel");
          qtyPanel.hidden = true;
          var label = el("label", "", "Quantity");
          var input = el("input", "order-qty-input");
          input.type = "number"; input.min = "1"; input.max = "99"; input.step = "1"; input.value = "1"; input.id = "qty-" + p.id;
          label.htmlFor = input.id;
          var addButton = el("button", "btn btn-primary", "Add to Cart"); addButton.type = "button";
          button.addEventListener("click", function () {
            qtyPanel.hidden = !qtyPanel.hidden;
            button.setAttribute("aria-expanded", String(!qtyPanel.hidden));
            if (!qtyPanel.hidden) input.focus();
          });
          addButton.addEventListener("click", function () {
            var n = Number(input.value);
            if (!Number.isInteger(n) || n < 1 || n > 99) { input.setCustomValidity("Choose 1 to 99 jars."); input.reportValidity(); return; }
            input.setCustomValidity("");
            addToCart(p.id, n);
            qtyPanel.hidden = true;
            button.setAttribute("aria-expanded", "false");
            input.value = "1";
          });
          input.addEventListener("input", function () { input.setCustomValidity(""); });
          qtyPanel.appendChild(label); qtyPanel.appendChild(input); qtyPanel.appendChild(addButton);
          controls.appendChild(button); controls.appendChild(qtyPanel);
          body.appendChild(controls);
          body.appendChild(el("p", "order-trial-note", "Trial only · No payment or preorder submitted."));
        }
        card.appendChild(body);
        gridEl.appendChild(card);
      });
    }

    var fromHash = location.hash.replace("#", "");
    select(findCat(fromHash) ? fromHash : categories[0].id, false, false);
    window.addEventListener("hashchange", function () {
      var h = location.hash.replace("#", "");
      if (findCat(h)) select(h, false, false);
    });
  }

  /* ---------- Cart page ---------- */
  function renderCartPage() {
    var root = $("[data-cart-page]");
    if (!root) return;
    root.innerHTML = "";
    var lines = cart.map(function (l) { return { line: l, p: findProduct(l.id) }; })
                    .filter(function (x) { return x.p; });

    if (!lines.length) {
      var empty = el("div", "cart-empty");
      empty.innerHTML = '<svg aria-hidden="true" class="ph-berry"><use href="#berry"/></svg>';
      empty.appendChild(el("p", "", "Your basket is empty."));
      var a = el("a", "btn btn-primary", "Visit the shop"); a.href = "shop.html";
      empty.appendChild(a);
      root.appendChild(empty);
      return;
    }

    var list = el("ul", "cart-list");
    var hasLocal = false, allPriced = true, total = 0;
    lines.forEach(function (x) {
      var p = x.p, cat = findCat(p.category) || {};
      if (cat.fulfillment === "local") hasLocal = true;
      if (typeof p.price === "number") total += p.price * x.line.qty; else allPriced = false;

      var li = el("li", "cart-line");
      var thumb = el("div", "cart-thumb");
      if (p.image) { var im = el("img"); im.src = p.image; im.alt = ""; thumb.appendChild(im); }
      else thumb.innerHTML = '<svg aria-hidden="true" class="ph-berry"><use href="#berry"/></svg>';
      li.appendChild(thumb);

      var info = el("div", "cart-info");
      var name = el("p", "cart-name", p.name);
      if (p.placeholder) name.appendChild(el("span", "ribbon ribbon-inline", "Placeholder"));
      info.appendChild(name);
      info.appendChild(el("p", "cart-meta", (cat.name || "") + " · " + (cat.fulfillmentNote || "")));
      info.appendChild(el("p", "cart-price", price(p.price)));
      li.appendChild(info);

      var qty = el("div", "qty");
      var minus = el("button", "qty-btn", "−"); minus.type = "button";
      minus.setAttribute("aria-label", "Decrease quantity of " + p.name);
      minus.addEventListener("click", function () { setQty(p.id, x.line.qty - 1); });
      var val = el("span", "qty-val", String(x.line.qty)); val.setAttribute("aria-label", "Quantity " + x.line.qty);
      var plus = el("button", "qty-btn", "+"); plus.type = "button";
      plus.setAttribute("aria-label", "Increase quantity of " + p.name);
      plus.addEventListener("click", function () { setQty(p.id, x.line.qty + 1); });
      qty.appendChild(minus); qty.appendChild(val); qty.appendChild(plus);
      li.appendChild(qty);

      var rm = el("button", "cart-remove", "Remove"); rm.type = "button";
      rm.setAttribute("aria-label", "Remove " + p.name + " from cart");
      rm.addEventListener("click", function () { setQty(p.id, 0); });
      li.appendChild(rm);
      list.appendChild(li);
    });
    root.appendChild(list);

    var summary = el("div", "cart-summary");
    var row = el("p", "cart-total");
    row.appendChild(el("span", "", "Subtotal (" + cartCount() + (cartCount() === 1 ? " item)" : " items)")));
    row.appendChild(el("strong", "", allPriced ? price(total) : "$—"));
    summary.appendChild(row);
    if (hasLocal) summary.appendChild(el("p", "cart-note", "📍 Jams, jellies, and baked goods are local pickup or hand delivery in Texas only."));
    var co = el("button", "btn btn-primary btn-block", "Checkout coming soon");
    co.type = "button"; co.disabled = true; co.setAttribute("aria-disabled", "true");
    summary.appendChild(co);
    var hint = el("p", "cart-note");
    hint.innerHTML = 'To order now, email <a href="mailto:strawberryfaerieco@gmail.com">strawberryfaerieco@gmail.com</a> or call <a href="tel:+19459850757">(945)&nbsp;985-0757</a>.';
    summary.appendChild(hint);
    var clear = el("button", "cart-remove", "Empty basket"); clear.type = "button";
    clear.addEventListener("click", function () { window.SFCart.clear(); });
    summary.appendChild(clear);
    root.appendChild(summary);
  }

  renderCount();
  renderCartPage();
})();
