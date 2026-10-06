import { CREDITS, LICENSE_URLS } from '../game/credits';

export function CreditsScreen({ onBack }: { onBack(): void }) {
  return (
    <div className="screen menu-bg">
      <div className="panel credits-panel">
        <h2>Credits</h2>
        <p><b>Iron Front</b> is an independent browser RTS inspired by classic isometric real-time strategy games. Design and code were made for this project.</p>
        <p>Third-party 3D models are rendered into isometric sprites at load time (32 facings, team colors). Sound effects and music are openly licensed recordings (see the table); while they load, the game falls back to live synthesized sounds. Voice announcements use your browser's speech synthesis.</p>
        <table className="credit-table">
          <thead><tr><th>Used for</th><th>Asset</th><th>Author</th><th>License</th></tr></thead>
          <tbody>
            {CREDITS.map((c) => (
              <tr key={c.what + c.title}>
                <td>{c.what}{c.changes && <><br /><small>Modified: {c.changes}</small></>}</td>
                <td><a href={c.url} target="_blank" rel="noreferrer">{c.title}</a></td>
                <td>{c.authorUrl ? <a href={c.authorUrl} target="_blank" rel="noreferrer">{c.author}</a> : c.author}</td>
                <td><a href={LICENSE_URLS[c.license]} target="_blank" rel="noreferrer">{c.license}</a></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="hint">Models were modified: scaled, recolored (team colors) and rendered to 2D sprites. Sounds were trimmed, converted to mono or to a smaller format; music was only re-encoded (AAC). No assets, logos, music or voices from Command &amp; Conquer or other EA products. Full attribution and license texts: <a href={`${import.meta.env.BASE_URL}assets/licenses/CREDITS.txt`} target="_blank" rel="noreferrer">assets/licenses/CREDITS.txt</a>.</p>
        <button className="btn" onClick={onBack}>Back</button>
      </div>
    </div>
  );
}
