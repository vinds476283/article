#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
铟子vinds 文章站 — 静态页面生成脚本

用法(在本文件所在目录执行):
    python build_site.py

它会读取 ./article/ 目录, 然后:
    1. 为每个 Markdown 文章生成同名的 .html 页面(文章阅读页);
    2. 为 ./article/ 下的每个一级子文件夹生成 index.html(专题主页);
    3. 生成站点根目录的 index.html(所有主页的主页);
    4. 生成 site-data.js(左侧导航树的数据)与 404.html。

只依赖 Python 标准库。新增/删除文章后重新运行一次即可
(文章阅读页的地址规则是固定的, 因此老页面不会失效)。

目录约定:
    article/<专题>/<任意层级的子文件夹>/<文章>.md
    article/<专题>/<专题>.md        -> 该专题主页的说明文字(可选)

根目录的三个文件各管一块:
    index.html   站点主页(所有专题的主页)
    style.css    全站样式
    app.js       全站脚本(导航树 / 主题切换 / Markdown 渲染)
"""

import os
import json
import sys
from urllib.parse import quote

# ----------------------------------------------------------------- 站点配置
SITE_TITLE = "vinds"                       # 浏览器标题: "vinds | 文章名"
SITE_AUTHOR = "铟子vinds"
SITE_HOME = "https://y.vinds.top"          # 页脚里的"铟子vinds"链接
SITE_REPO = "https://github.com/vinds476283/article"

ARTICLE_DIR = "article"                     # 文章根目录
HERE = os.path.dirname(os.path.abspath(__file__))

# 数学公式排版库(联网时自动加载; 打不开也不影响正文, 公式会原样显示 LaTeX 源码)。
# 如果想完全离线, 把 katex 的 dist 目录放进站点并改成相对路径即可。
KATEX_CSS = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"
KATEX_JS = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"

# 与 JavaScript 的 encodeURI 保持一致, 避免生成的路径与运行时拼接的路径不同
URI_SAFE = "!'()*-._~+/&$=:@"


def enc(s: str) -> str:
    return quote(s, safe=URI_SAFE)


def enc_path(p: str) -> str:
    return "/".join(enc(seg) for seg in p.split("/"))


def esc(s: str) -> str:
    return (str(s).replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


FOOT = (
    '<footer class="foot">\n'
    '\t\t<p><a href="{repo}" target="_blank">GitHub</a> | '
    'Copyright © 2026-present | '
    '<a href="{home}" target="_blank">铟子vinds</a></p>\n'
    '\t</footer>'
).format(repo=SITE_REPO, home=SITE_HOME)


def href(root: str, path: str) -> str:
    """root 为回到站点根目录的相对前缀, path 为相对站点根目录的路径"""
    return root + enc_path(path)


def page_shell(*, root, title, desc, body_class, page, extra_data,
               extra_head, content_html, sidebar_html, inject_data):
    """生成一个完整页面

    root          回到站点根目录的相对前缀(如 ""/"../"/"../../../")
    inject_data   是否内联注入 window.SITE(site-data.js 加载失败时的兜底)
    """
    data_attr = ""
    for k, v in extra_data.items():
        data_attr += ' data-{}="{}"'.format(k, esc(v))

    head_extra = ""
    if inject_data:
        # 用另一个全局变量保存"当前页面"的信息, 避免和 site-data.js 的 window.SITE 互相覆盖;
        # 加 defer 是为了保证它排在 site-data.js 之后执行
        head_extra += ('\n\t<script defer>window.PAGE = '
                       + json.dumps(inject_data, ensure_ascii=False)
                       + ';</script>')

    nav = (
        '<header class="nav">\n'
        '\t\t<a class="brand" href="{local_home}">铟子vinds</a>\n'
        '\t\t<button class="menu-btn" id="menu-btn" type="button" aria-label="目录">☰</button>\n'
        '\t\t<span class="spacer"></span>\n'
        '\t\t<a class="navlink" href="{local_home}">主页</a>\n'
        '\t\t<button class="theme-btn" id="theme-btn" type="button" aria-label="切换夜间模式">☾</button>\n'
        '\t</header>'
    ).format(local_home=root + "index.html")

    if sidebar_html:
        layout = ('<div class="layout">\n\t\t' + sidebar_html
                  + '\n\t\t<main class="main">\n' + content_html
                  + '\n\t\t</main>\n\t</div>')
    else:
        layout = '<main class="main">\n' + content_html + '\n\t</main>'

    return (
        '<!DOCTYPE html>\n'
        '<html lang="zh-CN" data-root="{root}" data-home="{local_home}">\n'
        '<head>\n'
        '\t<meta charset="utf-8">\n'
        '\t<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        '\t<title>{title}</title>\n'
        '\t<meta name="description" content="{desc}">\n'
        '\t<link rel="icon" href="{favicon}">\n'
        '\t<link rel="apple-touch-icon" href="{favicon}">\n'
        '\t<link rel="stylesheet" href="{css}">\n'
        '\t<link rel="stylesheet" href="{katex_css}">\n'
        '\t<script>(function(){{try{{var t=localStorage.getItem("theme");'
        'if(t!=="light"&&t!=="dark"){{t=window.matchMedia&&'
        'window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}}'
        'document.documentElement.setAttribute("data-theme",t);}}catch(e){{}}}})();</script>'
        '\t<script src="{site_data}" defer></script>\n'
        '\t<script src="{app}"></script>'
        '\t<script defer src="{katex_js}" crossorigin="anonymous"></script>{head_extra}\n'
        '</head>\n'
        '<body class="{body_class}" data-page="{page}"{data_attr}>\n'
        '\t{nav}\n'
        '\t{layout}\n'
        '\t{foot}\n'
        '</body>\n'
        '</html>\n'
    ).format(
        root=root,
        local_home=root + "index.html",
        title=esc(title),
        desc=esc(desc),
        favicon=root + "favicon.ico",
        css=root + "style.css",
        katex_css=KATEX_CSS,
        katex_js=KATEX_JS,
        site_data=root + "site-data.js",
        app=root + "app.js",
        head_extra=head_extra,
        body_class=body_class,
        page=page,
        data_attr=data_attr,
        nav=nav,
        layout=layout,
        foot=FOOT.format(),
    )


def sidebar(html):
    return '<aside class="side" id="sidebar">\n' + html + '\n\t</aside>'


# ----------------------------------------------------------------- 收集文章
def walk_dir(path):
    """递归收集目录下的 md 文件, 返回 (文件列表, 子目录列表)"""
    files, dirs = [], []
    try:
        names = sorted(os.listdir(path), key=lambda s: s.lower())
    except FileNotFoundError:
        return files, dirs
    for name in names:
        full = os.path.join(path, name)
        if os.path.isdir(full):
            dirs.append(name)
        elif name.lower().endswith(".md") and not name.startswith("."):
            files.append(name)
    return files, dirs


def build_folder(abs_dir, rel_dir, url_base):
    """把某个专题下的一个文件夹转成导航树节点

    rel_dir  该文件夹相对专题目录的路径(带结尾斜杠, 顶层为空串)
    url_base 该专题的 URL 前缀(相对站点根目录, 如 "article/高中数学笔记/")
    """
    node = {"name": os.path.basename(abs_dir.rstrip("/\\")), "groups": [], "items": []}
    files, dirs = walk_dir(abs_dir)
    for f in files:
        rel = rel_dir + f
        node["items"].append({
            "title": f[:-3],
            "url": url_base + rel[:-3] + ".html",
        })
    for d in dirs:
        child = build_folder(os.path.join(abs_dir, d), rel_dir + d + "/", url_base)
        if child["items"] or child["groups"]:
            node["groups"].append(child)
    return node


def collect():
    article_root = os.path.join(HERE, ARTICLE_DIR)
    subjects = []
    if not os.path.isdir(article_root):
        return subjects

    for sub in sorted(os.listdir(article_root), key=lambda s: s.lower()):
        sub_abs = os.path.join(article_root, sub)
        if not os.path.isdir(sub_abs) or sub.startswith("."):
            continue
        folder = build_folder(sub_abs, "", ARTICLE_DIR + "/" + sub + "/")
        if not count_items(folder):
            continue          # 空文件夹(比如只放了图片)不当成专题
        home_md = None
        for f in os.listdir(sub_abs):
            if f.lower() == (sub + ".md").lower():
                home_md = f
                break
        subjects.append({
            "name": sub,
            "dir": sub,
            "doc": (ARTICLE_DIR + "/" + sub + "/" + home_md) if home_md else "",
            "home": ARTICLE_DIR + "/" + sub + "/index.html",
            "folder": folder,
        })
        imgs = []
        collect_images(sub_abs, sub + "/", imgs)
        folder["images"] = imgs
    return subjects


def count_items(node):
    n = len(node["items"])
    for g in node["groups"]:
        n += count_items(g)
    return n


IMG_EXT = (".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp", ".avif")


def collect_images(abs_dir, rel_dir, out):
    """收集专题目录下所有图片, 供文章里的 ![[图片.png]] 使用"""
    try:
        names = sorted(os.listdir(abs_dir), key=lambda s: s.lower())
    except FileNotFoundError:
        return
    for name in names:
        full = os.path.join(abs_dir, name)
        if os.path.isdir(full):
            collect_images(full, rel_dir + name + "/", out)
        elif name.lower().endswith(IMG_EXT):
            out.append(ARTICLE_DIR + "/" + rel_dir + name)


def md_titles(node):
    out = [it["title"] for it in node["items"]]
    for g in node["groups"]:
        out += md_titles(g)
    return out


def all_items(node):
    """按文件夹顺序取出所有文章(扁平)"""
    out = list(node["items"])
    for g in node["groups"]:
        out += all_items(g)
    return out


# ----------------------------------------------------------------- 生成页面
def gen(out_path, html):
    full = os.path.join(HERE, out_path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(html)


def main():
    subjects = collect()

    # 站点数据(导航树)
    site_data = {
        "title": SITE_TITLE,
        "author": SITE_AUTHOR,
        "home": SITE_HOME,
        "repo": SITE_REPO,
        "subjects": [],
    }
    # 全部文章的阅读顺序(用于上一篇/下一篇)
    flat = []
    for sub in subjects:
        for it in all_items(sub["folder"]):
            flat.append({"title": it["title"], "url": it["url"], "subject": sub["name"]})

    for sub in subjects:
        site_data["subjects"].append({
            "name": sub["name"],
            "dir": sub["dir"],
            "doc": sub["doc"],
            "home": sub["home"],
            "folder": sub["folder"],
        })
    site_data["articles"] = flat

    with open(os.path.join(HERE, "site-data.js"), "w", encoding="utf-8", newline="\n") as fh:
        fh.write("/* 由 build_site.py 自动生成, 请勿手工修改 */\n")
        fh.write("window.SITE = " + json.dumps(site_data, ensure_ascii=False, indent=1) + ";\n")

    # 关闭 GitHub Pages 的 Jekyll 处理(文件名含中文与特殊字符时更稳妥)
    with open(os.path.join(HERE, ".nojekyll"), "w", encoding="utf-8", newline="\n") as fh:
        fh.write("")

    # 每个页面都要用的三件套之一, 缺了就报个清楚的名字
    for need in ("style.css", "app.js", "favicon.ico"):
        if not os.path.exists(os.path.join(HERE, need)):
            print("警告: 缺少文件 " + need)

    # ---------------------------------------------------------- 站点根 index
    total = sum(count_items(s["folder"]) for s in subjects)

    items_html = []
    for sub in subjects:
        n = count_items(sub["folder"])
        sub_items = all_items(sub["folder"])
        link_html = " ".join(
            '<a href="{}">{}</a>'.format(esc(href("", it["url"])), esc(it["title"]))
            for it in sub_items[:6]
        )
        more = "" if len(sub_items) <= 6 else " …"
        items_html.append(
            '<li>\n'
            '\t\t\t<a class="subject-title" href="{url}">{name}</a>\n'
            '\t\t\t<p class="subject-desc">共 {n} 篇文章</p>\n'
            '\t\t\t<p class="subject-articles">{links}{more}</p>\n'
            '\t\t</li>'.format(
                url=esc(href("", sub["home"])),
                name=esc(sub["name"]),
                n=n,
                links=link_html,
                more=more,
            )
        )

    home_content = (
        '<div class="home">\n'
        '\t\t<h1>' + esc(SITE_AUTHOR) + '的文章</h1>\n'
        '\t\t<p class="lead">共 {ns} 个专题，{nt} 篇文章。</p>\n'
        '\t\t<ul class="subject-list">\n\t\t\t{items}\n\t\t</ul>\n'
        '\t</div>'
    ).format(ns=len(subjects), nt=total,
             items="\n\t\t\t".join(items_html) or '<li>还没有文章。</li>')

    gen("index.html", page_shell(
        root="", title=SITE_TITLE,
        desc="铟子vinds 的文章", body_class="page-home", page="home",
        extra_data={}, extra_head="", content_html=home_content,
        sidebar_html="", inject_data=site_data,
    ))

    # ------------------------------------------------------- 每个专题 index
    for sub in subjects:
        sub_index = os.path.join(ARTICLE_DIR, sub["dir"], "index.html").replace("\\", "/")
        root = "../" * sub_index.count("/")
        context = {
            "title": SITE_TITLE, "author": SITE_AUTHOR,
            "home": SITE_HOME, "repo": SITE_REPO,
            "subjects": site_data["subjects"],
            "subject": {"name": sub["name"], "dir": sub["dir"],
                        "doc": sub["doc"], "home": sub["home"]},
            "currentSubject": sub["name"],
            "currentFolder": sub["folder"],
            "currentPath": "",
        }
        side = sidebar(
            '<h2><a id="sidebar-subject" href="{h}">{n}</a></h2>\n'
            '\t\t<p class="side-home"><a href="{home}">主页</a></p>\n'
            '\t\t<input type="search" id="sidebar-search" placeholder="搜索文章…" '
            'aria-label="搜索文章">\n'
            '\t\t<div id="sidebar-tree"></div>'.format(
                h=esc(href(root, sub["home"])), n=esc(sub["name"]),
                home=SITE_HOME)
        )
        content = (
            '<article class="doc" id="content">\n'
            '\t\t\t<p class="status">正在加载…</p>\n'
            '\t\t</article>'
        )
        gen(os.path.join(ARTICLE_DIR, sub["dir"], "index.html"),
            page_shell(
                root=root, title=SITE_TITLE + " | " + sub["name"],
                desc=sub["name"] + " 专题主页",
                body_class="page-subject", page="subject",
                extra_data={}, extra_head="", content_html=content,
                sidebar_html=side, inject_data=context,
            ))

        # --------------------------------------------------- 每篇文章阅读页
        def gen_article(dir_rel, items):
            """dir_rel: 相对专题目录的文件夹路径(带结尾斜杠, 顶层为 "")"""
            for it in items:
                md_rel = ARTICLE_DIR + "/" + sub["dir"] + "/" + dir_rel + it["title"] + ".md"
                out_rel = os.path.join(ARTICLE_DIR, sub["dir"], dir_rel,
                                       it["title"] + ".html").replace("\\", "/")
                depth = out_rel.count("/")
                root = "../" * depth
                context = {
                    "title": SITE_TITLE, "author": SITE_AUTHOR,
                    "home": SITE_HOME, "repo": SITE_REPO,
                    "subjects": site_data["subjects"],
                    "subject": {"name": sub["name"], "dir": sub["dir"],
                                "doc": sub["doc"], "home": sub["home"]},
                    "currentSubject": sub["name"],
                    "currentFolder": sub["folder"],
                    "currentPath": md_rel,
                }
                side = sidebar(
                    '<h2><a id="sidebar-subject" href="{h}">{n}</a></h2>\n'
                    '\t\t<p class="side-home"><a href="{home}">主页</a></p>\n'
                    '\t\t<input type="search" id="sidebar-search" placeholder="搜索文章…" '
                    'aria-label="搜索文章">\n'
                    '\t\t<div id="sidebar-tree"></div>'.format(
                        h=esc(href(root, sub["home"])), n=esc(sub["name"]),
                        home=SITE_HOME)
                )
                content = (
                    '<article class="doc" id="content">\n'
                    '\t\t\t<p class="status">正在加载文章…</p>\n'
                    '\t\t</article>'
                )
                gen(os.path.join(ARTICLE_DIR, sub["dir"], dir_rel, it["title"] + ".html"),
                    page_shell(
                        root=root,
                        title=SITE_TITLE + " | " + it["title"],
                        desc=it["title"] + " — " + sub["name"],
                        body_class="page-article", page="article",
                        extra_data={"md": md_rel},
                        extra_head="", content_html=content,
                        sidebar_html=side, inject_data=context,
                    ))

        def walk_node(dir_rel, node):
            gen_article(dir_rel, node["items"])
            for g in node["groups"]:
                walk_node(dir_rel + g["name"] + "/", g)

        walk_node("", sub["folder"])

    # ------------------------------------------------------------- 404 页面
    gen("404.html", page_shell(
        root="/", title=SITE_TITLE, desc="页面不存在",
        body_class="page-home", page="home", extra_data={}, extra_head="",
        content_html=('<div class="home"><h1>404</h1>'
                      '<p class="lead">没有找到这个页面, '
                      '<a href="/">回到主页</a>。</p></div>'),
        sidebar_html="", inject_data=site_data,
    ))

    print("完成: {} 个专题, {} 篇文章".format(
        len(subjects), sum(count_items(s["folder"]) for s in subjects)))
    for sub in subjects:
        print("  - {} ({} 篇)".format(sub["name"], count_items(sub["folder"])))


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
