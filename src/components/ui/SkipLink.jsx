/** First focusable element on every page; jumps past the navbar. */
export default function SkipLink() {
  return (
    <a className="skip-link" href="#content">
      Skip to content
    </a>
  );
}
