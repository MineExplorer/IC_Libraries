function createInnerCoreMock() {
  const api = {};
  const callbacks = {};
  const logs = [];
  const alerts = [];

  const context = {
    LIBRARY() {},
    Translation: {
      addTranslation() {}
    },
    Callback: {
      addCallback(name, callback) {
        callbacks[name] = callback;
      }
    },
    TileEntity: {
      getTileEntity() {
        return null;
      }
    },
    Debug: {
      sysTime() {
        return 0;
      }
    },
    EXPORT(name, value) {
      api[name] = value;
    },
    Logger: {
      Log(...args) {
        logs.push(args);
      }
    },
    alert(...args) {
      alerts.push(args);
    }
  };

  return { api, callbacks, logs, alerts, context };
}

module.exports = { createInnerCoreMock };
