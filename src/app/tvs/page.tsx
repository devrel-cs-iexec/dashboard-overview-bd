import { permanentRedirect } from "next/navigation";

// The TVS dashboard is now the site root. Kept so existing /tvs links and
// bookmarks keep working.
export default function TvsRedirect() {
  permanentRedirect("/");
}
