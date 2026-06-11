import { EditableText } from '../copy'

export default function Admin() {
  return (
    <>
      <div className="pagetop">
        <h1>Village Admin</h1>
        <EditableText id="admin.sub" className="sub" html>{'Portal-wide settings. Records (Profile notes & location, Vanua/Provincial hierarchy, Family composition) are edited <b>inline on their own pages</b> — open the page and use its <b>Edit</b> button.'}</EditableText>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        <h3>Coming soon</h3>
        <p className="sub" style={{ margin: 0 }}>Member approvals, office assignments and other village administration will live here. Hierarchy element styling has moved to <b>Developer Settings</b>.</p>
      </div>
    </>
  )
}
