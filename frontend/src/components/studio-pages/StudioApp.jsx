import { Route, Routes } from "react-router-dom";
import { StudioLayout } from "../sections/studio/StudioLayout";
import ReviewQueue from "./ReviewQueue";
import AllGuides from "./AllGuides";
import GuideEditor from "./GuideEditor";
import IntakeLinks from "./IntakeLinks";
import Payments from "./Payments";
import ChangeRequests from "./ChangeRequests";
import Clients from "./Clients";
import Activity from "./Activity";
import StudioSettings from "./StudioSettings";

/**
 * studio.villoguides.com, you only. Cloudflare Access guards the hostname and the
 * Worker checks the verified email, so there is no sign-in screen here.
 */
export default function StudioApp() {
  return (
    <Routes>
      <Route element={<StudioLayout />}>
        <Route index element={<ReviewQueue />} />
        <Route path="guides" element={<AllGuides />} />
        <Route path="guides/:id" element={<GuideEditor />} />
        <Route path="intake-links" element={<IntakeLinks />} />
        <Route path="payments" element={<Payments />} />
        <Route path="change-requests" element={<ChangeRequests />} />
        <Route path="clients" element={<Clients />} />
        <Route path="activity" element={<Activity />} />
        <Route path="settings" element={<StudioSettings />} />
        <Route path="*" element={<ReviewQueue />} />
      </Route>
    </Routes>
  );
}
