"""Join the prototype sources into one HTML page.

Usage: python build.py
Output: ../job-order-prototype.html (published as the "SGSI Job Orders" artifact).
"""
import base64
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE / "src"
OUT = HERE.parent / "job-order-prototype.html"
LOGO = HERE.parent / "assets" / "sgsi-logo-icon.png"


def read(name):
    return (SRC / name).read_text(encoding="utf8")


def main():
    logo = base64.b64encode(LOGO.read_bytes()).decode("ascii")
    page = read("index.html")
    page = page.replace("/*STYLES*/", read("styles.css").replace("__LOGO__", logo))
    page = page.replace("/*ICONS*/", read("icons.js"))
    page = page.replace("/*DATA*/", read("data.js"))
    page = page.replace("/*APP*/", read("app.js") + "\n" + read("app2.js"))
    OUT.write_text(page, encoding="utf8")
    print(f"{OUT} ({OUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
