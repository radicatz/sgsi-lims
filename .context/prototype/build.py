"""Join the prototype v2 sources into one HTML page.

Usage: python build.py
Output: sgsi-lims-prototype.html next to this script. Plan: ../docs/Prototype/Prototype_Plan.md
- tokens: ../design/figcraft/tokens/sgsi-tokens.css (Light on :root, Dark on the two dark selectors)
- icons: ../design/figcraft/library/icons/*.svg, then version 31's icons.js for the few the library lacks
- logo: ../assets/sgsi-icon-*.svg; client logo ../assets/bukit-asam-tbk--big.svg
"""
import base64
import json
import pathlib
import re

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE / "src"
CTX = HERE.parent
OUT = HERE / "sgsi-lims-prototype.html"
ORDER = ["ui.js", "data.js", "shell.js", "modules/app.js", "modules/mywork.js", "modules/dashboard.js",
         "modules/joborders.js", "modules/batches.js", "modules/reports.js", "modules/search.js",
         "modules/master.js", "modules/admin.js", "main.js"]


def tokens():
    css = (CTX / "design/figcraft/tokens/sgsi-tokens.css").read_text(encoding="utf8")
    light = re.search(r":root\s*\{(.*?)\}", css, re.S).group(1)
    dark = re.search(r"\[data-sgsi-tokens=\"Dark\"\]\s*\{(.*?)\}", css, re.S).group(1)
    short = lambda body: re.sub(r"--([a-z]+)-\1(?=[-:])", r"--\1", body)  # --primary-primary-50 -> --primary-50
    light, dark = short(light), short(dark)
    return (":root {" + light + "}\n"
            "@media (prefers-color-scheme: dark) { :root:not([data-theme=\"light\"]) {" + dark + " color-scheme: dark; } }\n"
            ":root[data-theme=\"dark\"] {" + dark + " color-scheme: dark; }\n")


def icons():
    out = {}
    old = (HERE / "archive/src_v31/icons.js").read_text(encoding="utf8")
    out.update(json.loads(re.search(r"window\.ICONS=(\{.*\})", old, re.S).group(1)))
    for f in sorted((CTX / "design/figcraft/library/icons").glob("*.svg")):
        body = re.search(r"<svg[^>]*>(.*)</svg>", f.read_text(encoding="utf8"), re.S).group(1)
        out[f.stem] = body
    return "window.ICONS=" + json.dumps(out, separators=(",", ":")) + ";"


def b64(p):
    return base64.b64encode((CTX / p).read_bytes()).decode("ascii")


def main():
    page = (SRC / "index.html").read_text(encoding="utf8")
    css = (SRC / "styles.css").read_text(encoding="utf8")
    css = css.replace("/*TOKENS*/", tokens())
    css = css.replace("__LOGO__", b64("assets/sgsi-icon-primary.svg")).replace("__LOGO_WHITE__", b64("assets/sgsi-icon-white.svg"))
    css = css.replace("__PTBA__", b64("assets/bukit-asam-tbk--big.svg"))
    js = "\n\n".join((SRC / n).read_text(encoding="utf8") for n in ORDER)
    page = page.replace("/*STYLES*/", css).replace("/*ICONS*/", icons()).replace("/*APP*/", js)
    OUT.write_text(page, encoding="utf8")
    print(f"{OUT} ({OUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
