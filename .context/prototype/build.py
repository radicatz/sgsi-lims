"""Join the prototype sources into one HTML page.

Usage: python build.py
Output: job-order-prototype.html next to this script (published as the "SGSI Job Orders" artifact).
"""
import base64
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE / "src"
OUT = HERE / "job-order-prototype.html"
LOGO = HERE.parent / "assets" / "sgsi-logo-icon.png"
LOGO_WHITE = HERE.parent / "images" / "sgsi-logo-white.png"


def read(name):
    return (SRC / name).read_text(encoding="utf8")


def main():
    logo = base64.b64encode(LOGO.read_bytes()).decode("ascii")
    page = read("index.html")
    logo_white = base64.b64encode(LOGO_WHITE.read_bytes()).decode("ascii")
    page = page.replace("/*STYLES*/", read("styles.css").replace("__LOGO__", logo).replace("__LOGO_WHITE__", logo_white))
    page = page.replace("/*ICONS*/", read("icons.js"))
    page = page.replace("/*DATA*/", read("data.js"))
    page = page.replace("/*APP*/", read("app.js") + "\n\n" + read("reception.js") + "\n\n" + read("app2.js"))
    OUT.write_text(page, encoding="utf8")
    print(f"{OUT} ({OUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
