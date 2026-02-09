// Minimal react-dom shim for React Native
// @clerk/clerk-react imports react-dom for createPortal (web-only feature)
// This shim satisfies the import without pulling in the full react-dom package

module.exports = {
  createPortal: (children) => children,
  flushSync: (fn) => fn(),
  unstable_batchedUpdates: (fn) => fn(),
};
