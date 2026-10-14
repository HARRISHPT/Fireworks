import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { categoryColors, categoryOrder, products } from './data/products'
import { allNavItems, businessConfig } from './data/siteConfig'

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const formatMoney = (value) => {
  if (value === null || value === undefined) {
    return 'Price on Request'
  }

  return currencyFormatter.format(Number(value))
}

const buildWhatsAppMessage = (product, quantity) => {
  const lines = [
    `Business: ${businessConfig.name}`,
    `Location: ${businessConfig.location}`,
    `Serial No.: ${product.serialNumber}`,
    `Product: ${product.productName}`,
    `Category: ${product.category}`,
    `Packaging: ${product.packaging}`,
    `Original listed price: ${product.originalPrice === null ? 'Price on Request' : formatMoney(product.originalPrice)}`,
    `Final price: ${product.finalPrice === null ? 'Price on Request' : formatMoney(product.finalPrice)}`,
  ]

  if (quantity > 0) {
    lines.push(`Requested quantity: ${quantity}`)
  }

  return lines.join('\n')
}

const buildCartWhatsAppMessage = (items) => {
  const lines = [
    `Business: ${businessConfig.name}`,
    `Location: ${businessConfig.location}`,
    'Customer order request',
  ]

  let total = 0

  items.forEach((item) => {
    const unitPrice = item.unitPrice
    const lineTotal = unitPrice === null ? 0 : unitPrice * item.quantity
    total += lineTotal
    lines.push(
      `${item.productName} (S.No. ${item.productId}, ${item.packaging}) x ${item.quantity} = ${unitPrice === null ? 'Price on Request' : formatMoney(lineTotal)}`,
    )
  })

  lines.push(`Estimated total: ${total > 0 ? formatMoney(total) : 'Please confirm with the business'}`)

  return lines.join('\n')
}

const getWhatsAppUrl = (product, quantity) => {
  const url = new URL(`https://wa.me/${businessConfig.whatsappNumber}`)
  url.searchParams.set('text', buildWhatsAppMessage(product, quantity))
  return url.toString()
}

const getCartWhatsAppUrl = (items) => {
  const url = new URL(`https://wa.me/${businessConfig.whatsappNumber}`)
  url.searchParams.set('text', buildCartWhatsAppMessage(items))
  return url.toString()
}

const productById = new Map(products.map((product) => [product.serialNumber, product]))

const getVariantId = (product) => String(product.packaging || 'standard')

const getCartItemKey = (productId, variantId) => `${productId}:${variantId}`

const createCartItem = (product, quantity = 1) => ({
  productId: product.serialNumber,
  variantId: getVariantId(product),
  productName: product.productName,
  unitPrice: product.finalPrice,
  quantity,
  category: product.category,
  packaging: product.packaging,
})

const getValidQuantity = (value) => {
  if (typeof value === 'string' && !/^\d+$/.test(value.trim())) return null

  const quantity = Number(value)
  return Number.isSafeInteger(quantity) && quantity >= 1 ? quantity : null
}

const loadStoredCart = () => {
  if (typeof window === 'undefined') return []

  try {
    const saved = window.localStorage.getItem('harrish-cart')
    const storedItems = saved ? JSON.parse(saved) : []
    if (!Array.isArray(storedItems)) return []

    return storedItems.reduce((cartItems, item) => {
      if (!item || typeof item !== 'object') return cartItems

      const productId = Number(item.productId ?? item.serialNumber)
      const product = productById.get(productId)
      const variantId = String(item.variantId ?? (product ? getVariantId(product) : ''))
      const quantity = getValidQuantity(item.quantity)

      if (!product || variantId !== getVariantId(product) || quantity === null) {
        return cartItems
      }

      const itemKey = getCartItemKey(productId, variantId)
      const existingItem = cartItems.find((cartItem) => getCartItemKey(cartItem.productId, cartItem.variantId) === itemKey)

      if (existingItem) {
        const combinedQuantity = existingItem.quantity + quantity
        if (Number.isSafeInteger(combinedQuantity)) existingItem.quantity = combinedQuantity
      } else {
        cartItems.push(createCartItem(product, quantity))
      }

      return cartItems
    }, [])
  } catch {
    return []
  }
}

function App() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark'

    try {
      return window.localStorage.getItem('harrish-theme') || 'dark'
    } catch {
      return 'dark'
    }
  })
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [priceFilter, setPriceFilter] = useState('All')
  const [sortBy, setSortBy] = useState('category-asc')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [addedFeedback, setAddedFeedback] = useState(null)
  const [cart, setCart] = useState(loadStoredCart)

  useEffect(() => {
    try {
      window.localStorage.setItem('harrish-cart', JSON.stringify(cart))
    } catch {
      return
    }
  }, [cart])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      window.localStorage.setItem('harrish-theme', theme)
    } catch {
      return
    }
  }, [theme])

  useEffect(() => {
    if (!isCartOpen) return undefined

    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsCartOpen(false)
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isCartOpen])

  useEffect(() => {
    const viewport = window.visualViewport
    let frame = 0

    const keepFocusedControlVisible = () => {
      frame = 0
      const activeElement = document.activeElement
      if (!(activeElement instanceof HTMLElement) || !activeElement.matches('input, select, textarea')) return

      const visibleTop = viewport?.offsetTop ?? 0
      const visibleBottom = visibleTop + (viewport?.height ?? window.innerHeight)
      const bounds = activeElement.getBoundingClientRect()
      const margin = 16
      const scrollDelta = bounds.top < visibleTop + margin
        ? bounds.top - visibleTop - margin
        : bounds.bottom > visibleBottom - margin
          ? bounds.bottom - visibleBottom + margin
          : 0

      if (scrollDelta !== 0) {
        activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }

    const scheduleVisibilityCheck = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(keepFocusedControlVisible)
    }

    document.addEventListener('focusin', scheduleVisibilityCheck)
    viewport?.addEventListener('resize', scheduleVisibilityCheck)
    window.addEventListener('resize', scheduleVisibilityCheck)

    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('focusin', scheduleVisibilityCheck)
      viewport?.removeEventListener('resize', scheduleVisibilityCheck)
      window.removeEventListener('resize', scheduleVisibilityCheck)
    }
  }, [])

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    const nextProducts = products.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        product.productName.toLowerCase().includes(normalizedQuery) ||
        String(product.serialNumber).includes(normalizedQuery)

      const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter

      const matchesPrice = (() => {
        if (priceFilter === 'All') return true
        const originalPrice = product.originalPrice ?? 0

        if (priceFilter === 'under-1000') return originalPrice < 1000
        if (priceFilter === '1000-5000') return originalPrice >= 1000 && originalPrice <= 5000
        if (priceFilter === 'above-5000') return originalPrice > 5000
        if (priceFilter === 'request') return product.originalPrice === null

        return true
      })()

      return matchesQuery && matchesCategory && matchesPrice
    })

    return [...nextProducts].sort((a, b) => {
      const byId = () => a.serialNumber - b.serialNumber
      const byName = () => a.productName.localeCompare(b.productName) || byId()

      switch (sortBy) {
        case 'price-asc':
        case 'price-desc': {
          if (a.finalPrice === null || b.finalPrice === null) {
            if (a.finalPrice === b.finalPrice) return byName()
            return a.finalPrice === null ? 1 : -1
          }
          const difference = a.finalPrice - b.finalPrice
          return (sortBy === 'price-desc' ? -difference : difference) || byName()
        }
        case 'name-asc':
          return byName()
        case 'name-desc':
          return b.productName.localeCompare(a.productName) || byId()
        case 'category-asc':
        default:
          return a.category.localeCompare(b.category) || byName()
      }
    })
  }, [query, categoryFilter, priceFilter, sortBy])

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const cartItemCount = cart.length
  const cartSubtotal = cart.reduce((total, item) => {
    const unitPrice = productById.get(item.productId)?.finalPrice
    return unitPrice === null || unitPrice === undefined ? total : total + unitPrice * item.quantity
  }, 0)

  const clearFilters = () => {
    setQuery('')
    setCategoryFilter('All')
    setPriceFilter('All')
    setSortBy('category-asc')
  }

  const updateCartItem = (product, value) => {
    const quantity = getValidQuantity(value)
    if (quantity === null) return

    const itemKey = getCartItemKey(product.serialNumber, getVariantId(product))
    setCart((previousCart) => previousCart.map((item) => (
      getCartItemKey(item.productId, item.variantId) === itemKey ? { ...item, quantity } : item
    )))
  }

  const addToCart = (product) => {
    const itemKey = getCartItemKey(product.serialNumber, getVariantId(product))
    const feedbackId = `${product.serialNumber}-${Date.now()}`

    setCart((previousCart) => {
      const existing = previousCart.find((item) => getCartItemKey(item.productId, item.variantId) === itemKey)

      if (existing) {
        if (existing.quantity >= Number.MAX_SAFE_INTEGER) return previousCart
        return previousCart.map((item) => (
          getCartItemKey(item.productId, item.variantId) === itemKey
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ))
      }

      return [...previousCart, createCartItem(product)]
    })

    setAddedFeedback({ itemKey, id: feedbackId })
    window.setTimeout(() => {
      setAddedFeedback((current) => (current?.id === feedbackId ? null : current))
    }, 1400)
  }

  const adjustCartItem = (product, difference) => {
    const itemKey = getCartItemKey(product.serialNumber, getVariantId(product))
    setCart((previousCart) => previousCart.map((item) => {
      if (getCartItemKey(item.productId, item.variantId) !== itemKey) return item
      const quantity = item.quantity + difference
      return quantity >= 1 && Number.isSafeInteger(quantity) ? { ...item, quantity } : item
    }))
  }

  const removeFromCart = (itemToRemove) => {
    const itemKey = getCartItemKey(itemToRemove.productId, itemToRemove.variantId)
    setCart((previousCart) => previousCart.filter((item) => (
      getCartItemKey(item.productId, item.variantId) !== itemKey
    )))
  }

  const checkoutCart = () => {
    if (cart.length === 0) {
      return
    }

    const currentItems = cart.flatMap((item) => {
      const product = productById.get(item.productId)
      return product && getVariantId(product) === item.variantId
        ? [createCartItem(product, item.quantity)]
        : []
    })

    if (currentItems.length > 0) {
      window.open(getCartWhatsAppUrl(currentItems), '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className={`page-shell ${theme === 'light' ? 'theme-light' : 'theme-dark'}`}>
      <header className="topbar">
        <div className="container topbar-inner">
          <a href="#home" className="brand-mark" aria-label="P.T. Harrish Pyrotech Agencies home">
            <span className="brand-icon">P.T.</span>
            <span className="brand-text">
              <strong>P.T. Harrish</strong>
              <small>Pyrotech Agencies</small>
            </span>
          </a>

          <nav
            id="primary-navigation"
            className={isMobileMenuOpen ? 'main-nav is-open' : 'main-nav'}
            aria-label="Primary"
          >
            {allNavItems.map((item) => (
              <a key={item.label} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                {item.label}
              </a>
            ))}
            <a
              className="mobile-nav-contact"
              href={businessConfig.whatsappUrl}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp Enquiry
            </a>
          </nav>

          <div className="header-actions">
            <button
              type="button"
              className="mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="primary-navigation"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                {isMobileMenuOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>

            <button
              type="button"
              className="theme-toggle"
              onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
              aria-label="Toggle light and dark mode"
            >
              {theme === 'dark' ? '☀ Light' : '☾ Dark'}
            </button>

            <a
              className="whatsapp-button"
              href={businessConfig.whatsappUrl}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp Enquiry
            </a>
          </div>
        </div>
      </header>

      <main>
        <section id="home" className="hero-section">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Sivakasi • Since 2011</p>
              <h1>Sivakasi Crackers Price List 2026</h1>
              <h2>P.T. Harrish Pyrotech Agencies</h2>
              <p className="hero-tagline">
                Looking for a cracker shop in Sivakasi? Browse the fireworks price list and enquire about retail or wholesale availability.
              </p>
              <p className="hero-description">
                Discover a curated selection of flower pots, fancy fountains, rockets, sparklers, sound crackers, and seasonal combo packs built for Diwali, weddings, temple functions, and unforgettable celebrations.
              </p>

              <div className="hero-actions">
                <a href="#catalogue" className="primary-button">
                  Explore Products
                </a>
                <a href="#contact" className="secondary-button">
                  Bulk Order Enquiry
                </a>
              </div>

              <div className="hero-stats" aria-label="Business highlights">
                <div>
                  <strong>2011</strong>
                  <span>Trusted since</span>
                </div>
                <div>
                  <strong>Wholesale</strong>
                  <span>&amp; Retail</span>
                </div>
                <div>
                  <strong>24/7</strong>
                  <span>Enquiry support</span>
                </div>
              </div>
            </div>

            <div className="hero-visual" aria-label="Fireworks display">
              <div className="hero-card">
                <span className="status-pill">2026 Price List</span>
                <h3>Festival-ready pricing</h3>
                <ul>
                  <li>Flower pots</li>
                  <li>Ground chakkars</li>
                  <li>Fancy fountains</li>
                  <li>Sound crackers</li>
                  <li>Rockets &amp; sparklers</li>
                </ul>
                <a href="#catalogue">View product catalogue</a>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="about-section">
          <div className="container about-grid">
            <div className="about-visual">
              <img
                src="https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80"
                alt="Colourful fireworks celebration with lights and festive energy"
              />
            </div>

            <div className="about-copy">
              <p className="eyebrow">About us</p>
              <h2>Bright celebrations, dependable supply, and trusted service.</h2>
              <p>
                P.T. Harrish Pyrotech Agencies proudly serves customers from Sivakasi with a wide range of premium fireworks for family functions, festival celebrations, weddings, temple events, retail sales, and bulk requirements. We focus on quality, timely support, and easy ordering for both individual shoppers and large-volume buyers.
              </p>
              <div className="info-points">
                <span>Wholesale &amp; retail</span>
                <span>Pan-India enquiries</span>
                <span>Festival-ready packing</span>
              </div>
            </div>
          </div>
        </section>

        <section id="catalogue" className="catalogue-section">
          <div className="container">
            <div className="section-header">
              <div>
                <p className="eyebrow">Official source list</p>
                <h2>2026 Fireworks catalogue</h2>
              </div>
              <p className="section-note">
                Curated from the supplied Sivakasi price list with transparent pricing and source-aligned product details. Any item without a listed rate remains marked as price on request.
              </p>
            </div>

            <div className="cart-summary-bar">
              <div>
                <span className="cart-count">{cartCount}</span>
                <span>{cartCount === 1 ? 'unit' : 'units'} in {cartItemCount} {cartItemCount === 1 ? 'product' : 'products'}</span>
              </div>
              <div>
                <strong>{formatMoney(cartSubtotal)}</strong>
                <span>selected total</span>
              </div>
              <button type="button" className="primary-button" onClick={checkoutCart} disabled={cart.length === 0}>
                Buy Now
              </button>
            </div>

            <div className="catalogue-controls" aria-label="Catalogue controls">
              <label className="search-field">
                <span>Search</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by product or serial"
                  aria-label="Search products by name or serial number"
                />
              </label>

              <div className="filter-group" aria-label="Category filters">
                <button
                  type="button"
                  className={categoryFilter === 'All' ? 'chip active' : 'chip'}
                  onClick={() => setCategoryFilter('All')}
                >
                  All
                </button>
                {categoryOrder.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={categoryFilter === category ? 'chip active' : 'chip'}
                    style={{ borderColor: categoryColors[category] }}
                    onClick={() => setCategoryFilter(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="table-controls-row">
                <label>
                  <span>Price range</span>
                  <select value={priceFilter} onChange={(event) => setPriceFilter(event.target.value)}>
                    <option value="All">All prices</option>
                    <option value="under-1000">Under ₹1,000</option>
                    <option value="1000-5000">₹1,000 – ₹5,000</option>
                    <option value="above-5000">Above ₹5,000</option>
                    <option value="request">Price on request</option>
                  </select>
                </label>

                <label className="sort-control">
                  <span className="sort-control-label">
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d="M4 5h16l-6.5 7.2V19l-3 1v-7.8L4 5Z" />
                    </svg>
                    Filter and sort
                  </span>
                  <select aria-label="Sort products" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                    <option value="category-asc">▤ Category: A–Z</option>
                    <option value="price-asc">↓ Price: Low to High</option>
                    <option value="price-desc">↑ Price: High to Low</option>
                    <option value="name-asc">A→Z Name: A–Z</option>
                    <option value="name-desc">Z→A Name: Z–A</option>
                  </select>
                </label>

                <button type="button" className="clear-filters" onClick={clearFilters}>
                  Clear filters
                </button>
              </div>
            </div>

            <div className="catalogue-results" aria-live="polite">
              {filteredProducts.length} matching products
            </div>

            {filteredProducts.length === 0 ? (
              <div className="empty-state">
                No products match your current filters. Try another search term or clear all filters.
              </div>
            ) : (
              <div
                className="table-wrapper"
                role="region"
                aria-label="Fireworks product list"
              >
                <table>
                  <thead>
                    <tr>
                      <th>S.No.</th>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Packaging / Unit</th>
                      <th>Price Details</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const itemKey = getCartItemKey(product.serialNumber, getVariantId(product))
                      const cartItem = cart.find((item) => getCartItemKey(item.productId, item.variantId) === itemKey)
                      const subtotal = cartItem && product.finalPrice !== null
                        ? Number(product.finalPrice) * cartItem.quantity
                        : null

                      return (
                        <tr key={product.serialNumber} data-product-id={product.serialNumber}>
                          <td data-label="S.No.">{product.serialNumber}</td>
                          <td data-label="Product Name">
                            <div className="product-name-cell">
                              <span
                                className="product-accent"
                                style={{ background: categoryColors[product.category] }}
                                aria-hidden="true"
                              ></span>
                              {product.productName}
                            </div>
                          </td>
                          <td data-label="Category">
                            <span
                              className="category-badge"
                              style={{
                                background: `${categoryColors[product.category]}22`,
                                borderColor: categoryColors[product.category],
                              }}
                            >
                              {product.category}
                            </span>
                          </td>
                          <td data-label="Packaging / Unit">{product.packaging}</td>
                          <td data-label="Price Details" className="price-cell">
                            {product.finalPrice === null ? (
                              <strong>Price on Request</strong>
                            ) : (
                              <>
                                <span className="original-price">MRP {formatMoney(product.originalPrice)}</span>
                                <span>{product.discountPercentage}% off ({formatMoney(product.discountAmount)})</span>
                                <strong>{formatMoney(product.finalPrice)}</strong>
                              </>
                            )}
                          </td>
                          <td data-label="Order" className="action-cell">
                            <label className="qty-control">
                              <span>Qty</span>
                              {cartItem ? (
                                <div className="quantity-stepper">
                                  <button
                                    type="button"
                                    className="quantity-stepper-button"
                                    onClick={() => adjustCartItem(product, -1)}
                                    disabled={cartItem.quantity <= 1}
                                    aria-label={`Decrease ${product.productName} quantity`}
                                  >
                                    −
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    inputMode="numeric"
                                    value={cartItem.quantity}
                                    onChange={(event) => updateCartItem(product, event.target.value)}
                                    aria-label={`Quantity for ${product.productName}`}
                                  />
                                  <button
                                    type="button"
                                    className="quantity-stepper-button"
                                    onClick={() => addToCart(product)}
                                    aria-label={`Increase ${product.productName} quantity`}
                                  >
                                    +
                                  </button>
                                </div>
                              ) : <span className="not-in-cart">Not in cart</span>}
                            </label>
                            <div className="action-buttons">
                              <button
                                type="button"
                                className="enquire-button"
                                onClick={() => window.open(getWhatsAppUrl(product, quantity), '_blank', 'noopener,noreferrer')}
                              >
                                Enquire
                              </button>
                              <button
                                type="button"
                                key={addedFeedback?.itemKey === itemKey ? addedFeedback.id : 'idle'}
                                className={addedFeedback?.itemKey === itemKey ? 'cart-button is-added' : 'cart-button'}
                                onClick={() => addToCart(product)}
                                aria-label={`Add ${product.productName} to cart`}
                              >
                                {addedFeedback?.itemKey === itemKey ? 'Added' : cartItem ? 'Add another' : 'Add to cart'}
                              </button>
                            </div>
                            {cartItem && (
                              <small>
                                Sub-total: {subtotal === null ? 'Price on Request' : formatMoney(subtotal)}
                              </small>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section id="gift-boxes" className="gift-section">
          <div className="container">
            <div className="section-header narrow">
              <div>
                <p className="eyebrow">Gift boxes</p>
                <h2>Assorted cracker packs and combo enquiries</h2>
              </div>
            </div>
            <p className="gift-copy">
              Discover festive mix packs and combo selections designed for family celebrations, wedding events, temple festivals, and premium gifting occasions. We can tailor quantities and pricing around your event requirements.
            </p>
            <div className="gift-grid">
              {[
                'Family Diwali assortment',
                'Wedding celebration mix',
                'Temple festival box',
                'Corporate gifting enquiry',
              ].map((item) => (
                <article key={item} className="gift-card">
                  <div className="gift-image gift-1" aria-hidden="true"></div>
                  <div className="gift-body">
                    <h3>{item}</h3>
                    <p>
                      Ask for the best combination of products, festive packaging, and volume-based pricing for your special occasion.
                    </p>
                    <button type="button" className="secondary-button">Request Quote</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="bulk-orders" className="bulk-section">
          <div className="container bulk-grid">
            <div>
              <p className="eyebrow">Bulk orders</p>
              <h2>Wholesale support for retailers and event planners.</h2>
            </div>
            <div className="bulk-cards">
              <div>
                <h3>Retailers</h3>
                <p>Bulk stocking support for retail counters, festive demand spikes, and seasonal order planning.</p>
              </div>
              <div>
                <h3>Event organizers</h3>
                <p>Curated assortments for weddings, temple events, community functions, and family celebrations.</p>
              </div>
              <div>
                <h3>Corporate gifting</h3>
                <p>Festive gifting solutions with adaptable quantities, packaging options, and custom recommendations.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="why-us-section">
          <div className="container">
            <div className="section-header narrow">
              <div>
                <p className="eyebrow">Why choose us</p>
                <h2>Thoughtful service for every celebration.</h2>
              </div>
            </div>
            <div className="why-grid">
              {[
                'Safe and careful packing',
                'Transparent pricing',
                'Festival-ready dispatch support',
                'Wholesale and retail enquiries',
                'Reliable service for Tamil Nadu and beyond',
                'Seasonal order planning throughout the year',
              ].map((item) => (
                <div key={item} className="why-card">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="faq-section" aria-labelledby="faq-title">
          <div className="container">
            <div className="section-header narrow">
              <div>
                <p className="eyebrow">Customer questions</p>
                <h2 id="faq-title">Sivakasi crackers: common questions</h2>
              </div>
            </div>
            <div className="faq-list">
              <details>
                <summary>Where can I find the Sivakasi crackers price list for 2026?</summary>
                <p>Browse the 2026 catalogue on this page for listed products, pack details, and prices. Items without a listed rate are marked price on request.</p>
              </details>
              <details>
                <summary>Can I enquire about wholesale crackers in Sivakasi?</summary>
                <p>Yes. Retailers and bulk buyers can send their product list and required quantities through WhatsApp to ask about current availability and wholesale pricing.</p>
              </details>
              <details>
                <summary>How do I confirm cracker prices and stock?</summary>
                <p>Prices and availability can change by season. Send the product names or serial numbers through WhatsApp and confirm the latest details with P.T. Harrish Pyrotech Agencies before placing an order.</p>
              </details>
              <details>
                <summary>Where is this Sivakasi fireworks shop located?</summary>
                <p>P.T. Harrish Pyrotech Agencies is located at 9QMG+8CC, Madathupatti, Sivakasi, Tamil Nadu 626128. Contact the team to confirm fulfilment options for your location.</p>
              </details>
              <details>
                <summary>How do I choose the best cracker shop in Tamil Nadu?</summary>
                <p>Compare current price lists, product and pack details, business contact information, and stock confirmation. P.T. Harrish Pyrotech Agencies publishes its Sivakasi address and accepts WhatsApp enquiries for listed products.</p>
              </details>
            </div>
          </div>
        </section>

        <section id="contact" className="contact-section">
          <div className="container contact-grid">
            <div className="contact-copy">
              <p className="eyebrow">Contact</p>
              <h2>Speak with our team today.</h2>
              <div className="contact-list">
                <div>
                  <span>Business</span>
                  <strong>{businessConfig.name}</strong>
                </div>
                <div>
                  <span>Location</span>
                  <a href="https://www.google.com/maps/search/?api=1&query=9QMG+8CC+Madathupatti+Sivakasi+Tamil+Nadu+626128" target="_blank" rel="noreferrer">
                    {businessConfig.location}
                  </a>
                </div>
                <div>
                  <span>Phone</span>
                  <a href={`tel:${businessConfig.phone}`}>{businessConfig.phoneDisplay}</a>
                </div>
                <div>
                  <span>Email</span>
                  <a href={`mailto:${businessConfig.email}`}>{businessConfig.email}</a>
                </div>
                <div>
                  <span>WhatsApp</span>
                  <a href={businessConfig.whatsappUrl} target="_blank" rel="noreferrer">
                    {businessConfig.phoneDisplay}
                  </a>
                </div>
              </div>
            </div>

            <div className="contact-card">
              <h3>Bulk enquiry</h3>
              <p>
                Get pricing, product availability, gift-box suggestions, and festive quantity guidance for your next order.
              </p>
              <a href={businessConfig.whatsappUrl} className="primary-button" target="_blank" rel="noreferrer">
                Enquire on WhatsApp
              </a>
              <small>Need a custom combo pack or high-volume supply? Share your event details and quantity and we will respond quickly.</small>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <h3>P.T. Harrish Pyrotech Agencies</h3>
            <p>9QMG+8CC, Madathupatti, Sivakasi, Tamil Nadu 626128</p>
          </div>

          <div>
            <h4>Quick links</h4>
            <ul>
              {allNavItems.map((item) => (
                <li key={item.label}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4>Business</h4>
            <ul>
              <li><a href="#about">About</a></li>
              <li><a href="#catalogue">Products</a></li>
              <li><a href="#gift-boxes">Gift Boxes</a></li>
            </ul>
          </div>
        </div>

        <div className="container footer-bottom">
          <p>Copyright © 2026 P.T. Harrish Pyrotech Agencies</p>
        </div>
      </footer>

      <button
        type="button"
        className="floating-cart-button"
        onClick={() => setIsCartOpen(true)}
        aria-label={`Open cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
        aria-expanded={isCartOpen}
        aria-controls="shopping-cart-drawer"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M3 4h2l2.2 10.1a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6" />
          <circle cx="10" cy="20" r="1.2" />
          <circle cx="18" cy="20" r="1.2" />
        </svg>
        <span className="floating-cart-count" aria-hidden="true">{cartCount > 99 ? '99+' : cartCount}</span>
      </button>

      {isCartOpen && (
        <div className="cart-backdrop" onClick={() => setIsCartOpen(false)}>
          <aside
            id="shopping-cart-drawer"
            className="cart-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-drawer-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="cart-drawer-header">
              <div>
                <p className="eyebrow">Your selection</p>
                <h2 id="cart-drawer-title">Shopping cart</h2>
              </div>
              <button type="button" className="cart-close-button" onClick={() => setIsCartOpen(false)} aria-label="Close cart">
                ×
              </button>
            </div>

            {cart.length === 0 ? (
              <p className="cart-empty-state">Your cart is empty. Add products from the catalogue to get started.</p>
            ) : (
              <>
                <ul className="cart-drawer-items">
                  {cart.map((item) => (
                    <li key={getCartItemKey(item.productId, item.variantId)} className="cart-drawer-item">
                      <div className="cart-item-heading">
                        <div>
                          <strong>{item.productName}</strong>
                          <span>S.No. {item.productId} · {item.packaging}</span>
                        </div>
                        <button
                          type="button"
                          className="remove-cart-item"
                          onClick={() => removeFromCart(item)}
                          aria-label={`Remove ${item.productName} from cart`}
                        >
                          Remove
                        </button>
                      </div>
                      <div className="cart-item-footer">
                        <div className="cart-quantity-control">
                          <span>Qty</span>
                          <div className="quantity-stepper">
                            <button
                              type="button"
                              className="quantity-stepper-button"
                              onClick={() => adjustCartItem(productById.get(item.productId), -1)}
                              disabled={item.quantity <= 1}
                              aria-label={`Decrease ${item.productName} quantity`}
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              inputMode="numeric"
                              value={item.quantity}
                              onChange={(event) => updateCartItem(productById.get(item.productId), event.target.value)}
                              aria-label={`Quantity for ${item.productName}`}
                            />
                            <button
                              type="button"
                              className="quantity-stepper-button"
                              onClick={() => adjustCartItem(productById.get(item.productId), 1)}
                              aria-label={`Increase ${item.productName} quantity`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <strong>
                          {productById.get(item.productId)?.finalPrice == null
                            ? 'Price on Request'
                            : formatMoney(productById.get(item.productId).finalPrice * item.quantity)}
                        </strong>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="cart-drawer-total">
                  <span>Estimated total</span>
                  <strong>{formatMoney(cartSubtotal)}</strong>
                </div>
                <button type="button" className="primary-button cart-checkout-button" onClick={checkoutCart}>
                  Continue on WhatsApp
                </button>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}

export default App
