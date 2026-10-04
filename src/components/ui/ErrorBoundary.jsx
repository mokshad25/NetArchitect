import { Component } from 'react';

/** Catches render errors and shows a friendly fallback instead of a blank page. */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="container fallback" role="alert">
        <p className="label">Something went wrong</p>
        <h1 className="display h2">This page hit an unexpected error.</h1>
        <p className="lede">
          Your inputs were not sent anywhere — everything runs in your browser. Reload the page to try again.
        </p>
        <p className="mono muted">{String(this.state.error.message || this.state.error)}</p>
        <button type="button" className="btn btn-primary btn-md" onClick={() => window.location.reload()}>
          Reload page
        </button>
      </div>
    );
  }
}
