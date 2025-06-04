# Farm Link API Testing Script
# Run this script to test all the major API endpoints

Write-Host "🚀 Farm Link API Testing Script" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green

$baseUrl = "http://localhost:3000/api"

# Test 1: Health Check
Write-Host "`n1. Testing Health Check..." -ForegroundColor Yellow
$response = curl -X GET "http://localhost:3000/health" 2>$null
Write-Host $response

# Test 2: Database Status
Write-Host "`n2. Testing Database Status..." -ForegroundColor Yellow
$response = curl -X GET "$baseUrl/test-db" 2>$null
Write-Host $response

# Test 3: Get All Products
Write-Host "`n3. Testing Get All Products..." -ForegroundColor Yellow
$response = curl -X GET "$baseUrl/products?limit=3" 2>$null
Write-Host $response

# Test 4: Get Product by ID
Write-Host "`n4. Testing Get Product by ID..." -ForegroundColor Yellow
$response = curl -X GET "$baseUrl/products/650e8400-e29b-41d4-a716-446655440017" 2>$null
Write-Host $response

# Test 5: Get Products by Category
Write-Host "`n5. Testing Get Products by Category..." -ForegroundColor Yellow
$response = curl -X GET "$baseUrl/products/category/fruits?limit=2" 2>$null
Write-Host $response

# Test 6: Get Product Categories
Write-Host "`n6. Testing Get Product Categories..." -ForegroundColor Yellow
$response = curl -X GET "$baseUrl/products/meta/categories" 2>$null
Write-Host $response

# Test 7: Get Product Units
Write-Host "`n7. Testing Get Product Units..." -ForegroundColor Yellow
$response = curl -X GET "$baseUrl/products/meta/units" 2>$null
Write-Host $response

# Test 8: Get Popular Products
Write-Host "`n8. Testing Get Popular Products..." -ForegroundColor Yellow
$response = curl -X GET "$baseUrl/products/featured/popular?limit=3" 2>$null
Write-Host $response

# Test 9: API Dashboard
Write-Host "`n9. Testing API Dashboard..." -ForegroundColor Yellow
$response = curl -X GET "$baseUrl/dashboard" 2>$null
Write-Host $response

Write-Host "`n✅ All tests completed!" -ForegroundColor Green
Write-Host "`n📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Register users: POST $baseUrl/users/register" -ForegroundColor White
Write-Host "2. Login users: POST $baseUrl/users/login" -ForegroundColor White
Write-Host "3. Test authenticated endpoints (products CRUD, cart operations)" -ForegroundColor White
Write-Host "`nFor authenticated endpoints, you'll need to:" -ForegroundColor Yellow
Write-Host "- Register a farmer account" -ForegroundColor White
Write-Host "- Register a buyer account" -ForegroundColor White
Write-Host "- Login to get JWT tokens" -ForegroundColor White
Write-Host "- Use the tokens in Authorization headers" -ForegroundColor White
