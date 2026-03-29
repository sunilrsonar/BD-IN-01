import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/game.css";

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="page home-page">
          <div className="panel loading-panel">
            <h2>App Error</h2>
            <p>{String(this.state.error.message || this.state.error)}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);

try {
  root.render(
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  );
} catch (error) {
  root.render(
    <div className="page home-page">
      <div className="panel loading-panel">
        <h2>Boot Error</h2>
        <p>{String(error.message || error)}</p>
      </div>
    </div>
  );
}
