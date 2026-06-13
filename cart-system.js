(function () {
  const CART_KEY = "zcas_cart";

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (error) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadges();
  }

  function formatPrice(price) {
    return "N" + Number(price || 0).toLocaleString();
  }

  function cleanText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function parsePrice(text) {
    const cleaned = String(text || "").replace(/[^\d]/g, "");
    return Number(cleaned || 0);
  }

  function addToCart(product) {
    const cart = getCart();
    const existing = cart.find(function (item) {
      return item.id === product.id;
    });

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: Number(product.price || 0),
        quantity: 1
      });
    }

    saveCart(cart);
    showCartToast(product.name + " added to cart");
  }

  function removeFromCart(id) {
    const cart = getCart().filter(function (item) {
      return item.id !== id;
    });

    saveCart(cart);
    renderCartPage();
  }

  function changeQuantity(id, amount) {
    const cart = getCart();

    const item = cart.find(function (product) {
      return product.id === id;
    });

    if (!item) return;

    item.quantity += amount;

    if (item.quantity <= 0) {
      saveCart(cart.filter(function (product) {
        return product.id !== id;
      }));
    } else {
      saveCart(cart);
    }

    renderCartPage();
  }

  function cartTotal() {
    return getCart().reduce(function (sum, item) {
      return sum + item.price * item.quantity;
    }, 0);
  }

  function cartCount() {
    return getCart().reduce(function (sum, item) {
      return sum + item.quantity;
    }, 0);
  }

  function updateCartBadges() {
    const count = cartCount();

    document.querySelectorAll("[data-zcas-cart-count]").forEach(function (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? "inline-flex" : "none";
    });

    document.querySelectorAll(".btn-order").forEach(function (button) {
      if (!button.dataset.cartReady) {
        button.dataset.cartReady = "true";
        button.style.position = "relative";
      }

      let badge = button.querySelector("[data-zcas-cart-count]");
      if (!badge) {
        badge = document.createElement("span");
        badge.setAttribute("data-zcas-cart-count", "true");
        badge.style.position = "absolute";
        badge.style.top = "-8px";
        badge.style.right = "-8px";
        badge.style.width = "22px";
        badge.style.height = "22px";
        badge.style.borderRadius = "999px";
        badge.style.background = "#5D4037";
        badge.style.color = "#fff";
        badge.style.fontSize = "0.75rem";
        badge.style.fontWeight = "800";
        badge.style.alignItems = "center";
        badge.style.justifyContent = "center";
        button.appendChild(badge);
      }

      badge.textContent = count;
      badge.style.display = count > 0 ? "inline-flex" : "none";
    });
  }

  function showCartToast(message) {
    const oldToast = document.querySelector(".zcas-cart-toast");
    if (oldToast) oldToast.remove();

    const toast = document.createElement("div");
    toast.className = "zcas-cart-toast";
    toast.textContent = message;

    toast.style.position = "fixed";
    toast.style.left = "50%";
    toast.style.bottom = "24px";
    toast.style.transform = "translateX(-50%)";
    toast.style.background = "#5D4037";
    toast.style.color = "#fff";
    toast.style.padding = "0.9rem 1.2rem";
    toast.style.borderRadius = "999px";
    toast.style.boxShadow = "0 12px 30px rgba(0,0,0,0.18)";
    toast.style.zIndex = "99999";
    toast.style.fontFamily = "Quicksand, sans-serif";
    toast.style.fontWeight = "800";

    document.body.appendChild(toast);

    setTimeout(function () {
      toast.remove();
    }, 1600);
  }

  function buildWhatsAppSummary() {
    const cart = getCart();

    if (!cart.length) {
      return "Hello ZCAS TastyBites, I would like to make an enquiry.";
    }

    let message = "Hello ZCAS TastyBites, I would like to place an order.%0A%0A";
    message += "Order Summary:%0A";

    cart.forEach(function (item) {
      message += "- " + item.name + " x" + item.quantity + " = " + formatPrice(item.price * item.quantity) + "%0A";
    });

    message += "%0ATotal: " + formatPrice(cartTotal());
    message += "%0A%0APlease confirm availability and delivery fee.";

    return decodeURIComponent(message);
  }

  function renderCartPage() {
    const cartRoot = document.getElementById("zcasCartRoot");
    if (!cartRoot) return;

    const cart = getCart();

    if (!cart.length) {
      cartRoot.innerHTML = `
        <div class="zcas-empty-cart">
          <h2>Your cart is empty</h2>
          <p>Add treats from the menu, then come back here to send your order on WhatsApp.</p>
          <a class="zcas-cart-main-btn" href="menu/index.html">Go to Menu</a>
        </div>
      `;
      return;
    }

    const rows = cart.map(function (item) {
      return `
        <div class="zcas-cart-row">
          <div>
            <h3>${item.name}</h3>
            <p>${formatPrice(item.price)} each</p>
          </div>

          <div class="zcas-cart-controls">
            <button type="button" data-cart-minus="${item.id}">-</button>
            <span>${item.quantity}</span>
            <button type="button" data-cart-plus="${item.id}">+</button>
          </div>

          <strong>${formatPrice(item.price * item.quantity)}</strong>

          <button class="zcas-remove-btn" type="button" data-cart-remove="${item.id}">Remove</button>
        </div>
      `;
    }).join("");

    cartRoot.innerHTML = `
      <div class="zcas-cart-shell">
        <div class="zcas-cart-list">
          ${rows}
        </div>

        <div class="zcas-cart-summary">
          <h2>Order Summary</h2>
          <div class="zcas-summary-line">
            <span>Items</span>
            <strong>${cartCount()}</strong>
          </div>
          <div class="zcas-summary-line total">
            <span>Total</span>
            <strong>${formatPrice(cartTotal())}</strong>
          </div>

          <a class="zcas-whatsapp-btn" href="https://wa.me/2348148124675?text=${encodeURIComponent(buildWhatsAppSummary())}">
            Send Order to WhatsApp
          </a>

          <button class="zcas-clear-btn" type="button" id="zcasClearCart">
            Clear Cart
          </button>
        </div>
      </div>
    `;

    document.querySelectorAll("[data-cart-minus]").forEach(function (button) {
      button.addEventListener("click", function () {
        changeQuantity(button.dataset.cartMinus, -1);
      });
    });

    document.querySelectorAll("[data-cart-plus]").forEach(function (button) {
      button.addEventListener("click", function () {
        changeQuantity(button.dataset.cartPlus, 1);
      });
    });

    document.querySelectorAll("[data-cart-remove]").forEach(function (button) {
      button.addEventListener("click", function () {
        removeFromCart(button.dataset.cartRemove);
      });
    });

    const clearButton = document.getElementById("zcasClearCart");
    if (clearButton) {
      clearButton.addEventListener("click", function () {
        saveCart([]);
        renderCartPage();
      });
    }
  }

  function enhanceMenuCards() {
    const cards = document.querySelectorAll(".product-card, .menu-card, .treat-card, .item-card");

    cards.forEach(function (card, index) {
      if (card.dataset.cartEnhanced) return;

      const titleEl = card.querySelector("h3, h2, .product-name, .item-name");
      const priceEl = Array.from(card.querySelectorAll("p, span, div, strong")).find(function (el) {
        return /N\s?\d|₦\s?\d|\d{3,}/i.test(el.textContent || "");
      });

      const name = cleanText(titleEl ? titleEl.textContent : "ZCAS Treat");
      const price = parsePrice(priceEl ? priceEl.textContent : "0");

      if (!name || !price) return;

      card.dataset.cartEnhanced = "true";

      const oldButtons = Array.from(card.querySelectorAll("button, a")).filter(function (el) {
        return cleanText(el.textContent).toLowerCase().includes("order") ||
               cleanText(el.textContent).toLowerCase().includes("add");
      });

      oldButtons.forEach(function (button) {
        button.textContent = "Add to Cart";
        button.setAttribute("href", "#");
        button.addEventListener("click", function (event) {
          event.preventDefault();

          addToCart({
            id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + price,
            name: name,
            price: price
          });
        });
      });

      if (!oldButtons.length) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "zcas-add-cart-btn";
        button.textContent = "Add to Cart";

        button.addEventListener("click", function () {
          addToCart({
            id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + price,
            name: name,
            price: price
          });
        });

        card.appendChild(button);
      }
    });
  }

  function injectCartStyles() {
    if (document.getElementById("zcasCartSystemStyles")) return;

    const style = document.createElement("style");
    style.id = "zcasCartSystemStyles";
    style.textContent = `
      .zcas-add-cart-btn,
      .zcas-cart-main-btn,
      .zcas-whatsapp-btn {
        border: none;
        border-radius: 999px;
        padding: 0.9rem 1.2rem;
        background: linear-gradient(135deg, #FF6B9D, #FFDAB9);
        color: #fff;
        font-family: "Quicksand", sans-serif;
        font-weight: 800;
        cursor: pointer;
        text-align: center;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        transition: 0.25s ease;
      }

      .zcas-add-cart-btn:hover,
      .zcas-cart-main-btn:hover,
      .zcas-whatsapp-btn:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 28px rgba(255, 107, 157, 0.25);
      }

      .zcas-cart-shell {
        display: grid;
        grid-template-columns: 1.2fr 0.8fr;
        gap: 2rem;
        max-width: 1150px;
        margin: 0 auto;
        padding: 2rem;
      }

      .zcas-cart-list,
      .zcas-cart-summary,
      .zcas-empty-cart {
        background: #fff;
        border-radius: 30px;
        padding: 2rem;
        box-shadow: 0 10px 35px rgba(255, 107, 157, 0.16);
      }

      .zcas-empty-cart {
        max-width: 760px;
        margin: 0 auto;
        text-align: center;
      }

      .zcas-empty-cart h2,
      .zcas-cart-summary h2 {
        color: #FF6B9D;
        margin-bottom: 1rem;
      }

      .zcas-empty-cart p {
        font-weight: 700;
        line-height: 1.7;
        margin-bottom: 1.5rem;
      }

      .zcas-cart-row {
        display: grid;
        grid-template-columns: 1fr auto auto auto;
        gap: 1rem;
        align-items: center;
        padding: 1rem 0;
        border-bottom: 1px solid rgba(255, 107, 157, 0.16);
      }

      .zcas-cart-row h3 {
        color: #5D4037;
        margin-bottom: 0.3rem;
      }

      .zcas-cart-row p {
        font-weight: 700;
        color: #4A4A4A;
      }

      .zcas-cart-controls {
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        background: #FFF5F7;
        border-radius: 999px;
        padding: 0.35rem;
      }

      .zcas-cart-controls button {
        width: 34px;
        height: 34px;
        border-radius: 999px;
        border: none;
        background: #fff;
        color: #5D4037;
        font-weight: 900;
        cursor: pointer;
      }

      .zcas-cart-controls span {
        min-width: 24px;
        text-align: center;
        font-weight: 900;
      }

      .zcas-remove-btn,
      .zcas-clear-btn {
        border: none;
        border-radius: 999px;
        padding: 0.75rem 1rem;
        background: #FFF5F7;
        color: #5D4037;
        font-family: "Quicksand", sans-serif;
        font-weight: 800;
        cursor: pointer;
      }

      .zcas-summary-line {
        display: flex;
        justify-content: space-between;
        padding: 1rem 0;
        border-bottom: 1px solid rgba(255, 107, 157, 0.16);
        font-weight: 800;
      }

      .zcas-summary-line.total {
        font-size: 1.3rem;
        color: #FF6B9D;
        border-bottom: none;
      }

      .zcas-whatsapp-btn,
      .zcas-clear-btn {
        width: 100%;
        margin-top: 1rem;
      }

      .zcas-whatsapp-btn {
        background: #25D366;
      }

      @media (max-width: 850px) {
        .zcas-cart-shell {
          grid-template-columns: 1fr;
          padding: 1rem;
        }

        .zcas-cart-row {
          grid-template-columns: 1fr;
          align-items: start;
        }
      }
    `;

    document.head.appendChild(style);
  }

  window.ZCASCart = {
    getCart: getCart,
    saveCart: saveCart,
    addToCart: addToCart,
    removeFromCart: removeFromCart,
    changeQuantity: changeQuantity,
    renderCartPage: renderCartPage
  };

  document.addEventListener("DOMContentLoaded", function () {
    injectCartStyles();
    enhanceMenuCards();
    updateCartBadges();
    renderCartPage();
  });
})();
