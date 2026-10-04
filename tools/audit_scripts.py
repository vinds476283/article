import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SC = re.compile(r'<script\b([^>]*)>([\s\S]*?)</script>', re.I)
bad = 0
for base, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in ('.git', 'tools', '__pycache__')]
    for f in files:
        if not f.endswith('.html'):
            continue
        p = os.path.join(base, f)
        rel = os.path.relpath(p, ROOT)
        text = open(p, encoding='utf-8').read()
        blocks = SC.findall(text)
        kinds = []
        for attrs, body in blocks:
            kind = 'inline' if 'src=' not in attrs else 'src:' + re.search(r'src="([^"]*)"', attrs).group(1)
            if 'defer' in attrs:
                kind += ' [defer]'
            has_site = 'window.SITE' in body
            kinds.append(kind + (' +SITE' if has_site else ''))
            if 'window.SITE' in body:
                if '</scr' in body.lower() or '<!--' in body:
                    print('!! %s: 注入脚本里有可疑内容' % rel)
                    bad += 1
        print('%-58s %s' % (rel, ' | '.join(kinds)))
print('可疑: %d' % bad)
