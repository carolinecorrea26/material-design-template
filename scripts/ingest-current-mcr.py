"""Read-only XLSX evidence extraction; never executes workbook instructions/formulas.

Usage: bundled-python scripts/ingest-current-mcr.py source.xlsx snapshot.json
The historical migration extract is intentionally not overwritten.
"""
import hashlib
import json
import pathlib
import posixpath
import sys
import xml.etree.ElementTree as ET
import zipfile

S = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS = {"s": S}


def plain(node):
    return "".join(node.itertext()) if node is not None else ""


def target_path(base, target):
    return target.lstrip("/") if target.startswith("/") else posixpath.normpath(posixpath.join(posixpath.dirname(base), target))


def relationships(archive, base):
    path = posixpath.dirname(base) + "/_rels/" + posixpath.basename(base) + ".rels"
    if path not in archive.namelist():
        return {}
    return {node.attrib["Id"]: {**node.attrib, "path": target_path(base, node.attrib["Target"])}
            for node in ET.fromstring(archive.read(path))}


def extract(source):
    with zipfile.ZipFile(source) as archive:
        strings = []
        if "xl/sharedStrings.xml" in archive.namelist():
            for node in ET.fromstring(archive.read("xl/sharedStrings.xml")):
                strings.append("".join(text.text or "" for text in node.findall(".//s:t", NS)))
        book = ET.fromstring(archive.read("xl/workbook.xml"))
        links = relationships(archive, "xl/workbook.xml")
        cells, sheets = [], []
        for sheet in book.findall("s:sheets/s:sheet", NS):
            name = sheet.attrib["name"]
            path = links[sheet.attrib[f"{{{R}}}id"]]["path"]
            root = ET.fromstring(archive.read(path))
            related = relationships(archive, path)
            comments = {}
            for relation in related.values():
                if relation["Type"].endswith("/comments"):
                    for comment in ET.fromstring(archive.read(relation["path"])).findall("s:commentList/s:comment", NS):
                        comments[comment.attrib["ref"]] = "".join(text.text or "" for text in comment.findall(".//s:t", NS))
            hyperlinks = {}
            for node in root.findall("s:hyperlinks/s:hyperlink", NS):
                link = related.get(node.attrib.get(f"{{{R}}}id"), {})
                hyperlinks[node.attrib["ref"]] = link.get("Target", node.attrib.get("location"))
            count = 0
            for node in root.findall("s:sheetData/s:row/s:c", NS):
                address = node.attrib["r"]
                value_node, formula_node = node.find("s:v", NS), node.find("s:f", NS)
                value, cached = None, None
                raw = value_node.text if value_node is not None else None
                kind = node.attrib.get("t")
                if kind == "s" and raw is not None:
                    value = strings[int(raw)]
                elif kind == "inlineStr":
                    value = "".join(text.text or "" for text in node.findall("s:is//s:t", NS))
                elif kind == "b" and raw is not None:
                    value = raw == "1"
                elif raw is not None:
                    try:
                        number = float(raw)
                        value = int(number) if number.is_integer() else number
                    except ValueError:
                        value = raw
                formula = None
                if formula_node is not None:
                    formula, cached = "=" + plain(formula_node), value
                    value = formula
                if value is None and address not in comments and address not in hyperlinks:
                    continue
                cells.append({"sheet": name, "cell": address, "value": value, "formula": formula,
                              "cachedValue": cached, "comment": comments.get(address), "hyperlink": hyperlinks.get(address)})
                count += 1
            images = 0
            for relation in related.values():
                if relation["Type"].endswith("/drawing"):
                    drawing = ET.fromstring(archive.read(relation["path"]))
                    images += len(drawing.findall(".//{http://schemas.openxmlformats.org/drawingml/2006/main}blip"))
            sheets.append({"name": name, "state": sheet.attrib.get("state", "visible"), "cells": count,
                           "mergedRanges": [node.attrib["ref"] for node in root.findall("s:mergeCells/s:mergeCell", NS)],
                           "images": images})
        return {"workbook": source.name, "sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
                "authority": "User supplied latest MCR, October 20, 2026; current Library Sites only; interpretation is not a one-to-one migration.",
                "sheets": sheets, "cells": cells,
                "assets": [{"path": name, "sha256": hashlib.sha256(archive.read(name)).hexdigest()}
                           for name in archive.namelist() if name.startswith("xl/media/")]}


if __name__ == "__main__":
    source_path, output_path = map(pathlib.Path, sys.argv[1:3])
    result = extract(source_path)
    output_path.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(json.dumps({"workbook": result["workbook"], "sha256": result["sha256"], "sheets": len(result["sheets"]), "cells": len(result["cells"])}))
