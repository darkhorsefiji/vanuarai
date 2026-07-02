import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { get } from "./api";

const Ctx = createContext({ map: {}, list: [], refresh: () => {} });

export function LevelsProvider({ children }) {
  const [list, setList] = useState([]);
  const refresh = useCallback(
    () =>
      get("/level-styles")
        .then(setList)
        .catch(() => {}),
    []
  );
  useEffect(() => {
    refresh();
  }, [refresh]);
  const map = Object.fromEntries(list.map((s) => [s.level, s]));
  return <Ctx.Provider value={{ map, list, refresh }}>{children}</Ctx.Provider>;
}

export const useLevels = () => useContext(Ctx);

// Badge that reads colour + label from the DB-driven styles (falls back to CSS + enum).
export function LevelBadge({ level }) {
  const { map } = useLevels();
  const s = map[level];
  return (
    <span
      className={"lvl " + level}
      style={s ? { background: s.color } : undefined}
    >
      {s ? s.label : level}
    </span>
  );
}

// English equivalent shown in brackets after the pill (DB-driven, DEV-editable).
export function LevelEn({ level }) {
  const { map } = useLevels();
  const en = map[level]?.label_en;
  return en ? <span className="lvlen">({en})</span> : null;
}
