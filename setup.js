#!/usr/bin/env node

/**
 * Farm Link Backend Setup Script
 * This script helps set up the initial configuration for the Farm Link Backend
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🌱 Farm Link Backend Setup');
console.log('========================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env file from template...');

    if (fs.existsSync(envExamplePath)) {
        fs.copyFileSync(envExamplePath, envPath);
        console.log('✅ .env file created successfully!');
    } else {
        // Create basic .env if example doesn't exist
        const defaultEnv = `# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Server Configuration
PORT=3000
NODE_ENV=development
`;
        fs.writeFileSync(envPath, defaultEnv);
        console.log('✅ Default .env file created!');
    }
} else {
    console.log('ℹ️  .env file already exists');
}

console.log('\n📋 Next Steps:');
console.log('1. Create a Supabase account at https://supabase.com');
console.log('2. Create a new project');
console.log('3. Go to Settings > API in your Supabase dashboard');
console.log('4. Copy your Project URL and API keys');
console.log('5. Update the .env file with your actual credentials');
console.log('6. Go to SQL Editor in Supabase dashboard');
console.log('7. Run the SQL commands from database/schema.sql');
console.log('8. Start the server with: npm run dev');

console.log('\n🔗 Helpful Links:');
console.log('- Supabase Dashboard: https://app.supabase.com');
console.log('- API Documentation: README.md');
console.log('- Health Check: http://localhost:3000/health');
console.log('- Database Test: http://localhost:3000/api/test-db');

console.log('\n🚀 Setup complete! Edit your .env file and start coding!');
