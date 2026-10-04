const SECTIONS = [
  ['topology', 'Topology'],
  ['feature', 'Features'],
  ['addressing', 'IP addressing'],
  ['diagram', 'About the diagram'],
  ['warning', 'Problems'],
];

/** Explanation tab: "Why this design?" as a numbered list in readable prose width. */
export default function ExplanationView({ items }) {
  // Number items continuously across groups, in display order.
  const groups = SECTIONS.map(([cat, title]) => [cat, title, items.filter((it) => it.category === cat)]).filter(
    ([, , list]) => list.length,
  );
  const numbered = groups.flatMap(([, , list]) => list);
  return (
    <div className="explain">
      <header className="panel-head">
        <p className="label">Explanation</p>
        <h2 className="display h3">Why this design?</h2>
      </header>
      {groups.map(([cat, title, list]) => {
        return (
          <section key={cat} className="explain-group" aria-label={title}>
            <h3 className="label">{title}</h3>
            <ol className="explain-list">
              {list.map((it) => {
                const n = numbered.indexOf(it) + 1;
                return (
                  <li key={`${cat}-${it.title}`} className={cat === 'warning' ? 'is-warning' : undefined}>
                    <span className="explain-n mono" aria-hidden="true">
                      {String(n).padStart(2, '0')}
                    </span>
                    <div>
                      <p className="title">{it.title}</p>
                      <p className="muted-strong">{it.text}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
