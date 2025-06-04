# Database Seed Files

This directory contains organized seed data files for the Farm Link database. All seed data has been consolidated into SQL files for better performance and reliability.

## File Structure

### SQL Seed Files

- **`users_seed.sql`** - Sample user accounts (farmers and buyers) integrated from JavaScript files
- **`farmer_profiles_seed.sql`** - Farmer-specific profile information
- **`buyer_profiles_seed.sql`** - Buyer-specific profile information
- **`products_seed.sql`** - Product catalog with items from all farmers (integrated from JavaScript)
- **`cart_items_seed.sql`** - Sample cart items for testing
- **`orders_seed.sql`** - Sample orders and order items
- **`final_updates_seed.sql`** - Statistics updates and calculated fields
- **`master_seed.sql`** - Master file that executes all seeds in correct order

### Management Files

- **`seedManager.js`** - SQL-only seed manager for programmatic operations
- **`seedCli.js`** - Command-line interface for seeding operations

## Data Integration

The JavaScript seed files (`farmers.js`, `buyers.js`, `products.js`) have been integrated into the SQL seed files and removed:

- **Farmer data** from `farmers.js` → `users_seed.sql` and `farmer_profiles_seed.sql`
- **Buyer data** from `buyers.js` → `users_seed.sql` and `buyer_profiles_seed.sql`
- **Product data** from `products.js` → `products_seed.sql`

This provides better performance, consistency, and easier maintenance.

## Usage

### Option 1: Execute All Seeds at Once (Recommended)

Use the master seed file to run all seeds in the correct order:

```bash
# Set your database connection string
export DATABASE_URL="postgresql://username:password@localhost:5432/farmlink"
# or for Supabase
export SUPABASE_DB_URL="postgresql://username:password@host:port/database"

# Execute all seeds
psql "$DATABASE_URL" -f master_seed.sql
```

### Option 2: Use the CLI Tool

```bash
# Seed everything
node seedCli.js seed

# Seed with specific options
node seedCli.js seed --no-cart-items --no-orders

# Clean up seed data
node seedCli.js cleanup

# Show help
node seedCli.js help
```

### Option 3: Execute Individual Seed Files

Run individual seed files in the correct order:

```bash
# 1. Users first (required for foreign keys)
psql "$DATABASE_URL" -f users_seed.sql

# 2. Farmer profiles
psql "$DATABASE_URL" -f farmer_profiles_seed.sql

# 3. Buyer profiles
psql "$DATABASE_URL" -f buyer_profiles_seed.sql

# 4. Products
psql "$DATABASE_URL" -f products_seed.sql

# 5. Cart items (optional)
psql "$DATABASE_URL" -f cart_items_seed.sql

# 6. Orders (optional)
psql "$DATABASE_URL" -f orders_seed.sql

# 7. Final updates
psql "$DATABASE_URL" -f final_updates_seed.sql
```

## Environment Variables

Make sure to set one of these environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_DB_URL` - Alternative database connection string

## CLI Options

The `seedCli.js` supports these options:

- `--no-farmers` - Skip farmer data
- `--no-buyers` - Skip buyer data
- `--no-products` - Skip product data
- `--no-cart-items` - Skip cart items
- `--no-orders` - Skip orders
- `--no-final-updates` - Skip final updates

## Sample Data Included

- **2 Thai farmers** (Philix Hein, Ame Siri) with farm profiles
- **3 Bangkok buyers** (Emma Johnson, Linky Linky, Alex Chen) with delivery addresses
- **8 products** from Thai farms (rice, vegetables, herbs, eggs, handmade items)
- **Additional products** from US farms for variety
- **Sample cart items and orders** for testing e-commerce functionality

## Notes

- All passwords in seed data use bcrypt hash for 'password123'
- UUIDs are consistent for easy testing and reference
- Products include both organic and non-organic items
- Some products are marked as out of stock for testing
- Order counts and statistics are realistic for demo purposes
  psql -d your_database_name -f products_seed.sql

# 5. Cart items

psql -d your_database_name -f cart_items_seed.sql

# 6. Orders

psql -d your_database_name -f orders_seed.sql

# 7. Final updates (must be last)

psql -d your_database_name -f final_updates_seed.sql

````

### Option 3: Use JavaScript Seeding (Existing Method)

Use the existing JavaScript-based seeding system:

```bash
# From the project root
node database/seed/seedCli.js --all
````

## Data Overview

### Users

- 5 farmer accounts
- 5 buyer accounts
- All accounts use password: `password123`
- Includes profile images and contact information

### Farmers

- Green Valley Organic Farm (vegetables & fruits)
- Santos Family Produce (lettuce & leafy greens)
- Johnson Rice Fields (rice varieties)
- Kim's Herb Garden (herbs & spices)
- Martinez Citrus Grove (citrus fruits)

### Products

- 17 total products across all categories
- Includes realistic pricing and inventory
- Product images from Unsplash
- Various units (kg, pcs, pack, bunch)

### Orders & Cart Items

- 3 completed sample orders
- 6 sample cart items
- Realistic order totals and delivery information

## Dependencies

The seed files must be executed in order due to foreign key constraints:

1. `users_seed.sql` - No dependencies
2. `farmer_profiles_seed.sql` - Depends on users
3. `buyer_profiles_seed.sql` - Depends on users
4. `products_seed.sql` - Depends on users (farmers)
5. `cart_items_seed.sql` - Depends on users and products
6. `orders_seed.sql` - Depends on users and products
7. `final_updates_seed.sql` - Depends on all previous data

## Notes

- All password hashes are bcrypt-encrypted versions of "password123"
- UUIDs are used consistently for all primary keys
- Sample data includes realistic California farming locations
- Statistics are calculated automatically by the final updates script
- The master seed file includes proper error handling and completion messages

## Customization

To customize the seed data:

1. Edit the individual SQL files to modify data
2. Maintain the same UUID structure for consistency
3. Ensure foreign key relationships remain valid
4. Run the final updates script to recalculate statistics
