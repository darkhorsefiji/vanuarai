import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import OutcomeBoard from "../OutcomeBoard";
import ScorecardTreePrototype, {
  PrototypeSwitcher,
} from "../ScorecardTreePrototype";

// The Outcome Framework scorecard. Default = the live board. A throwaway layout
// prototype for the re-designed horizontal tree is mounted here behind
// ?variant=A|B|C (switcher visible on localhost only). See ScorecardTreePrototype.
export default function Outcomes() {
  const [params, setParams] = useSearchParams();
  const variant = params.get("variant") || "";
  const isProto = ["A", "B", "C"].includes(variant);
  const pick = (key) => {
    const next = new URLSearchParams(params);
    if (key) next.set("variant", key);
    else next.delete("variant");
    setParams(next, { replace: true });
  };

  // ←/→ cycle variants (ignore while typing in a field)
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      )
        return;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const opts = ["", "A", "B", "C"];
        const i = Math.max(0, opts.indexOf(variant));
        const d = e.key === "ArrowRight" ? 1 : -1;
        pick(opts[(i + d + opts.length) % opts.length]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Scorecard</h1>
          <p className="sub">
            {isProto ? (
              <>
                <b>Layout prototype ({variant})</b> — horizontal tree with
                sample data. Use the switcher (top-right) or ←/→ to compare;
                “Live board” returns to the real data.
              </>
            ) : (
              <>
                Long-term Outcomes classified by Vanua focus area, Government
                (TAB) platform and industry (ISIC) — indicators roll up every
                level. Variances are closed by tasks, interventions and
                projects; impediments are logged as challenges.
              </>
            )}
          </p>
        </div>
      </div>

      {isProto ? (
        <ScorecardTreePrototype variant={variant} />
      ) : (
        <OutcomeBoard />
      )}
      <PrototypeSwitcher current={variant} onPick={pick} />
    </>
  );
}
