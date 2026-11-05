"""Read-only verification of the reviewed original v78 workbook drawing evidence."""
import argparse
import hashlib
import json
import posixpath
from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
NS = {
    "s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "x": "http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def verify(workbook):
    review = json.loads((ROOT / "docs/project-review/step1-workbook-drawings.json").read_text())
    snapshot = json.loads((ROOT / "src/migration/sources/mcr-v78.json").read_text())
    assert digest(workbook.read_bytes()) == review["workbookSha256"] == snapshot["sha256"], "Workbook differs from reviewed v78"
    with ZipFile(workbook) as archive:
        def relationships(part):
            path = posixpath.join(posixpath.dirname(part), "_rels", posixpath.basename(part) + ".rels")
            if path not in archive.namelist():
                return {}
            return {item.attrib["Id"]: posixpath.normpath(posixpath.join(posixpath.dirname(part), item.attrib["Target"])) for item in ET.fromstring(archive.read(path)) if item.attrib.get("TargetMode") != "External"}

        actual = []
        workbook_part = "xl/workbook.xml"
        sheet_relationships = relationships(workbook_part)
        for sheet in ET.fromstring(archive.read(workbook_part)).find("s:sheets", NS):
            part = sheet_relationships[sheet.attrib["{" + NS["r"] + "}id"]]
            links = relationships(part)
            for drawing in ET.fromstring(archive.read(part)).findall("s:drawing", NS):
                drawing_part = links[drawing.attrib["{" + NS["r"] + "}id"]]
                media = relationships(drawing_part)
                for anchor in ET.fromstring(archive.read(drawing_part)):
                    def point(name):
                        element = anchor.find("x:" + name, NS)
                        return {key: int(element.find("x:" + key, NS).text) + 1 for key in ["row", "col"]} if element is not None else None

                    for blip in anchor.findall(".//a:blip", NS):
                        key = blip.attrib.get("{" + NS["r"] + "}embed")
                        if key in media:
                            data = archive.read(media[key])
                            actual.append({"sheet": sheet.attrib["name"], "from": point("from"), "to": point("to"), "mediaPath": media[key], "sha256": digest(data), "bytes": len(data)})
        keys = ["sheet", "from", "to", "mediaPath", "sha256", "bytes"]
        expected = [{key: row[key] for key in keys} for row in review["drawings"]]
        assert actual == expected, "Drawing anchors or media changed; review before updating evidence"
        all_media = {row["mediaPath"]: row["sha256"] for row in actual}
        all_media.update({row["path"]: row["sha256"] for row in review["otherMedia"]})
        assert all_media == {row["path"]: row["sha256"] for row in snapshot["assets"]}, "Unaccounted snapshot media"
        for part, expected_hash in all_media.items():
            assert digest(archive.read(part)) == expected_hash, "Media hash changed: " + part
        embedded = {part: digest(archive.read(part)) for part in archive.namelist() if "/embeddings/" in part}
        assert embedded == {row["path"]: row["sha256"] for row in review["embeddedObjects"]}, "Embedded object evidence changed"
    print(f"Verified {len(actual)} anchors, {len(all_media)} media files and {len(embedded)} embedded objects. Source workbook unchanged.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("workbook", type=Path)
    verify(parser.parse_args().workbook)
