import React from "react";

type State = { hasError: boolean; error?: any; info?: { componentStack: string } };

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };
  
  static getDerivedStateFromError(error: any) { 
    return { hasError: true, error }; 
  }
  
  componentDidCatch(error: any, info: any) { 
    this.setState({ info }); 
    console.error("ErrorBoundary", error, info); 
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16 }}>
          <h2>Something broke in the UI</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>{String(this.state.error)}</pre>
          {this.state.info?.componentStack && <pre style={{ whiteSpace: "pre-wrap" }}>{this.state.info.componentStack}</pre>}
        </div>
      );
    }
    return this.props.children;
  }
}