function WorkspaceMarker({ workspace, onClick }) {
  return (
    <div className="workspace-marker" onClick={() => onClick?.(workspace)}>
      {/* Map marker for a single workspace */}
      <span>{workspace?.name}</span>
    </div>
  );
}

export default WorkspaceMarker;
