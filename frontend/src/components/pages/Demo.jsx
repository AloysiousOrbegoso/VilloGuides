import { useEffect } from "react";
import { casaDeVista } from "../../data/casaDeVista";
import { applyMode } from "../../lib/theme";
import { GuideRoot } from "../shell/GuideRoot";

/** demo.villoguides.com: the Casa de Vista sample, through the same renderer as real guides. */
export default function Demo() {
  useEffect(() => {
    applyMode("light");
    document.title = "Casa de Vista, sample guidebook";
  }, []);
  return <GuideRoot content={casaDeVista} page demo />;
}
