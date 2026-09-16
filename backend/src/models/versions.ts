// Version history lives on the guides model, since publish, restore, and
// listing versions all share the same guide_versions queries. Re-exported
// here so the file exists at the path the architecture's tree names.
export { listVersions, restoreVersion } from "./guides";
