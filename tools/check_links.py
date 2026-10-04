#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成结果自检: 检查每个页面里的站内链接是否都能找到对应文件。

用法: python tools/check_links.py
"""
import os
import re
import sys
import posixpath
import html as html_mod
from urllib.parse import unquote, urlparse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

ATTR = re.compile(r'(?:href|src)="([^"]+)"')
IGNORE_MISSING = {"favicon.ico"}          # 由使用者自己添加


def main():
    bad = 0
    pages = 0
    for base, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in (".git", "tools", "__pycache__")]
        for name in files:
            if not name.lower().endswith(".html"):
                continue
            pages += 1
            full = os.path.join(base, name)
            rel_page = os.path.relpath(full, ROOT).replace("\\", "/")
            text = open(full, encoding="utf-8").read()
            for raw in ATTR.findall(text):
                url = html_mod.unescape(raw.strip())
                if not url or url.startswith("http") or url.startswith("//"):
                    continue
                if url.startswith("#") or url.startswith("mailto:"):
                    continue
                parsed = urlparse(url)
                if parsed.scheme:
                    continue
                path = unquote(parsed.path)
                if not path:
                    continue
                if path.startswith("/"):
                    target = path.lstrip("/")
                else:
                    target = posixpath.normpath(
                        posixpath.join(posixpath.dirname(rel_page), path))
                if target.startswith(".."):
                    print("!! {0}: 越界链接 {1}".format(rel_page, url))
                    bad += 1
                    continue
                if os.path.basename(target) in IGNORE_MISSING:
                    continue
                if not os.path.exists(os.path.join(ROOT, target.replace("/", os.sep))):
                    print("!! {0}: 找不到 {1}".format(rel_page, target))
                    bad += 1
    print("检查了 {0} 个页面, {1}".format(pages, "全部通过" if not bad else "有 {0} 处问题".format(bad)))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main())
