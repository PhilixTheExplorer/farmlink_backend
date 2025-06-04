import SeedManager from './seedManager.js';

/**
 * CLI for seeding database with SQL files only
 */
async function runSeedCli() {
    const args = process.argv.slice(2);
    const command = args[0] || 'help';

    // Parse options from command line arguments
    const options = {
        farmers: !args.includes('--no-farmers'),
        buyers: !args.includes('--no-buyers'),
        products: !args.includes('--no-products'),
        cartItems: !args.includes('--no-cart-items'),
        orders: !args.includes('--no-orders'),
        finalUpdates: !args.includes('--no-final-updates')
    };

    // Display a warning in production
    if (process.env.NODE_ENV === 'production') {
        console.warn('⚠️  WARNING: You are running the seed tool in PRODUCTION mode!');
        console.warn('This is generally not recommended as it may insert test data into your production database.');
        console.warn('Are you sure you want to continue? (y/N)');

        const response = await new Promise(resolve => {
            process.stdin.once('data', data => {
                resolve(data.toString().trim().toLowerCase());
            });
        });

        if (response !== 'y') {
            console.log('Operation cancelled.');
            process.exit(0);
        }
    }

    try {
        switch (command) {
            case 'seed':
                console.log('🌱 Seeding database with SQL seed files...');
                console.log(`Options: ${Object.entries(options).filter(([k, v]) => v).map(([k]) => k).join(', ')}`);

                const seedResult = await SeedManager.seedAll(options);

                if (seedResult.success) {
                    console.log(`\n✅ Seeding completed successfully!`);
                    console.log(`📊 Summary:`);
                    console.log(`  - Users: ${seedResult.summary.usersCreated}`);
                    console.log(`  - Farmers: ${seedResult.summary.farmersCreated}`);
                    console.log(`  - Buyers: ${seedResult.summary.buyersCreated}`);
                    console.log(`  - Products: ${seedResult.summary.productsCreated}`);
                    console.log(`  - Cart Items: ${seedResult.summary.cartItemsCreated}`);
                    console.log(`  - Orders: ${seedResult.summary.ordersCreated}`);
                    console.log(`  - Files executed: ${seedResult.executedFiles.join(', ')}`);

                    if (seedResult.summary.totalErrors > 0) {
                        console.warn(`⚠️  ${seedResult.summary.totalErrors} errors occurred during seeding.`);
                    }
                } else {
                    console.error('❌ Seeding failed!');
                    if (seedResult.errors.length > 0) {
                        console.error('Errors:');
                        seedResult.errors.forEach(error => {
                            console.error(`  - ${error.file || 'General'}: ${error.error}`);
                        });
                    }
                    process.exit(1);
                }
                break;

            case 'cleanup':
                console.log('🧹 Cleaning up seed data from database...');
                const cleanupOptions = {
                    farmers: !args.includes('--no-farmers'),
                    buyers: !args.includes('--no-buyers')
                };

                const cleanupResult = await SeedManager.cleanupSeedData(cleanupOptions);

                if (cleanupResult.success) {
                    console.log(`✅ ${cleanupResult.data.deletedCount} seed records removed.`);
                } else {
                    console.error(`❌ Error cleaning up seed data: ${cleanupResult.error}`);
                    process.exit(1);
                }
                break;

            case 'help':
            default:
                console.log(`
Farm Link SQL Seed CLI
=====================

This tool manages database seeding using SQL files only.
JavaScript seed files have been integrated into SQL files and removed.

Commands:
  seed              Seed the database with SQL seed files
  cleanup           Remove seed data from the database
  help              Show this help message

Options:
  --no-farmers      Skip farmer data
  --no-buyers       Skip buyer data
  --no-products     Skip product data
  --no-cart-items   Skip cart items
  --no-orders       Skip orders
  --no-final-updates Skip final updates

Examples:
  node seedCli.js seed
  node seedCli.js seed --no-buyers --no-cart-items
  node seedCli.js cleanup
  node seedCli.js cleanup --no-farmers

Environment Variables:
  DATABASE_URL      PostgreSQL connection string
  SUPABASE_DB_URL   Alternative database connection string

Note: Make sure to set DATABASE_URL or SUPABASE_DB_URL environment variable
before running the seed commands.
                `);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }

    process.exit(0);
}

// Run the CLI
runSeedCli();
