import { Component } from 'react';

// Keep navigation and the list usable if a map chunk or the map renderer fails.
export default class MarketplaceMapBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <div role="alert" className="marketplace-map-message">
      <p>The map could not open. Your search and filters are still available in List View.</p>
      <button type="button" className="clear-filters" onClick={this.props.onListView}>Browse List View</button>
    </div>;
    return this.props.children;
  }
}
