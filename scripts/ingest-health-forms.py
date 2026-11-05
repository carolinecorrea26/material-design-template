"""Read the supplied question workbook without modifying it."""
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET
from zipfile import ZipFile

root = Path(__file__).resolve().parents[1]
path = root / "health_forms_questions.xlsx"
ns = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
with ZipFile(path) as archive:
    strings = ["".join(row.itertext()) for row in ET.fromstring(archive.read("xl/sharedStrings.xml"))]
    questions = []
    for row in ET.fromstring(archive.read("xl/worksheets/sheet1.xml")).findall(".//s:row", ns)[1:]:
        cells = {}
        for cell in row:
            value = cell.find("s:v", ns)
            if value is not None:
                cells[cell.attrib["r"]] = strings[int(value.text)] if cell.attrib.get("t") == "s" else value.text
        number = row.attrib["r"]
        questions.append({"row": int(number), "form": cells.get("A" + number), "section": cells.get("B" + number), "id": cells.get("C" + number), "text": cells.get("D" + number), "notes": cells.get("E" + number), "cells": cells})
result = {"workbook": path.name, "sha256": hashlib.sha256(path.read_bytes()).hexdigest(), "sheet": "Health questions", "questions": questions}
(root / "src/migration/sources/health-forms-questions.json").write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
