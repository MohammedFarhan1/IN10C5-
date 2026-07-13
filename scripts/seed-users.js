const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf-8');
const envUrl = envFile.split('\n').find(line => line.startsWith('NEXT_PUBLIC_SUPABASE_URL='))?.split('=')[1];
const envKey = envFile.split('\n').find(line => line.startsWith('SUPABASE_SERVICE_ROLE_KEY='))?.split('=')[1];

const supabaseUrl = envUrl?.trim();
const supabaseKey = envKey?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Service Role Key in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log('Seeding admin and seller users...');

  const users = [
    {
      email: 'admin@trusta.com',
      password: 'admin123',
      name: 'System Admin',
      role: 'admin',
    },
    {
      email: 'seller@trusta.com',
      password: 'seller123',
      name: 'Sample Seller',
      role: 'seller',
    },
  ];

  for (const u of users) {
    // 1. Create or update user in auth.users
    const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { name: u.name, role: u.role },
    });

    let userId;

    if (adminError) {
      if (adminError.message.includes('already exists')) {
        console.log(`User ${u.email} already exists. Updating password...`);
        // If user exists, let's fetch them and update their password
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existingUser = listData.users.find((x) => x.email === u.email);
        if (existingUser) {
          userId = existingUser.id;
          await supabase.auth.admin.updateUserById(userId, { password: u.password, email_confirm: true });
        }
      } else {
        console.error(`Error creating ${u.email}:`, adminError.message);
        continue;
      }
    } else {
      userId = adminData.user.id;
      console.log(`Created user ${u.email}`);
    }

    // 2. Ensure profile is correct
    if (userId) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: u.role, name: u.name })
        .eq('id', userId);
        
      if (profileError) {
        // If update fails because row doesn't exist, try inserting
        await supabase.from('profiles').insert({ id: userId, role: u.role, name: u.name });
      }

      console.log(`Verified profile for ${u.email} with role: ${u.role}`);
    }
  }

  console.log('Done!');
}

main();
