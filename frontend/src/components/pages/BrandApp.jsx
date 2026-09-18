import { Route, Routes } from "react-router-dom";
import { useForcedLight } from "../../lib/theme";
import Landing from "./Landing";
import { Privacy, Terms } from "./Legal";
import FAQ from "./FAQ";
import ReportGuide from "./ReportGuide";
import ComingSoon from "./ComingSoon";

/** villoguides.com: brand page, legal pages, and the report form. Always light. */
export default function BrandApp() {
  useForcedLight();
  return (
    <div className="min-h-screen bg-paper text-charcoal">
      <Routes>
        <Route index element={<Landing />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="faq" element={<FAQ />} />
        <Route path="report" element={<ReportGuide />} />
        <Route path="*" element={<ComingSoon variant="notfound" title="This page doesn't exist." body="Check the link you followed. If you were looking for a guide, its address ends in villoguides.com." />} />
      </Routes>
    </div>
  );
}
