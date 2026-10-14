import { expect, test } from '@playwright/test'
import { products } from '../src/data/products.js'

const viewportMatrix = [
  [320, 568],
  [360, 640],
  [375, 667],
  [390, 844],
  [414, 896],
  [430, 932],
  [568, 320],
  [568, 844],
  [600, 960],
  [768, 1024],
  [820, 1180],
  [900, 700],
  [1023, 768],
  [1024, 768],
  [1280, 800],
  [1366, 768],
  [1440, 900],
  [1920, 1080],
  [2560, 1440],
]

const captureErrors = (page) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  return errors
}

test('responsive layout contains overflow and product rows fit without horizontal scrolling', async ({ page }) => {
  const errors = captureErrors(page)
  await page.goto('/')
  await expect(page.locator('tbody tr')).toHaveCount(100)

  for (const [width, height] of viewportMatrix) {
    await page.setViewportSize({ width, height })
    const metrics = await page.evaluate(() => {
      const root = document.documentElement
      const wrapper = document.querySelector('.table-wrapper')
      const table = document.querySelector('table')
      const headerCells = [...table.querySelectorAll('thead th')]
      const dataCells = [...table.querySelector('tbody tr').children]

      return {
        pageWidth: root.scrollWidth,
        clientWidth: root.clientWidth,
        wrapperWidth: wrapper.clientWidth,
        wrapperScrollWidth: wrapper.scrollWidth,
        headerVisible: getComputedStyle(table.querySelector('thead')).display !== 'none',
        rowDisplay: getComputedStyle(table.querySelector('tbody tr')).display,
        headersAligned: getComputedStyle(table.querySelector('tbody tr')).display === 'grid' || headerCells.every(
          (cell, index) => Math.abs(cell.getBoundingClientRect().left - dataCells[index].getBoundingClientRect().left) < 1,
        ),
        productCount: table.querySelectorAll('tbody tr').length,
      }
    })

    expect(metrics.pageWidth, `document overflow at ${width}x${height}`).toBeLessThanOrEqual(metrics.clientWidth + 1)
    expect(metrics.headerVisible, `table header hidden at ${width}x${height}`).toBe(true)
    expect(metrics.rowDisplay, `product rows should match the responsive layout at ${width}x${height}`).toBe(width < 1200 ? 'grid' : 'table-row')
    expect(metrics.headersAligned, `table columns misaligned at ${width}x${height}`).toBe(true)
    expect(metrics.productCount).toBe(100)

    expect(metrics.wrapperScrollWidth, `product list should not scroll horizontally at ${width}x${height}`).toBeLessThanOrEqual(metrics.wrapperWidth + 1)
    expect(metrics.rowDisplay, `product rows should use cards below desktop width at ${width}x${height}`).toBe(width < 1200 ? 'grid' : 'table-row')
    if (width < 1200) {
      await expect(page.locator('tbody tr').first().locator('td')).toHaveCount(6)
      await expect(page.locator('tbody tr').first().getByRole('button', { name: /Add .* to cart/ })).toBeVisible()
    }
  }

  expect(errors).toEqual([])
})

test('mobile navigation, search, filters, and FAQs remain usable', async ({ page }) => {
  const errors = captureErrors(page)
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('/')

  const menuButton = page.getByRole('button', { name: 'Open navigation menu' })
  await menuButton.click()
  await expect(page.getByRole('button', { name: 'Close navigation menu' })).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('.main-nav.is-open')).toBeVisible()
  await expect(page.locator('.main-nav.is-open .mobile-nav-contact')).toBeVisible()
  const menuLinkHeights = await page.locator('.main-nav.is-open a').evaluateAll((links) =>
    links.map((link) => link.getBoundingClientRect().height),
  )
  expect(menuLinkHeights.every((height) => height >= 44)).toBe(true)

  await page.locator('.main-nav.is-open').getByRole('link', { name: 'Products', exact: true }).click()
  await expect(page).toHaveURL(/#catalogue$/)
  await expect(page.locator('.main-nav.is-open')).toHaveCount(0)

  const search = page.getByRole('searchbox', { name: 'Search products by name or serial number' })
  await search.fill('FLOWERPOT SMALL')
  await expect(page.locator('.catalogue-results')).toHaveText('1 matching products')

  await search.fill('no-product-matches-this')
  await expect(page.locator('.empty-state')).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await page.getByLabel('Price range').selectOption('request')
  await expect(page.locator('.catalogue-results')).not.toHaveText('0 matching products')
  await expect(page.locator('tbody tr').first()).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await page.getByRole('combobox', { name: 'Sort products' }).selectOption('name-desc')
  await expect(page.getByRole('combobox', { name: 'Sort products' })).toHaveValue('name-desc')

  const firstFaq = page.locator('.faq-list details').first()
  await firstFaq.locator('summary').click()
  await expect(firstFaq).toHaveAttribute('open', '')
  expect(errors).toEqual([])
})

test('sort dropdown orders categories, prices, and names deterministically', async ({ page }) => {
  await page.goto('/#catalogue')
  const sortControl = page.getByRole('combobox', { name: 'Sort products' })
  const nameAscending = (a, b) => a.productName.localeCompare(b.productName) || a.serialNumber - b.serialNumber
  const sortCases = [
    ['category-asc', (a, b) => a.category.localeCompare(b.category) || nameAscending(a, b)],
    ['price-asc', (a, b) => {
      if (a.finalPrice === null || b.finalPrice === null) {
        if (a.finalPrice === b.finalPrice) return nameAscending(a, b)
        return a.finalPrice === null ? 1 : -1
      }
      return (a.finalPrice - b.finalPrice) || nameAscending(a, b)
    }],
    ['price-desc', (a, b) => {
      if (a.finalPrice === null || b.finalPrice === null) {
        if (a.finalPrice === b.finalPrice) return nameAscending(a, b)
        return a.finalPrice === null ? 1 : -1
      }
      return (b.finalPrice - a.finalPrice) || nameAscending(a, b)
    }],
    ['name-asc', nameAscending],
    ['name-desc', (a, b) => b.productName.localeCompare(a.productName) || a.serialNumber - b.serialNumber],
  ]

  await expect(sortControl.locator('option[value="category-asc"]')).toContainText('▤')
  for (const [value, compare] of sortCases) {
    await sortControl.selectOption(value)
    await expect(sortControl).toHaveValue(value)
    const renderedIds = await page.locator('tbody tr').evaluateAll((rows) => rows.map((row) => Number(row.dataset.productId)))
    expect(renderedIds).toEqual([...products].sort(compare).map((product) => product.serialNumber))
  }
})

test('catalogue controls stay visible and avoid mobile input zoom', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('/#catalogue')

  const controls = [
    page.getByRole('searchbox', { name: 'Search products by name or serial number' }),
    page.getByLabel('Price range'),
    page.getByRole('combobox', { name: 'Sort products' }),
  ]

  for (const control of controls) {
    await control.focus()
    await expect.poll(async () => control.evaluate((element) => {
      const bounds = element.getBoundingClientRect()
      const viewportTop = window.visualViewport?.offsetTop ?? 0
      const viewportBottom = viewportTop + (window.visualViewport?.height ?? window.innerHeight)
      return bounds.top >= viewportTop && bounds.bottom <= viewportBottom
    })).toBe(true)
    const metrics = await control.evaluate((element) => {
      const bounds = element.getBoundingClientRect()
      return {
        top: bounds.top,
        bottom: bounds.bottom,
        viewportHeight: window.visualViewport?.height ?? window.innerHeight,
        fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
      }
    })
    expect(metrics.top).toBeGreaterThanOrEqual(0)
    expect(metrics.bottom).toBeLessThanOrEqual(metrics.viewportHeight)
    expect(metrics.fontSize).toBeGreaterThanOrEqual(16)
  }
})

test('floating cart stays pinned to the bottom-right across viewports and interactions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    localStorage.setItem('harrish-cart', JSON.stringify([{ serialNumber: 1, quantity: 1 }]))
  })
  await page.goto('/')

  const cartButton = page.locator('.floating-cart-button')
  const getCartPosition = () => cartButton.evaluate((element) => {
    const bounds = element.getBoundingClientRect()
    const styles = getComputedStyle(element)
    return {
      position: styles.position,
      right: Math.round(document.documentElement.clientWidth - bounds.right),
      bottom: Math.round(window.innerHeight - bounds.bottom),
      left: Math.round(bounds.left),
      top: Math.round(bounds.top),
    }
  })
  const viewports = [
    [320, 568],
    [375, 667],
    [390, 844],
    [568, 320],
    [768, 1024],
    [1024, 768],
    [1440, 900],
  ]

  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height })
    const initialPosition = await getCartPosition()

    expect(initialPosition.position, `cart should be fixed at ${width}x${height}`).toBe('fixed')
    expect(initialPosition.right, `cart right gap at ${width}x${height}`).toBe(16)
    expect(initialPosition.bottom, `cart bottom gap at ${width}x${height}`).toBe(16)

    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
    const scrolledPosition = await getCartPosition()
    expect(scrolledPosition).toEqual(initialPosition)

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    expect(await getCartPosition()).toEqual(initialPosition)
  }

  await page.setViewportSize({ width: 390, height: 844 })
  const initialPosition = await getCartPosition()
  await page.getByRole('button', { name: 'Open navigation menu' }).click()
  expect(await getCartPosition()).toEqual(initialPosition)
  await page.getByRole('button', { name: 'Close navigation menu' }).click()

  await page.getByRole('searchbox', { name: 'Search products by name or serial number' }).fill('FLOWERPOT')
  expect(await getCartPosition()).toEqual(initialPosition)
  await cartButton.click()
  expect(await getCartPosition()).toEqual(initialPosition)
})

test('cart quantities stay synchronized through edit, remove, and WhatsApp checkout', async ({ page }) => {
  const errors = captureErrors(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#catalogue')

  const productRow = page.locator('tr[data-product-id="1"]')
  const addProductButton = productRow.getByRole('button', { name: 'Add FLOWERPOT SMALL to cart' })
  await addProductButton.click()
  await addProductButton.click()
  const productQuantity = productRow.getByRole('spinbutton', { name: 'Quantity for FLOWERPOT SMALL' })
  await expect(productQuantity).toHaveValue('2')
  await expect(page.locator('.cart-count')).toHaveText('2')
  await expect(page.locator('.cart-summary-bar .cart-count')).toHaveText('2')
  await expect(page.locator('.cart-summary-bar .cart-count + span')).toHaveText('units in 1 product')
  await expect(page.locator('.cart-summary-bar strong')).toHaveText('₹100.00')

  await productQuantity.fill('4')
  await expect(productQuantity).toHaveValue('4')
  await expect(page.locator('.cart-count')).toHaveText('4')
  await expect(page.locator('.cart-summary-bar strong')).toHaveText('₹200.00')
  await productQuantity.fill('2.5')
  await expect(productQuantity).toHaveValue('4')
  await productQuantity.fill('-2')
  await expect(productQuantity).toHaveValue('4')

  await productRow.getByRole('button', { name: 'Decrease FLOWERPOT SMALL quantity' }).click()
  await expect(productQuantity).toHaveValue('3')
  await productRow.getByRole('button', { name: 'Increase FLOWERPOT SMALL quantity' }).click()
  await expect(productQuantity).toHaveValue('4')

  const secondProductRow = page.locator('tr[data-product-id="2"]')
  await secondProductRow.getByRole('button', { name: 'Add FLOWERPOT BIG to cart' }).click()
  await expect(page.locator('.cart-count')).toHaveText('5')
  await expect(page.locator('.cart-summary-bar .cart-count + span')).toHaveText('units in 2 products')
  await expect(page.locator('.cart-summary-bar strong')).toHaveText('₹260.00')

  const requestPriceRow = page.locator('tr[data-product-id="22"]')
  await requestPriceRow.getByRole('button', { name: 'Add 6 DELUX HULK/SPIDER/TIGER to cart' }).click()
  await expect(page.locator('.cart-count')).toHaveText('6')
  await expect(page.locator('.cart-summary-bar strong')).toHaveText('₹260.00')

  await page.getByRole('button', { name: /Open cart/ }).click()
  const drawer = page.getByRole('dialog', { name: 'Shopping cart' })
  await expect(drawer).toBeVisible()
  const drawerQuantity = drawer.getByLabel('Quantity for FLOWERPOT SMALL')
  await drawerQuantity.fill('6')
  await expect(page.locator('.cart-count')).toHaveText('8')
  await expect(productQuantity).toHaveValue('6')
  await expect(page.locator('.cart-summary-bar strong')).toHaveText('₹360.00')

  await drawer.getByRole('button', { name: 'Remove FLOWERPOT SMALL from cart' }).click()
  await expect(page.locator('.cart-count')).toHaveText('2')
  await expect(page.locator('.cart-summary-bar strong')).toHaveText('₹60.00')
  await drawer.getByRole('button', { name: 'Remove FLOWERPOT BIG from cart' }).click()
  await expect(page.locator('.cart-count')).toHaveText('1')
  await expect(page.locator('.cart-summary-bar .cart-count + span')).toHaveText('unit in 1 product')
  await expect(page.locator('.cart-summary-bar strong')).toHaveText('₹0.00')
  await drawer.getByRole('button', { name: 'Remove 6 DELUX HULK/SPIDER/TIGER from cart' }).click()
  await expect(page.locator('.cart-count')).toHaveText('0')
  await expect(drawer).toContainText('Your cart is empty')
  await drawer.getByRole('button', { name: 'Close cart' }).click()

  await addProductButton.click()
  await addProductButton.click()
  await expect(productRow.getByRole('spinbutton', { name: 'Quantity for FLOWERPOT SMALL' })).toHaveValue('2')
  await page.reload()
  await expect(productRow.getByRole('spinbutton', { name: 'Quantity for FLOWERPOT SMALL' })).toHaveValue('2')
  await page.getByRole('button', { name: /Open cart/ }).click()
  await page.context().route('https://wa.me/**', (route) => route.fulfill({ status: 200, body: 'WhatsApp checkout test' }))
  const popupPromise = page.waitForEvent('popup')
  await page.getByRole('button', { name: 'Continue on WhatsApp' }).click()
  const popup = await popupPromise
  await expect.poll(() => popup.url()).toContain('https://wa.me/919047744459')
  expect(new URL(popup.url()).searchParams.get('text')).toContain('FLOWERPOT SMALL')
  expect(new URL(popup.url()).searchParams.get('text')).toContain('x 2')
  await popup.close()

  expect(errors).toEqual([])
})

test('cart restoration trusts catalogue data instead of browser storage fields', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('harrish-cart', JSON.stringify([
      {
        productId: 1,
        variantId: '1 BOX',
        quantity: 2,
        unitPrice: 0.01,
        serialNumber: 1,
        productName: '<img src=x onerror=alert(1)>',
        category: 'Injected category',
        packaging: 'Fake pack',
      },
      { serialNumber: 1, quantity: 1, finalPrice: 0.02 },
      { productId: 1, variantId: '1 BOX', quantity: Number.MAX_SAFE_INTEGER },
      { serialNumber: 999, productName: 'Unknown product', quantity: 5, finalPrice: 0 },
      { serialNumber: 2, productName: 'Overflow', quantity: 1e100, finalPrice: 0 },
    ]))
  })

  await page.goto('/#catalogue')
  await expect(page.locator('.cart-count')).toHaveText('3')
  await expect(page.locator('.cart-summary-bar .cart-count + span')).toHaveText('units in 1 product')
  await expect(page.locator('.cart-summary-bar strong')).toHaveText('₹150.00')

  await page.getByRole('button', { name: /Open cart/ }).click()
  const drawer = page.getByRole('dialog', { name: 'Shopping cart' })
  await expect(drawer.locator('.cart-drawer-item')).toHaveCount(1)
  await expect(drawer).toContainText('FLOWERPOT SMALL')
  await expect(drawer).not.toContainText('Injected category')
  await expect(drawer.locator('img')).toHaveCount(0)
  await expect(drawer.getByLabel('Quantity for FLOWERPOT SMALL')).toHaveValue('3')
})
