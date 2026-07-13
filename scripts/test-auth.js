const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf-8');
const envUrl = envFile.split('\n').find(line => line.startsWith('NEXT_PUBLIC_SUPABASE_URL='))?.split('=')[1];
const envAnonKey = envFile.split('\n').find(line => line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY='))?.split('=')[1];
const envKey = envFile.split('\n').find(line => line.startsWith('SUPABASE_SERVICE_ROLE_KEY='))?.split('=')[1];

const supabase = createClient(envUrl?.trim(), envKey?.trim(), {
  auth: { autoRefreshToken: false, persistSession: false },
});

const anonSupabase = createClient(envUrl?.trim(), envAnonKey?.trim(), {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const users = [
    { email: 'admin@trusta.com', password: 'admin123' },
    { email: 'seller@trusta.com', password: 'seller123' },
  ];

  for (const u of users) {
    // 1. Try to login
    const { data: loginData, error: loginError } = await anonSupabase.auth.signInWithPassword({
      email: u.email,
      password: u.password,
    });
    
    if (loginError) {
      console.log(`[LOGIN ERROR for ${u.email}]:`, loginError.message);
    } else {
      console.log(`[LOGIN SUCCESS for ${u.email}]:`, loginData.user.id);
      continue;
    }

    // 2. Try to list users to see if they exist
    const { data: listData } = await supabase.auth.admin.listUsers();
    const existingUser = listData.users.find(x => x.email === u.email);
    
    if (existingUser) {
      console.log(`[USER EXISTS]: ${u.email} exists but login failed. Updating password...`);
      const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
        password: u.password,
        email_confirm: true
      });
      if (updateError) {
        console.error(`[UPDATE ERROR]:`, updateError.message);
      } else {
        console.log(`[UPDATE SUCCESS]: Password updated for ${u.email}`);
      }
    } else {
      console.log(`[USER NOT FOUND]: ${u.email} does not exist in auth.users.`);
    }
  }
}

main();
