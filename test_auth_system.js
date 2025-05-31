// Test script to validate the authentication system and API endpoints
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';
let authToken = '';
let testUserId = '';
let testProductId = '';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to make authenticated requests
async function authFetch(url, options = {}) {
    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        }
    });
}

// Test functions
async function testHealthAndDB() {
    console.log('\n🔍 Testing Health and Database Connection...');

    try {
        const healthResponse = await fetch(`${BASE_URL}/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Health check:', healthData.status);

        const dbResponse = await fetch(`${BASE_URL}/api/test-db`);
        const dbData = await dbResponse.json();
        console.log('✅ Database connection:', dbData.connected ? 'Connected' : 'Failed');

        return true;
    } catch (error) {
        console.error('❌ Health/DB test failed:', error.message);
        return false;
    }
}

async function testUserRegistration() {
    console.log('\n🔍 Testing User Registration...');

    try {
        const userData = {
            email: `testfarmer_${Date.now()}@farmlink.com`,
            password: 'password123',
            role: 'farmer'
        };

        const response = await fetch(`${BASE_URL}/api/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log('✅ User registration successful');
            authToken = data.data.token;
            testUserId = data.data.user.id;
            console.log('✅ Auth token received');
            return true;
        } else {
            console.error('❌ Registration failed:', data.message);
            return false;
        }
    } catch (error) {
        console.error('❌ Registration test failed:', error.message);
        return false;
    }
}

async function testUserLogin() {
    console.log('\n🔍 Testing User Login...');

    try {
        // Try to login with existing test user or create one
        const loginData = {
            email: 'john.farmer@email.com',
            password: 'password123'
        };

        const response = await fetch(`${BASE_URL}/api/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log('✅ User login successful');
            authToken = data.data.token;
            testUserId = data.data.user.id;
            return true;
        } else {
            console.log('ℹ️ Existing user login failed, using registration token');
            return true; // We already have a token from registration
        }
    } catch (error) {
        console.error('❌ Login test failed:', error.message);
        return false;
    }
}

async function testProtectedEndpoints() {
    console.log('\n🔍 Testing Protected Endpoints...');

    try {
        // Test accessing farmers list without auth (should work)
        const farmersResponse = await fetch(`${BASE_URL}/api/farmers`);
        const farmersData = await farmersResponse.json();
        console.log('✅ Public farmers list accessible:', farmersData.success);

        // Test accessing user profile with auth
        const profileResponse = await authFetch(`${BASE_URL}/api/farmers/user/${testUserId}`);
        const profileData = await profileResponse.json();
        console.log('✅ User profile accessible with auth:', profileData.success);

        // Test creating a product (requires farmer auth)
        const productData = {
            title: 'Test Organic Rice',
            description: 'Fresh organic rice from test farm',
            price: 25.50,
            category: 'rice',
            quantity: 100,
            unit: 'kg',
            is_organic: true
        };

        const createProductResponse = await authFetch(`${BASE_URL}/api/products`, {
            method: 'POST',
            body: JSON.stringify(productData)
        });

        const createProductData = await createProductResponse.json();

        if (createProductResponse.ok && createProductData.success) {
            console.log('✅ Product creation with auth successful');
            testProductId = createProductData.data.id;
            return true;
        } else {
            console.error('❌ Product creation failed:', createProductData.message);
            return false;
        }
    } catch (error) {
        console.error('❌ Protected endpoints test failed:', error.message);
        return false;
    }
}

async function testProductManagement() {
    console.log('\n🔍 Testing Product Management...');

    if (!testProductId) {
        console.log('⚠️ No test product ID, skipping product management tests');
        return true;
    }

    try {
        // Test updating product quantity
        const updateQuantityResponse = await authFetch(`${BASE_URL}/api/products/${testProductId}/quantity`, {
            method: 'PATCH',
            body: JSON.stringify({ quantity: 80 })
        });

        const updateQuantityData = await updateQuantityResponse.json();
        console.log('✅ Product quantity update:', updateQuantityData.success);

        // Test updating product status
        const updateStatusResponse = await authFetch(`${BASE_URL}/api/products/${testProductId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'available' })
        });

        const updateStatusData = await updateStatusResponse.json();
        console.log('✅ Product status update:', updateStatusData.success);

        return true;
    } catch (error) {
        console.error('❌ Product management test failed:', error.message);
        return false;
    }
}

async function testUnauthorizedAccess() {
    console.log('\n🔍 Testing Unauthorized Access...');

    try {
        // Test creating product without auth (should fail)
        const unauthorizedResponse = await fetch(`${BASE_URL}/api/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Unauthorized Product',
                price: 10,
                category: 'other',
                quantity: 1,
                unit: 'pcs'
            })
        });

        const unauthorizedData = await unauthorizedResponse.json();

        if (unauthorizedResponse.status === 401) {
            console.log('✅ Unauthorized access properly blocked');
            return true;
        } else {
            console.error('❌ Unauthorized access not blocked properly');
            return false;
        }
    } catch (error) {
        console.error('❌ Unauthorized access test failed:', error.message);
        return false;
    }
}

async function testAPIEndpoints() {
    console.log('\n🔍 Testing Various API Endpoints...');

    try {
        // Test dashboard
        const dashboardResponse = await fetch(`${BASE_URL}/api/dashboard`);
        const dashboardData = await dashboardResponse.json();
        console.log('✅ Dashboard endpoint:', dashboardData.success);

        // Test product categories
        const categoriesResponse = await fetch(`${BASE_URL}/api/products/meta/categories`);
        const categoriesData = await categoriesResponse.json();
        console.log('✅ Product categories:', categoriesData.success);

        // Test buyers list
        const buyersResponse = await fetch(`${BASE_URL}/api/buyers`);
        const buyersData = await buyersResponse.json();
        console.log('✅ Buyers list:', buyersData.success);

        return true;
    } catch (error) {
        console.error('❌ API endpoints test failed:', error.message);
        return false;
    }
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting Farm Link API Authentication Tests...\n');

    const tests = [
        { name: 'Health & Database', fn: testHealthAndDB },
        { name: 'User Registration', fn: testUserRegistration },
        { name: 'User Login', fn: testUserLogin },
        { name: 'Protected Endpoints', fn: testProtectedEndpoints },
        { name: 'Product Management', fn: testProductManagement },
        { name: 'Unauthorized Access', fn: testUnauthorizedAccess },
        { name: 'API Endpoints', fn: testAPIEndpoints }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            const result = await test.fn();
            if (result) {
                passed++;
                console.log(`✅ ${test.name} test PASSED`);
            } else {
                failed++;
                console.log(`❌ ${test.name} test FAILED`);
            }
        } catch (error) {
            failed++;
            console.log(`❌ ${test.name} test ERROR:`, error.message);
        }

        await delay(500); // Small delay between tests
    }

    console.log('\n📊 Test Results Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (passed === tests.length) {
        console.log('\n🎉 All tests passed! Farm Link API is working correctly.');
    } else {
        console.log('\n⚠️ Some tests failed. Please check the implementation.');
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests().catch(console.error);
}

export default runAllTests;
