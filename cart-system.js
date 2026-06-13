(function () {
  const CART_KEY = "zcas_cart_v2";

  const PRODUCTS = [
    { id: "meat-pie", name: "Meat Pie", price: 1500, aliases: ["meat pie", "golden meat pie"] },
    { id: "samosa", name: "Samosa", price: 350, aliases: ["samosa"] },
    { id: "spring-rolls", name: "Spring Rolls", price: 350, aliases: ["spring roll", "spring rolls"] },
    { id: "egg-rolls", name: "Egg Rolls", price: 1000, aliases: ["egg roll", "egg rolls"] },
    { id: "doughnuts", name: "Doughnuts", price: 800, aliases: ["doughnut", "doughnuts", "donut", "donuts", "classic doughnuts"] },
    { id: "fruit-juice", name: "Fruit Juice", price: 2000, aliases: ["fruit juice", "fresh fruit juice", "juice"] },
    { id: "cakes", name: "Cakes", price: 0, aliases: ["cake", "cakes", "custom cake"] }
  ];

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

  function money(amount) {
    amount = Number(amount || 0);
    if (!amount) return "Price on request";
    return "N" + amount.toLocaleString();
  }

  function clean(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function findProductFromText(text) {
    const lower = clean(text).toLowerCase();

    return PRODUCTS.find(function (product) {
      return product.aliases.some(function (alias) {
        return lower.includes(alias);
      });
    });
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
        price: product.price,
        quantity: 1
      });
    }

    saveCart(cart);
    toast(product.name + " added to cart");
  }

  function changeQty(id, amount) {
    let cart = getCart();

    cart = cart.map(function (item) {
      if (item.id === id) {
        item.quantity += amount;
      }
      return item;
    }).filter(function (item) {
      return item.quantity > 0;
    });

    saveCart(cart);
    renderCart();
  }

  function removeItem(id) {
    const cart = getCart().filter(function (item) {
      return item.id !== id;
    });

    saveCart(cart);
    renderCart();
  }

  function countCart() {
    return getCart().reduce(function (sum, item) {
      return sum + item.quantity;
    }, 0);
  }

  function totalCart() {
    return getCart().reduce(function (sum, item) {
      return sum + item.price * item.quantity;
    }, 0);
  }

  function updateCartBadges() {
    const count = countCart();

    document.querySelectorAll(".btn-order").forEach(function (button) {
      button.style.position = "relative";

      let badge = button.querySelector(".zcas-cart-count");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "zcas-cart-count";
        button.appendChild(badge);
      }

      badge.textContent = count;
      badge.style.display = count > 0 ? "inline-flex" : "none";
    });
  }

  function toast(message) {
    const old = document.querySelector(".zcas-toast");
    if (old) old.remove();

    const box = document.createElement("div");
    box.className = "zcas-toast";
    box.textContent = message;
    document.body.appendChild(box);

    setTimeout(function () {
      box.remove();
    }, 1600);
  }

  function whatsappMessage() {
    const cart = getCart();

    if (!cart.length) {
      return "Hello ZCAS TastyBites, I would like to make an enquiry.";
    }

    let text = "Hello ZCAS TastyBites, I would like to place an order.\n\n";
    text += "Order Summary:\n";

    cart.forEach(function (item) {
      const lineTotal = item.price ? money(item.price * item.quantity) : "Price on request";
      text += "- " + item.name + " x" + item.quantity + " = " + lineTotal + "\n";
    });

    text += "\nTotal: " + money(totalCart());
    text += "\n\nPlease confirm availability and delivery fee.";

    return text;
  }

  function enhanceMenuCards() {
    const cards = Array.from(document.querySelectorAll(".product-card, .menu-card, .treat-card, .item-card, .card"));

    cards.forEach(function (card) {
      if (card.dataset.zcasCartReady === "true") return;

      const product = findProductFromText(card.textContent);
      if (!product) return;

      card.dataset.zcasCartReady = "true";

      let buttons = Array.from(card.querySelectorAll("button, a")).filter(function (el) {
        const text = clean(el.textContent).toLowerCase();
        const href = el.getAttribute("href") || "";

        return (
          text.includes("order") ||
          text.includes("cart") ||
          text.includes("add") ||
          href.includes("wa.me") ||
          href.includes("whatsapp")
        );
      });

      if (!buttons.length) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "zcas-add-cart-btn";
        button.textContent = "Add to Cart";
        card.appendChild(button);
        buttons = [button];
      }

      buttons.forEach(function (button) {
        const cleanButton = button.cloneNode(true);

        cleanButton.textContent = "Add to Cart";
        cleanButton.classList.add("zcas-add-cart-btn");

        if (cleanButton.tagName.toLowerCase() === "a") {
          cleanButton.setAttribute("href", "#");
          cleanButton.removeAttribute("target");
          cleanButton.removeAttribute("rel");
        } else {
          cleanButton.setAttribute("type", "button");
        }

        cleanButton.onclick = function (event) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();

          addToCart(product);

          return false;
        };

        button.replaceWith(cleanButton);
      });
    });
  }

  function renderCart() {
    const root = document.getElementById("zcasCartRoot");
    if (!root) return;

    const cart = getCart();

    if (!cart.length) {
      root.innerHTML = `
        <div class="zcas-empty-cart">
          <h2>Your cart is empty</h2>
          <p>Add treats from the menu, then come back here to send your order to WhatsApp.</p>
          <a class="zcas-cart-main-btn" href="menu/index.html">Go to Menu</a>
        </div>
      `;
      return;
    }

    root.innerHTML = `
      <div class="zcas-cart-shell">
        <div class="zcas-cart-list">
          ${cart.map(function (item) {
            return `
              <div class="zcas-cart-row">
                <div>
                  <h3>${item.name}</h3>
                  <p>${money(item.price)} each</p>
                </div>

                <div class="zcas-cart-controls">
                  <button type="button" data-minus="${item.id}">-</button>
                  <span>${item.quantity}</span>
                  <button type="button" data-plus="${item.id}">+</button>
                </div>

                <strong>${item.price ? money(item.price * item.quantity) : "Price on request"}</strong>

                <button type="button" class="zcas-remove-btn" data-remove="${item.id}">Remove</button>
              </div>
            `;
          }).join("")}
        </div>

        <aside class="zcas-cart-summary">
          <h2>Order Summary</h2>

          <div class="zcas-summary-line">
            <span>Items</span>
            <strong>${countCart()}</strong>
          </div>

          <div class="zcas-summary-line total">
            <span>Total</span>
            <strong>${money(totalCart())}</strong>
          </div>

          <a class="zcas-whatsapp-btn" href="https://wa.me/2348148124675?text=${encodeURIComponent(whatsappMessage())}">
            Send Order to WhatsApp
          </a>

          <button class="zcas-clear-btn" type="button" id="zcasClearCart">Clear Cart</button>
        </aside>
      </div>
    `;

    document.querySelectorAll("[data-minus]").forEach(function (button) {
      button.addEventListener("click", function () {
        changeQty(button.dataset.minus, -1);
      });
    });

    document.querySelectorAll("[data-plus]").forEach(function (button) {
      button.addEventListener("click", function () {
        changeQty(button.dataset.plus, 1);
      });
    });

    document.querySelectorAll("[data-remove]").forEach(function (button) {
      button.addEventListener("click", function () {
        removeItem(button.dataset.remove);
      });
    });

    const clear = document.getElementById("zcasClearCart");
    if (clear) {
      clear.addEventListener("click", function () {
        saveCart([]);
        renderCart();
      });
    }
  }

  function injectStyles() {
    if (document.getElementById("zcasCartV2Styles")) return;

    const style = document.createElement("style");
    style.id = "zcasCartV2Styles";
    style.textContent = `
      .zcas-cart-count {
        position: absolute;
        top: -8px;
        right: -8px;
        width: 22px;
        height: 22px;
        border-radius: 999px;
        background: #5D4037;
        color: #fff;
        font-size: 0.75rem;
        font-weight: 900;
        align-items: center;
        justify-content: center;
      }

      .zcas-toast {
        position: fixed;
        left: 50%;
        bottom: 24px;
        transform: translateX(-50%);
        background: #5D4037;
        color: white;
        padding: 0.9rem 1.25rem;
        border-radius: 999px;
        box-shadow: 0 14px 34px rgba(0,0,0,0.18);
        z-index: 99999;
        font-family: "Quicksand", sans-serif;
        font-weight: 900;
      }

      .zcas-add-cart-btn,
      .zcas-cart-main-btn,
      .zcas-whatsapp-btn {
        border: none;
        border-radius: 999px;
        padding: 0.9rem 1.25rem;
        background: linear-gradient(135deg, #FF6B9D, #FFDAB9);
        color: white;
        font-family: "Quicksand", sans-serif;
        font-weight: 900;
        cursor: pointer;
        text-align: center;
        text-decoration: none;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        transition: 0.25s ease;
      }

      .zcas-add-cart-btn:hover,
      .zcas-cart-main-btn:hover,
      .zcas-whatsapp-btn:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 28px rgba(255, 107, 157, 0.25);
      }

      .zcas-cart-shell {
        max-width: 1150px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 1.2fr 0.8fr;
        gap: 2rem;
      }

      .zcas-cart-list,
      .zcas-cart-summary,
      .zcas-empty-cart {
        background: white;
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
        font-weight: 800;
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
        border: none;
        border-radius: 999px;
        background: white;
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
        font-weight: 900;
        cursor: pointer;
      }

      .zcas-summary-line {
        display: flex;
        justify-content: space-between;
        padding: 1rem 0;
        border-bottom: 1px solid rgba(255, 107, 157, 0.16);
        font-weight: 900;
      }

      .zcas-summary-line.total {
        color: #FF6B9D;
        font-size: 1.3rem;
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
        }

        .zcas-cart-row {
          grid-template-columns: 1fr;
          align-items: start;
        }
      }
    `;

    document.head.appendChild(style);
  }

  
/* ZCAS hard Add to Cart click blocker */
document.addEventListener("click", function (event) {
  const clicked = event.target.closest("a, button");
  if (!clicked) return;

  const label = (clicked.textContent || "").toLowerCase().trim();
  const href = clicked.getAttribute("href") || "";

  const isAddToCart =
    label.includes("add to cart") ||
    label.includes("cart");

  const isWhatsApp =
    href.toLowerCase().includes("wa.me") ||
    href.toLowerCase().includes("whatsapp") ||
    href.toLowerCase().includes("api.whatsapp.com");

  const card = clicked.closest(".product-card, .menu-card, .treat-card, .item-card, .card");

  if (card && (isAddToCart || isWhatsApp)) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const product = findProductFromText(card.textContent);

    if (product) {
      addToCart(product);
    } else {
      toast("Item added to cart");
    }

    return false;
  }
}, true);
/* End ZCAS hard Add to Cart click blocker */

  window.ZCASCart = {
    getCart: getCart,
    saveCart: saveCart,
    addToCart: addToCart,
    renderCart: renderCart
  };

  document.addEventListener("DOMContentLoaded", function () {
    injectStyles();
    enhanceMenuCards();
    updateCartBadges();
    renderCart();
  });
})();


