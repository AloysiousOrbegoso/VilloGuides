// Publish, unpublish, suspend, and rename all touch the same guide_versions
// and slug_history tables, so that logic lives together with the rest of the
// guide model in models/guides.ts rather than duplicated here. Re-exported so
// the file exists at the path the architecture's section 14 tree names.
export { publishGuide, unpublishGuide, suspendGuide, renameGuide } from "../models/guides";
