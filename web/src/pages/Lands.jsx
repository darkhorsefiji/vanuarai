import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useData, get, fjd } from "../api";
import { makeBaseLayers } from "../map";
import { EditableText } from "../copy";

const money = (c) => (c ? fjd(c) : "—");

export default function Lands() {
  const { data: requests } = useData("/land-requests");
  const { data: allocs } = useData("/land-allocations");
  const [coords, setCoords] = useState(null);
  const [iface, setIface] = useState("");
  const mapDiv = useRef(null);
  const mapObj = useRef(null);

  useEffect(() => {
    get("/profile")
      .then((p) => {
        if (p.latitude && p.longitude)
          setCoords({ lat: p.latitude, lon: p.longitude });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!coords || !mapDiv.current || mapObj.current) return;
    const { lat, lon } = coords;
    const map = L.map(mapDiv.current, { scrollWheelZoom: false }).setView(
      [lat, lon],
      15
    );
    mapObj.current = map;
    const layers = makeBaseLayers();
    layers.Street.addTo(map);
    L.control.layers(layers, null, { collapsed: true }).addTo(map);

    const P = 0.0022;
    const parcels = [
      {
        name: "Parcel A · Navuni",
        color: "#0e98a5",
        b: [
          [lat - P, lon - 3 * P],
          [lat + P, lon - P],
        ],
      },
      {
        name: "Parcel B · Tokatoka A1a",
        color: "#46a877",
        b: [
          [lat - P, lon - P],
          [lat + P, lon + P],
        ],
      },
      {
        name: "Parcel C · Tokatoka A1b",
        color: "#f4a72c",
        b: [
          [lat - P, lon + P],
          [lat + P, lon + 3 * P],
        ],
      },
    ];
    parcels.forEach((p) =>
      L.rectangle(p.b, { color: p.color, weight: 2, fillOpacity: 0.1 })
        .addTo(map)
        .bindTooltip(p.name, {
          permanent: true,
          direction: "center",
          className: "parcel-label",
        })
    );

    const h = 0.00042;
    const blds = [
      { n: "🏛 Village Hall", c: "#c0492f", at: [lat + 0.0006, lon - 0.0016] },
      { n: "⛪ Church", c: "#5a4fcf", at: [lat - 0.0009, lon - 0.003] },
      { n: "🏪 Shop", c: "#d98a6b", at: [lat + 0.0009, lon + 0.0024] },
      { n: "🏠 Houses", c: "#6f8a8f", at: [lat - 0.0006, lon + 0.0006] },
      { n: "🏠 Houses", c: "#6f8a8f", at: [lat + 0.0003, lon + 0.0002] },
      { n: "🏠 Houses", c: "#6f8a8f", at: [lat - 0.0012, lon + 0.0016] },
    ];
    blds.forEach((b) =>
      L.rectangle(
        [
          [b.at[0] - h, b.at[1] - h],
          [b.at[0] + h, b.at[1] + h],
        ],
        { color: b.c, weight: 1, fillColor: b.c, fillOpacity: 0.55 }
      )
        .addTo(map)
        .bindTooltip(b.n)
    );

    map.fitBounds([
      [lat - 2.6 * P, lon - 3.4 * P],
      [lat + 2.6 * P, lon + 3.4 * P],
    ]);
  }, [coords]);

  return (
    <>
      <div className="pagetop">
        <h1>Lands</h1>
        <EditableText id="lands.sub" className="sub">
          Customary and leased land for the village — Mataqali parcels,
          requests, allocations and iTLTB leases.
        </EditableText>
      </div>

      <div className="cols">
        <div className="col">
          <h3 style={{ marginTop: 8 }}>Land Requests</h3>
          <p className="sub">
            Approval pipeline — VKB-registered Mataqali members aged 18+ vote on
            each request.
          </p>
          <div className="scrollbox">
            <table className="tight">
              <thead>
                <tr>
                  <th>Requester</th>
                  <th>Purpose</th>
                  <th>Size</th>
                  <th>Est. Rent</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {!requests ? (
                  <tr>
                    <td colSpan={5} className="meta">
                      Loading…
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r.id}>
                      <td>{r.requester}</td>
                      <td>{r.purpose}</td>
                      <td>{r.size}</td>
                      <td>
                        {r.est_rent_cents ? fjd(r.est_rent_cents) + "/yr" : "—"}
                      </td>
                      <td>
                        <span className={"lchip " + r.status.toLowerCase()}>
                          {r.status}
                          {r.voters_eligible
                            ? ` · ${r.votes_for}/${r.voters_eligible}`
                            : ""}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <h3 style={{ marginTop: 22 }}>Land Allocation Register</h3>
          <div className="scrollbox tall">
            <table className="tight">
              <thead>
                <tr>
                  <th>Leasee</th>
                  <th>Purpose</th>
                  <th>Term</th>
                  <th>Expiry</th>
                  <th>Lease Mgt</th>
                  <th>Premium</th>
                  <th>Rent/Yr</th>
                </tr>
              </thead>
              <tbody>
                {!allocs ? (
                  <tr>
                    <td colSpan={7} className="meta">
                      Loading…
                    </td>
                  </tr>
                ) : (
                  allocs.map((a) => (
                    <tr key={a.id}>
                      <td>{a.leasee}</td>
                      <td>{a.purpose}</td>
                      <td>{a.term}</td>
                      <td>{a.expiry}</td>
                      <td>
                        <span
                          className={
                            "lchip " +
                            (a.lease_mgt === "iTLTB" ? "itltb" : "village")
                          }
                        >
                          {a.lease_mgt}
                        </span>
                      </td>
                      <td>{money(a.premium_cents)}</td>
                      <td>{money(a.rent_year_cents)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="col">
          <h3 style={{ marginTop: 8 }}>Mataqali Lands</h3>
          {coords ? (
            <div ref={mapDiv} className="landmap" />
          ) : (
            <p className="meta">
              Pin the village location on the Profile page to show the map.
            </p>
          )}

          <h3 style={{ marginTop: 22 }}>Interfaces</h3>
          <div className="card ifacecard">
            <div className="gc-title">iTLTB</div>
            <div className="gc-name">Lease Payments</div>
            <p className="sub" style={{ marginTop: 2 }}>
              Import lease-payment records from the iTaukei Land Trust Board
              against the allocation register.
            </p>
            <button
              className="btn secondary"
              onClick={() =>
                setIface(
                  "iTLTB lease-payment import is not wired yet — integration pending."
                )
              }
            >
              Import from iTLTB →
            </button>
          </div>
          <div className="card ifacecard">
            <div className="gc-title">NLC</div>
            <div className="gc-name">VKB Listings</div>
            <p className="sub" style={{ marginTop: 2 }}>
              Import the Vola ni Kawa Bula register of Mataqali members from the
              Native Lands Commission (sets voter eligibility).
            </p>
            <button
              className="btn secondary"
              onClick={() =>
                setIface(
                  "NLC VKB-listing import is not wired yet — integration pending."
                )
              }
            >
              Import from NLC →
            </button>
          </div>
          {iface && (
            <p className="note" style={{ marginTop: 10 }}>
              {iface}
            </p>
          )}
        </aside>
      </div>
    </>
  );
}
