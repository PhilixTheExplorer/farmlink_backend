import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Simplified SeedManager class for SQL-only seeding operations
 */
class SeedManager {
    /**
     * Execute all SQL seed files in the correct order
     * @param {Object} options - Seeding options
     * @param {boolean} options.farmers - Whether to seed farmers (default: true)
     * @param {boolean} options.buyers - Whether to seed buyers (default: true)
     * @param {boolean} options.products - Whether to seed products (default: true)
     * @param {boolean} options.cartItems - Whether to seed cart items (default: true)
     * @param {boolean} options.orders - Whether to seed orders (default: true)
     * @param {boolean} options.finalUpdates - Whether to run final updates (default: true)
     * @param {string} options.databaseUrl - Database connection URL (optional)
     * @returns {Object} Result of seeding operation
     */
    static async seedAll(options = {}) {
        const defaultOptions = {
            farmers: true,
            buyers: true,
            products: true,
            cartItems: true,
            orders: true,
            finalUpdates: true
        };

        const mergedOptions = { ...defaultOptions, ...options };

        console.log('🌱 Starting SQL-based database seeding...');

        const results = {
            success: true,
            errors: [],
            executedFiles: [],
            summary: {
                usersCreated: 0,
                farmersCreated: 0,
                buyersCreated: 0,
                productsCreated: 0,
                cartItemsCreated: 0,
                ordersCreated: 0,
                totalErrors: 0
            }
        };

        try {
            // Define the order of SQL files to execute
            const sqlFiles = [
                {
                    name: 'users_seed.sql',
                    enabled: mergedOptions.farmers || mergedOptions.buyers,
                    description: 'User accounts',
                    countField: 'usersCreated'
                },
                {
                    name: 'farmer_profiles_seed.sql',
                    enabled: mergedOptions.farmers,
                    description: 'Farmer profiles',
                    countField: 'farmersCreated'
                },
                {
                    name: 'buyer_profiles_seed.sql',
                    enabled: mergedOptions.buyers,
                    description: 'Buyer profiles',
                    countField: 'buyersCreated'
                },
                {
                    name: 'products_seed.sql',
                    enabled: mergedOptions.products,
                    description: 'Products',
                    countField: 'productsCreated'
                },
                {
                    name: 'cart_items_seed.sql',
                    enabled: mergedOptions.cartItems,
                    description: 'Cart items',
                    countField: 'cartItemsCreated'
                },
                {
                    name: 'orders_seed.sql',
                    enabled: mergedOptions.orders,
                    description: 'Orders',
                    countField: 'ordersCreated'
                },
                {
                    name: 'final_updates_seed.sql',
                    enabled: mergedOptions.finalUpdates,
                    description: 'Final updates',
                    countField: null
                }
            ];

            // Check if we can use master_seed.sql for all-at-once execution
            const masterSeedPath = join(__dirname, 'master_seed.sql');
            const allEnabled = sqlFiles.every(file => file.enabled);

            if (allEnabled) {
                try {
                    console.log('📄 Using master seed file for complete setup...');
                    await this.executeSQLFile(masterSeedPath, 'Master seed');
                    results.executedFiles.push('master_seed.sql');

                    // Count items from individual files for summary
                    for (const sqlFile of sqlFiles) {
                        if (sqlFile.countField) {
                            const count = await this.countItemsInFile(join(__dirname, sqlFile.name));
                            results.summary[sqlFile.countField] = count;
                        }
                    }

                    console.log('✅ Master seed execution completed successfully');
                    return {
                        ...results,
                        message: 'All seeds executed successfully using master seed file.',
                        method: 'sql'
                    };
                } catch (error) {
                    console.warn('⚠️  Master seed failed, falling back to individual files...');
                    console.warn(error.message);
                }
            }

            // Execute individual files
            for (const sqlFile of sqlFiles) {
                if (!sqlFile.enabled) {
                    console.log(`  ⏭️  Skipping ${sqlFile.description}`);
                    continue;
                }

                try {
                    console.log(`  📄 Executing ${sqlFile.description}...`);
                    const sqlFilePath = join(__dirname, sqlFile.name);

                    await this.executeSQLFile(sqlFilePath, sqlFile.description);
                    results.executedFiles.push(sqlFile.name);

                    // Count items for summary
                    if (sqlFile.countField) {
                        const itemCount = await this.countItemsInFile(sqlFilePath);
                        results.summary[sqlFile.countField] = itemCount;
                    }

                    console.log(`  ✅ ${sqlFile.description} completed`);

                } catch (error) {
                    console.error(`  ❌ Error in ${sqlFile.name}: ${error.message}`);
                    results.errors.push({ file: sqlFile.name, error: error.message });
                    results.summary.totalErrors++;
                    results.success = false;
                }
            }

            console.log('✅ SQL seeding completed');

            return {
                ...results,
                message: `SQL seeding completed. ${results.executedFiles.length} files executed.`,
                method: 'sql'
            };

        } catch (error) {
            console.error('❌ SQL seeding failed:', error.message);
            return {
                success: false,
                errors: [{ general: error.message }],
                executedFiles: [],
                summary: results.summary,
                method: 'sql'
            };
        }
    }

    /**
     * Execute a single SQL file using psql command
     * @param {string} filePath - Path to the SQL file
     * @param {string} description - Description for logging
     */
    static async executeSQLFile(filePath, description) {
        try {
            // Check if file exists
            readFileSync(filePath, 'utf8');

            // Use environment variables for database connection
            const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

            if (!dbUrl) {
                throw new Error('No database URL found. Please set DATABASE_URL or SUPABASE_DB_URL environment variable.');
            }

            // Execute SQL file using psql
            const command = `psql "${dbUrl}" -f "${filePath}"`;
            const { stdout, stderr } = await execAsync(command);

            if (stderr && !stderr.includes('NOTICE')) {
                console.warn(`  ⚠️  Warnings in ${description}: ${stderr}`);
            }

            return { success: true, output: stdout };

        } catch (error) {
            if (error.code === 'ENOENT' && error.path) {
                throw new Error(`SQL file not found: ${filePath}`);
            }
            throw new Error(`Failed to execute ${description}: ${error.message}`);
        }
    }

    /**
     * Count INSERT statements in a SQL file to estimate items created
     * @param {string} filePath - Path to the SQL file
     * @returns {number} Estimated number of items
     */
    static async countItemsInFile(filePath) {
        try {
            const content = readFileSync(filePath, 'utf8');
            const insertMatches = content.match(/INSERT\s+INTO.*?VALUES/gis);

            if (!insertMatches) return 0;

            let totalCount = 0;
            for (const match of insertMatches) {
                // Count VALUES clauses
                const valuesMatches = content.substring(content.indexOf(match)).match(/\([^)]+\)/g);
                if (valuesMatches) {
                    totalCount += valuesMatches.length;
                }
            }

            return totalCount;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Clean up seed data by executing cleanup SQL commands
     * @param {Object} options - Cleanup options
     * @param {boolean} options.farmers - Whether to clean farmer data
     * @param {boolean} options.buyers - Whether to clean buyer data
     * @returns {Object} Result of cleanup operation
     */
    static async cleanupSeedData(options = { farmers: true, buyers: true }) {
        console.log('🧹 Cleaning up seed data from database...');

        try {
            const cleanupCommands = [];

            if (options.farmers || options.buyers) {
                cleanupCommands.push(
                    "DELETE FROM cart_items WHERE product_id IN (SELECT id FROM products WHERE farmer_id LIKE '%550e8400%' OR farmer_id LIKE '%f1000000%' OR farmer_id LIKE '%f2000000%');",
                    "DELETE FROM order_items WHERE product_id IN (SELECT id FROM products WHERE farmer_id LIKE '%550e8400%' OR farmer_id LIKE '%f1000000%' OR farmer_id LIKE '%f2000000%');",
                    "DELETE FROM orders WHERE buyer_id IN (SELECT user_id FROM buyers WHERE user_id LIKE '%550e8400%' OR user_id LIKE '%b1000000%');",
                    "DELETE FROM products WHERE farmer_id LIKE '%550e8400%' OR farmer_id LIKE '%f1000000%' OR farmer_id LIKE '%f2000000%';"
                );
            }

            if (options.farmers) {
                cleanupCommands.push(
                    "DELETE FROM farmers WHERE user_id LIKE '%550e8400%' OR user_id LIKE '%f1000000%' OR user_id LIKE '%f2000000%';",
                    "DELETE FROM users WHERE id LIKE '%550e8400%' OR id LIKE '%f1000000%' OR id LIKE '%f2000000%';"
                );
            }

            if (options.buyers) {
                cleanupCommands.push(
                    "DELETE FROM buyers WHERE user_id LIKE '%550e8400%' OR user_id LIKE '%b1000000%';",
                    "DELETE FROM users WHERE id LIKE '%550e8400%' OR id LIKE '%b1000000%';"
                );
            }

            let deletedCount = 0;
            const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

            if (!dbUrl) {
                throw new Error('No database URL found. Please set DATABASE_URL or SUPABASE_DB_URL environment variable.');
            }

            for (const command of cleanupCommands) {
                try {
                    const { stdout } = await execAsync(`psql "${dbUrl}" -c "${command}"`);
                    // Extract deletion count from output if available
                    const match = stdout.match(/DELETE (\d+)/);
                    if (match) {
                        deletedCount += parseInt(match[1]);
                    }
                } catch (error) {
                    console.warn(`  ⚠️  Warning during cleanup: ${error.message}`);
                }
            }

            console.log('✅ Cleanup completed successfully');

            return {
                success: true,
                data: { deletedCount },
                message: `Cleanup completed. ${deletedCount} records removed.`
            };

        } catch (error) {
            console.error('❌ Cleanup failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

export default SeedManager;
