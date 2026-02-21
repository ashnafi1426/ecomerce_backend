/**
 * Run All Tests for Order Detail Data Display Fix
 * 
 * This script runs all three test suites in sequence:
 * 1. Bug Exploration Test (should pass on fixed code)
 * 2. Fix Checking Test (should pass on fixed code)
 * 3. Preservation Test (should pass on fixed code)
 */

const { execSync } = require('child_process')
const path = require('path')

console.log('='.repeat(80))
console.log('Running All Tests for Order Detail Data Display Fix')
console.log('='.repeat(80))
console.log()

const tests = [
  {
    name: 'Bug Exploration Test',
    file: 'bug-exploration.test.js',
    description: 'Verifies the bug condition and confirms extraction works'
  },
  {
    name: 'Fix Checking Test',
    file: 'fix-checking.test.js',
    description: 'Verifies extraction works across various API response formats'
  },
  {
    name: 'Preservation Test',
    file: 'preservation.test.js',
    description: 'Verifies all February 21, 2026 enhancements are preserved'
  }
]

let allPassed = true
const results = []

for (const test of tests) {
  console.log('='.repeat(80))
  console.log(`Running: ${test.name}`)
  console.log(`Description: ${test.description}`)
  console.log('='.repeat(80))
  console.log()
  
  try {
    execSync(`node ${test.file}`, {
      cwd: __dirname,
      stdio: 'inherit'
    })
    results.push({ name: test.name, status: 'PASSED' })
    console.log()
  } catch (error) {
    results.push({ name: test.name, status: 'FAILED' })
    allPassed = false
    console.error(`\n❌ ${test.name} FAILED\n`)
  }
}

console.log('='.repeat(80))
console.log('Test Results Summary')
console.log('='.repeat(80))
console.log()

results.forEach(result => {
  const icon = result.status === 'PASSED' ? '✅' : '❌'
  console.log(`${icon} ${result.name}: ${result.status}`)
})

console.log()
console.log('='.repeat(80))

if (allPassed) {
  console.log('✅ ALL TESTS PASSED')
  console.log()
  console.log('The fix is complete and verified:')
  console.log('- Data extraction works correctly across all API response formats')
  console.log('- Display functions receive valid data (no "Invalid Date" or "$" errors)')
  console.log('- All February 21, 2026 replacement/refund enhancements are preserved')
  console.log()
  console.log('Next step: Test in browser to verify UI displays correctly')
} else {
  console.log('❌ SOME TESTS FAILED')
  console.log()
  console.log('Please review the failed tests and fix any issues.')
}

console.log('='.repeat(80))
console.log()

process.exit(allPassed ? 0 : 1)
