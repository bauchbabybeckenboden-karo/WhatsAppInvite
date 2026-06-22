const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL_FRAGEBOGEN,
  process.env.SUPABASE_SERVICE_KEY_FRAGEBOGEN
);

exports.handler = async function() {
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

  const { error } = await supabase
    .from('fragebogen_antworten')
    .delete()
    .lt('eingereicht_am', threeYearsAgo.toISOString());

  if (error) {
    console.error('Fehler:', error);
    return { statusCode: 500, body: 'Fehler beim Löschen' };
  }

  return { statusCode: 200, body: 'Alte Einträge gelöscht' };
};
