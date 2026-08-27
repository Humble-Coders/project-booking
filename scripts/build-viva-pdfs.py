#!/usr/bin/env python3
"""
Render docs/viva/project-*.md into branded PDFs under build/viva-pdfs/.

Usage:  python3 scripts/build-viva-pdfs.py
Needs:  pip install fpdf2
Output: build/viva-pdfs/project-01.pdf ... project-25.pdf
        File names match exactly what the project-pdf edge function signs.

Pure Python on purpose: no pandoc, no system Pango, so it runs anywhere.
"""
import re
import sys
from pathlib import Path

try:
    from fpdf import FPDF
except ImportError:
    sys.exit("missing dependency. Try: pip install fpdf2")

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "docs" / "viva"
OUT = ROOT / "build" / "viva-pdfs"

INK = (18, 21, 29)
BRAND = (66, 99, 166)
MUTED = (128, 138, 158)
RULE = (221, 227, 238)

FOOTNOTE = (
    "Humble Coders project viva preparation. These are the kinds of questions you should "
    "be able to answer about the app you built. Knowing the list is not the same as "
    "knowing your own code."
)


class Doc(FPDF):
    def footer(self) -> None:
        self.set_y(-15)
        self.set_font("Helvetica", size=8)
        self.set_text_color(*MUTED)
        self.cell(0, 8, f"{self.page_no()} of {{nb}}", align="C")


def clean(text: str) -> str:
    """Strip the markdown we do not render, and keep the text latin-1 safe."""
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"`(.+?)`", r"\1", text)
    text = re.sub(r"\[(.+?)\]\(.+?\)", r"\1", text)
    text = text.replace("·", "-").replace("’", "'").replace("“", '"').replace("”", '"')
    return text.encode("latin-1", "replace").decode("latin-1")


def render(md_path: Path) -> Path:
    lines = md_path.read_text(encoding="utf-8").splitlines()
    pdf = Doc()
    pdf.set_margins(16, 16, 16)
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 8)
    pdf.set_text_color(*MUTED)
    pdf.cell(0, 5, "HUMBLE CODERS", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(1)

    for raw in lines:
        line = raw.rstrip()
        if not line:
            continue
        if line.startswith("# "):
            pdf.set_font("Helvetica", "B", 17)
            pdf.set_text_color(*INK)
            pdf.multi_cell(0, 8, clean(line[2:]), new_x="LMARGIN", new_y="NEXT")
            y = pdf.get_y() + 1
            pdf.set_draw_color(*BRAND)
            pdf.set_line_width(0.8)
            pdf.line(pdf.l_margin, y, pdf.w - pdf.r_margin, y)
            pdf.ln(5)
        elif line.startswith("## "):
            pdf.ln(3)
            pdf.set_font("Helvetica", "B", 11.5)
            pdf.set_text_color(*BRAND)
            pdf.multi_cell(0, 6, clean(line[3:]), new_x="LMARGIN", new_y="NEXT")
            pdf.ln(1)
        elif line.startswith(">"):
            pdf.set_font("Helvetica", "I", 9)
            pdf.set_text_color(*MUTED)
            pdf.multi_cell(0, 4.6, clean(line.lstrip("> ")), new_x="LMARGIN", new_y="NEXT")
        elif re.match(r"^\d+\.\s", line):
            num, body = line.split(".", 1)
            pdf.set_font("Helvetica", size=10)
            pdf.set_text_color(*INK)
            pdf.multi_cell(0, 5.4, clean(f"{num.strip()}.  {body.strip()}"), new_x="LMARGIN", new_y="NEXT")
            pdf.ln(1.6)
        elif line.startswith("**"):
            pdf.set_font("Helvetica", size=9.5)
            pdf.set_text_color(*INK)
            pdf.multi_cell(0, 5, clean(line), new_x="LMARGIN", new_y="NEXT")
            pdf.ln(0.5)
        else:
            pdf.set_font("Helvetica", size=10)
            pdf.set_text_color(*INK)
            pdf.multi_cell(0, 5.2, clean(line), new_x="LMARGIN", new_y="NEXT")

    pdf.ln(5)
    y = pdf.get_y()
    pdf.set_draw_color(*RULE)
    pdf.set_line_width(0.2)
    pdf.line(pdf.l_margin, y, pdf.w - pdf.r_margin, y)
    pdf.ln(3)
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(*MUTED)
    pdf.multi_cell(0, 4, FOOTNOTE, new_x="LMARGIN", new_y="NEXT")

    num = re.search(r"project-(\d{2})", md_path.name).group(1)
    out = OUT / f"project-{num}.pdf"
    pdf.output(str(out))
    return out


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    sources = sorted(SRC.glob("project-*.md"))
    if not sources:
        sys.exit(f"no source files found in {SRC}")
    for md in sources:
        out = render(md)
        print(f"  {md.name} -> {out.name} ({out.stat().st_size // 1024} KB)")
    print(f"\n{len(sources)} PDFs written to {OUT}")


if __name__ == "__main__":
    main()
