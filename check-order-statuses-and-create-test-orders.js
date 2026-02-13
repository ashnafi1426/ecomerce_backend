/**
 * CHECK ORDER STATUSES AND CREATE TEST ORDERS
 * 
 * This script:
 * 1. Checks what order statuses exist in the database
 * 2. Creates test orders with different statuses
 * 3. Tests the frontend filtering
 */

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const bcrypt = require('bcrypt');

// Load environment variables
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const API_BASE = 'http://localhost:5000/api';

async function checkOrderStatusesAndCreateTestOrders() {
  try {
    console.log('🔍 Checking Order Statuses and Creating Test Orders...\n');

    // Step 1: Check 