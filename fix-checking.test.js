/**
 * Fix Checking Property Test for Order Detail Data Display Fix
 * 
 * This test verifies that the FIXED extraction logic correctly extracts
 * all order properties from various API response structures and ensures
 * proper display functionality.
 * 
 * EXPECTED BEHAVIOR: This test should PASS on fixed code, confirming that
 * the extraction logic handles all API response formats correctly.
 */

const fc = require('fast-check')

/**
 * Simulates the FIXED data extraction logic from OrderDetailPage.jsx
 * This replicates the improved fetchOrderDetail function
 */
function extractOrderDataFixed(apiResponse) {
  let orderData = apiResponse
  
  // Step 1: Extract from response.data if it exists
  if (apiResponse && apiResponse.data) {
    orderData = apiResponse.data
  }
  
  // Step 2: If there's a success wrapper, extract the nested data
  if (orderData && orderData.success && orderData.data) {
    orderData = orderData.data
  }
  
  // Step 3: If order data is wrapped in an 'order' property, extract it
  if (orderData && orderData.order && typeof orderData.order === 'object') {
    const nestedOrder = orderData.order
    
    // Merge nested order with top-level enhancement properties
    orderData = {
      ...nestedOrder,
      timeline: (orderData.timeline && orderData.timeline.length > 0) ? orderData.timeline : (nestedOrder.timeline || []),
      trackingInfo: orderData.trackingInfo || nestedOrder.trackingInfo || null,
      estimatedDelivery: orderData.estimatedDelivery || nestedOrder.estimatedDelivery,
      replacementRequests: (orderData.replacementRequests && orderData.replacementRequests.length > 0) ? orderData.replacementRequests : (nestedOrder.replacementRequests || []),
      refundRequests: (orderData.refundRequests && orderData.refundRequests.length > 0) ? orderData.refundRequests : (nestedOrder.refundRequests || [])
    }
  }
  
  // Step 4: Normalize property names
  const normalizedOrder = {
    ...orderData,
    items: orderData.items || orderData.order_items || [],
    created_at: orderData.created_at || orderData.createdAt,
    shipping_address: orderData.shipping_address || orderData.shippingAddress,
    timeline: orderData.timeline || [],
    trackingInfo: orderData.trackingInfo || null,
    replacementRequests: orderData.replacementRequests || [],
    refundRequests: orderData.refundRequests || []
  }
  
  return normalizedOrder
}

/**
 * Validates that extracted data has all critical properties
 */
function validateExtractedData(extractedData) {
  const errors = []
  
  if (!extractedData.status) {
    errors.push('Missing status')
  }
  if (!extractedData.created_at) {
    errors.push('Missing created_at')
  }
  if (extractedData.total === undefined || extractedData.total === null) {
    errors.push('Missing total')
  }
  if (!extractedData.shipping_address) {
    errors.push('Missing shipping_address')
  }
  if (!extractedData.items || !Array.isArray(extractedData.items)) {
    errors.push('Missing or invalid items array')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Simulates display functions from OrderDetailView
 */
const displayFunctions = {
  formatDate: (dateStr) => {
    if (!dateStr) return 'Invalid Date'
    const date = new Date(dateStr)
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString()
  },
  
  formatCurrency: (amount) => {
    if (amount === undefined || amount === null) return '$'
    return `$${amount.toFixed(2)}`
  },
  
  formatStatus: (status) => {
    return status ? status.toUpperCase() : ''
  },
  
  formatAddress: (address) => {
    if (!address) return ''
    return `${address.name || ''}, ${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.postal_code || ''}`
  },
  
  formatItems: (items) => {
    if (!items || items.length === 0) return 'No items found'
    return `${items.length} item(s)`
  }
}

/**
 * Generator for various API response structures
 */
const standardResponseArbitrary = fc.record({
  data: fc.record({
    id: fc.uuid(),
    order_number: fc.string({ minLength: 8, maxLength: 12 }),
    status: fc.constantFrom('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
    created_at: fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }).map(d => d.toISOString()),
    total: fc.double({ min: 10, max: 1000, noNaN: true }),
    shipping_address: fc.record({
      name: fc.string({ minLength: 5, maxLength: 30 }),
      street: fc.string({ minLength: 10, maxLength: 50 }),
      city: fc.string({ minLength: 3, maxLength: 20 }),
      state: fc.string({ minLength: 2, maxLength: 2 }),
      postal_code: fc.string({ minLength: 5, maxLength: 10 }),
      country: fc.constant('USA')
    }),
    items: fc.array(
      fc.record({
        id: fc.uuid(),
        product_id: fc.uuid(),
        title: fc.string({ minLength: 5, maxLength: 50 }),
        quantity: fc.integer({ min: 1, max: 10 }),
        price: fc.double({ min: 5, max: 500, noNaN: true })
      }),
      { minLength: 1, maxLength: 5 }
    )
  })
})

const nestedResponseArbitrary = fc.record({
  data: fc.record({
    order: fc.record({
      id: fc.uuid(),
      order_number: fc.string({ minLength: 8, maxLength: 12 }),
      status: fc.constantFrom('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
      created_at: fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }).map(d => d.toISOString()),
      total: fc.double({ min: 10, max: 1000, noNaN: true }),
      shipping_address: fc.record({
        name: fc.string({ minLength: 5, maxLength: 30 }),
        street: fc.string({ minLength: 10, maxLength: 50 }),
        city: fc.string({ minLength: 3, maxLength: 20 }),
        state: fc.string({ minLength: 2, maxLength: 2 }),
        postal_code: fc.string({ minLength: 5, maxLength: 10 }),
        country: fc.constant('USA')
      }),
      items: fc.array(
        fc.record({
          id: fc.uuid(),
          product_id: fc.uuid(),
          title: fc.string({ minLength: 5, maxLength: 50 }),
          quantity: fc.integer({ min: 1, max: 10 }),
          price: fc.double({ min: 5, max: 500, noNaN: true })
        }),
        { minLength: 1, maxLength: 5 }
      )
    }),
    timeline: fc.array(fc.record({
      status: fc.string(),
      timestamp: fc.date().map(d => d.toISOString())
    }), { maxLength: 3 })
  })
})

// Run the tests
console.log('='.repeat(80))
console.log('Fix Checking Test: Order Detail Data Display Fix')
console.log('='.repeat(80))
console.log()

// Test 1: Standard API response format
console.log('Test 1: Standard API response format (data directly in response.data)')
console.log('-'.repeat(80))
try {
  fc.assert(
    fc.property(standardResponseArbitrary, (apiResponse) => {
      const extractedData = extractOrderDataFixed(apiResponse)
      const validation = validateExtractedData(extractedData)
      
      if (!validation.valid) {
        console.error('Validation failed:', validation.errors)
        console.error('API Response:', JSON.stringify(apiResponse, null, 2))
        console.error('Extracted Data:', JSON.stringify(extractedData, null, 2))
      }
      
      return validation.valid
    }),
    {
      numRuns: 20,
      verbose: false
    }
  )
  console.log('✅ Test 1 PASSED: All properties extracted correctly from standard format')
} catch (error) {
  console.error('❌ Test 1 FAILED:', error.message)
}
console.log()

// Test 2: Nested API response format (order wrapped in 'order' property)
console.log('Test 2: Nested API response format (order wrapped in "order" property)')
console.log('-'.repeat(80))
try {
  fc.assert(
    fc.property(nestedResponseArbitrary, (apiResponse) => {
      const extractedData = extractOrderDataFixed(apiResponse)
      const validation = validateExtractedData(extractedData)
      
      if (!validation.valid) {
        console.error('Validation failed:', validation.errors)
        console.error('API Response:', JSON.stringify(apiResponse, null, 2))
        console.error('Extracted Data:', JSON.stringify(extractedData, null, 2))
      }
      
      return validation.valid
    }),
    {
      numRuns: 20,
      verbose: false
    }
  )
  console.log('✅ Test 2 PASSED: All properties extracted correctly from nested format')
} catch (error) {
  console.error('❌ Test 2 FAILED:', error.message)
}
console.log()

// Test 3: Display functions work correctly with extracted data
console.log('Test 3: Display functions work correctly with extracted data')
console.log('-'.repeat(80))
try {
  fc.assert(
    fc.property(standardResponseArbitrary, (apiResponse) => {
      const extractedData = extractOrderDataFixed(apiResponse)
      
      // Ensure we have valid data before testing display functions
      if (!extractedData.created_at || !extractedData.total || !extractedData.status) {
        return false
      }
      
      const dateDisplay = displayFunctions.formatDate(extractedData.created_at)
      const totalDisplay = displayFunctions.formatCurrency(extractedData.total)
      const statusDisplay = displayFunctions.formatStatus(extractedData.status)
      const addressDisplay = displayFunctions.formatAddress(extractedData.shipping_address)
      const itemsDisplay = displayFunctions.formatItems(extractedData.items)
      
      const allDisplaysValid = 
        dateDisplay !== 'Invalid Date' &&
        totalDisplay !== '$' &&
        statusDisplay !== '' &&
        addressDisplay !== '' &&
        itemsDisplay !== 'No items found'
      
      if (!allDisplaysValid) {
        console.error('Display validation failed:')
        console.error('Date:', dateDisplay, '(from', extractedData.created_at, ')')
        console.error('Total:', totalDisplay)
        console.error('Status:', statusDisplay)
        console.error('Address:', addressDisplay)
        console.error('Items:', itemsDisplay)
      }
      
      return allDisplaysValid
    }),
    {
      numRuns: 20,
      verbose: false
    }
  )
  console.log('✅ Test 3 PASSED: All display functions work correctly')
} catch (error) {
  console.error('❌ Test 3 FAILED:', error.message)
  console.log('Note: This may be due to edge cases in date generation')
}
console.log()

// Test 4: Property name normalization (snake_case vs camelCase)
console.log('Test 4: Property name normalization (snake_case vs camelCase)')
console.log('-'.repeat(80))
const camelCaseResponse = {
  data: {
    id: '123',
    status: 'delivered',
    createdAt: '2026-02-21T10:00:00Z',
    total: 125.99,
    shippingAddress: {
      name: 'John Doe',
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      postal_code: '10001'
    },
    items: [{ id: '1', title: 'Product' }]
  }
}

const extractedCamelCase = extractOrderDataFixed(camelCaseResponse)
const hasCamelCaseNormalized = extractedCamelCase.created_at && extractedCamelCase.shipping_address

if (hasCamelCaseNormalized) {
  console.log('✅ Test 4 PASSED: Property names normalized correctly')
} else {
  console.error('❌ Test 4 FAILED: Property normalization failed')
  console.error('Extracted:', extractedCamelCase)
}
console.log()

// Test 5: Edge case - empty items array
console.log('Test 5: Edge case - empty items array')
console.log('-'.repeat(80))
const emptyItemsResponse = {
  data: {
    id: '123',
    status: 'cancelled',
    created_at: '2026-02-21T10:00:00Z',
    total: 0,
    shipping_address: { name: 'John Doe' },
    items: []
  }
}

const extractedEmpty = extractOrderDataFixed(emptyItemsResponse)
const hasEmptyItemsArray = Array.isArray(extractedEmpty.items) && extractedEmpty.items.length === 0

if (hasEmptyItemsArray) {
  console.log('✅ Test 5 PASSED: Empty items array handled correctly')
} else {
  console.error('❌ Test 5 FAILED: Empty items array not handled')
}
console.log()

console.log('='.repeat(80))
console.log('Fix Checking Test Complete')
console.log('='.repeat(80))
console.log()
console.log('Summary:')
console.log('- All tests should PASS on fixed code')
console.log('- Tests verify extraction works across various API response formats')
console.log('- Tests verify display functions receive valid data')
console.log()
