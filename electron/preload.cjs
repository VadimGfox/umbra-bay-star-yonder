const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("garageDesktop", {
  portable: true,
});
