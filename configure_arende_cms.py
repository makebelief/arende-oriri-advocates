#!/usr/bin/env python3
from pathlib import Path
import sys
repo=Path(sys.argv[1]).expanduser().resolve() if len(sys.argv)>1 else Path.home()/'arende-oriri-advocates'
url=input('Supabase Project URL (https://xxxxx.supabase.co): ').strip().rstrip('/')
key=input('Supabase Publishable / anon key: ').strip()
if not url.startswith('https://') or '.supabase.co' not in url: raise SystemExit('That does not look like a Supabase project URL.')
if len(key)<20: raise SystemExit('The Supabase key looks too short.')
files=[repo/'assets/js/cms-config.js',repo/'api/_cms-config.js']
for f in files:
    s=f.read_text()
    import re
    s=re.sub(r"PASTE_SUPABASE_URL",url,s)
    s=re.sub(r"PASTE_SUPABASE_PUBLISHABLE_KEY",key,s)
    # also update existing values if re-running
    if f.name=='cms-config.js':
        s=re.sub(r"supabaseUrl:\s*'[^']*'",f"supabaseUrl: '{url}'",s)
        s=re.sub(r"supabaseKey:\s*'[^']*'",f"supabaseKey: '{key}'",s)
    else:
        s=re.sub(r"SUPABASE_URL:\s*'[^']*'",f"SUPABASE_URL: '{url}'",s)
        s=re.sub(r"SUPABASE_KEY:\s*'[^']*'",f"SUPABASE_KEY: '{key}'",s)
    f.write_text(s)
print('✓ CMS configuration written to browser and API config.')
print('Next: run the SQL in supabase/schema.sql, create one Auth user, then preview the site.')
