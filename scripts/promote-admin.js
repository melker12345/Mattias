const { createClient } = require('@supabase/supabase-js');

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node scripts/promote-admin.js <email>');
    process.exit(1);
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env.');
    process.exit(1);
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: user, error: findError } = await admin
    .from('users')
    .select('id, email, role')
    .eq('email', email)
    .single();

  if (findError || !user) {
    console.error(`No user found with email: ${email}`);
    process.exit(2);
  }

  const { data: updated, error: updateError } = await admin
    .from('users')
    .update({ role: 'ADMIN' })
    .eq('id', user.id)
    .select('id, email, role')
    .single();

  if (updateError) {
    console.error('Failed to update role:', updateError.message);
    process.exit(1);
  }

  console.log('Updated:', updated);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


