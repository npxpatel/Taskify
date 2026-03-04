const { AppError } = require('../utils/AppError');

// Known companies with their Clearbit logo domains
const KNOWN_COMPANIES = {
  google:     'google.com',
  microsoft:  'microsoft.com',
  amazon:     'amazon.com',
  apple:      'apple.com',
  meta:       'meta.com',
  netflix:    'netflix.com',
  tesla:      'tesla.com',
  uber:       'uber.com',
  airbnb:     'airbnb.com',
  twitter:    'twitter.com',
  linkedin:   'linkedin.com',
  salesforce: 'salesforce.com',
  adobe:      'adobe.com',
  oracle:     'oracle.com',
  ibm:        'ibm.com',
  intel:      'intel.com',
  nvidia:     'nvidia.com',
  spotify:    'spotify.com',
  shopify:    'shopify.com',
  stripe:     'stripe.com',
  slack:      'slack.com',
  zoom:       'zoom.us',
  dropbox:    'dropbox.com',
  atlassian:  'atlassian.com',
  github:     'github.com',
  gitlab:     'gitlab.com',
  figma:      'figma.com',
  notion:     'notion.so',
  twilio:     'twilio.com',
  datadog:    'datadoghq.com',
  snowflake:  'snowflake.com',
  palantir:   'palantir.com',
  coinbase:   'coinbase.com',
  robinhood:  'robinhood.com',
  doordash:   'doordash.com',
  lyft:       'lyft.com',
  pinterest:  'pinterest.com',
  reddit:     'reddit.com',
  snap:       'snap.com',
  bytedance:  'bytedance.com',
  tiktok:     'tiktok.com',
  samsung:    'samsung.com',
  sony:       'sony.com',
  deloitte:   'deloitte.com',
  accenture:  'accenture.com',
  infosys:    'infosys.com',
  tcs:        'tcs.com',
  wipro:      'wipro.com',
};

function guessCandidates(query) {
  const q = query.toLowerCase().trim();
  const results = [];

  for (const [name, domain] of Object.entries(KNOWN_COMPANIES)) {
    if (name.startsWith(q) || name.includes(q)) {
      results.push({
        name:   name.charAt(0).toUpperCase() + name.slice(1),
        domain,
        logo:   `https://logo.clearbit.com/${domain}`,
      });
    }
  }

  // Exact match first
  results.sort((a, b) => {
    const aExact = a.name.toLowerCase() === q ? -1 : 0;
    const bExact = b.name.toLowerCase() === q ? -1 : 0;
    return aExact - bExact;
  });

  return results.slice(0, 5);
}

async function searchCompanies(req, res, next) {
  try {
    const query = req.query.q;
    if (!query || typeof query !== 'string' || query.trim().length < 1) {
      throw AppError.badRequest('Query parameter "q" is required');
    }

    const results = guessCandidates(query.trim());
    return res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
}

module.exports = { searchCompanies };
