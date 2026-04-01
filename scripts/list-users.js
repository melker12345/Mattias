const { createClient } = require('@supabase/supabase-js');

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env.');
    process.exit(1);
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: users, error } = await admin
    .from('users')
    .select('id, email, role, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error.message);
    process.exit(1);
  }

  console.log(JSON.stringify(users, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


