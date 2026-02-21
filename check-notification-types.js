const supabase = require('./config/supabase');

async function checkNotificationTypes() {
  // Get a sample notification to see the type
  const { data, error } = await supabase
    .from('notifications')
    .select('type')
    .limit(10);

  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Existing notification types:');
    const types = [...new Set(data.map(n => n.type))];
    types.forEach(t => console.log(`  - ${t}`));
  }
}

checkNotificationTypes()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
