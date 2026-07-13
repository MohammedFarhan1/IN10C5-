const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf-8');
const envUrl = envFile.split('\n').find(line => line.startsWith('NEXT_PUBLIC_SUPABASE_URL='))?.split('=')[1]?.trim();
const envAnonKey = envFile.split('\n').find(line => line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY='))?.split('=')[1]?.trim();
const envKey = envFile.split('\n').find(line => line.startsWith('SUPABASE_SERVICE_ROLE_KEY='))?.split('=')[1]?.trim();

const adminSupabase = createClient(envUrl, envKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const anonSupabase = createClient(envUrl, envAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const users = [
    { email: 'admin1@trusta.com', password: 'admin123', name: 'System Admin', role: 'admin' },
    { email: 'seller1@trusta.com', password: 'seller123', name: 'Sample Seller', role: 'seller' },
  ];

  for (const u of users) {
    console.log(`Creating ${u.email}...`);
    const { data: signUpData, error: signUpError } = await anonSupabase.auth.signUp({
      email: u.email,
      password: u.password,
      options: {
        data: { name: u.name, role: u.role }
      }
    });
    
    if (signUpError) {
      console.log(`[SIGNUP ERROR for ${u.email}]:`, signUpError.message);
    } else {
      console.log(`[SIGNUP SUCCESS for ${u.email}]:`, signUpData.user.id);
      
      // Update the profile role to make sure they have the right privileges
      const { error: profileError } = await adminSupabase
        .from('profiles')
        .update({ role: u.role })
        .eq('id', signUpData.user.id);
        
      if (profileError) {
         console.error('[PROFILE UPDATE ERROR]:', profileError.message);
      } else {
         console.log(`[PROFILE UPDATE SUCCESS]: Role set to ${u.role}`);
      }
    }
  }
}

main();
