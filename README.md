# BuildSim 0.2.0

2D engineering sandbox for Android. Build devices from components and test interactive electrical and fluid systems.

## Version 0.2.0

- **Liquid mixing system:** new ingredients (syrup, milk, juice concentrate), powered two-input mixer, adjustable input ratio, and recipes for lemonade, milk drink, milkshake, and juice.
- **Realistic liquid controls:** configurable pump flow and pressure, pipe diameter, valve opening, pressure loss, heater target temperature, and liquid temperature/pressure readings.
- **New electronics:** LED, buzzer, digital display, pulse counter, relay, temperature sensor, pressure sensor, comparator, and control panel.
- **Project manager:** create, open, rename, and delete multiple projects; import/export projects as JSON; migrate the previous single-save project automatically.
- Existing circuits, parts, and the original saved project are retained.

## Build APK

Open the **Actions** tab and run **Build BuildSim APK** (or push a change to `main`). The debug APK is uploaded as an artifact named `BuildSim-debug-apk`.

## Notes

Projects are stored locally on the device. Use JSON export/import to transfer a project to another device. The liquid model is a simplified engineering approximation, not a full computational fluid-dynamics solver.
