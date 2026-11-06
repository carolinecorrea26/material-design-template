# Field ownership and placements

The inspection inventory separates a field definition from its owning group and its access points. It does not change application rendering, validation, or persistence.

- Direct page fields have a real page ID.
- Shared tool fields have a stable group ID and label, no owning page, and one or more placements.
- Each placement records a real page ID, access path, inline/drawer presentation, and display condition. Placements are field-specific: Home's default eligibility card collects birth date before opening the quote drawer, whereas Membership collects it inside that drawer.
- Site inventories resolve placements and available product/category questions independently. Global inventory preserves differing definitions and placement configurations with their applicable sites.
- Unplaced baseline definitions remain available separately; neither Global nor Unplaced is a page.

The Fields Show filter defaults to Page fields only. Inline tool placements count as page content. Page fields + linked tools adds drawer placements. Shared tools lists reusable groups with expandable access paths and an optional page filter. Page changes reset Area; Show changes reset group filters and retain Page. Controls keep the same positions and labels; Page is disabled for unplaced definitions. CSV/XML exports use the selected projection, including access paths.

To add another shared tool, supply a stable group identity and explicit field placements from its actual entry points. Do not repeat its definitions for every page or infer shared ownership from a field ID prefix. Page counts and links use the same projection as the default Fields view.
