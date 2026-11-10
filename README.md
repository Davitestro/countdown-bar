# Countdown Bar

A minimal, animated countdown progress bar for the GNOME Shell top panel.

Countdown Bar provides a compact visual representation of progress between two dates. It lives directly in the GNOME top panel, displaying a gradient progress indicator and percentage, with an interactive popup showing detailed countdown information.

<p align="center">
  <strong>Minimal design. Real-time progress. Always visible.</strong>
</p>

## Features

- **Top Panel Integration** — A compact progress bar displayed directly in the GNOME top panel.
- **Real-Time Updates** — Automatically updates progress every second.
- **Interactive Popup** — Click the panel indicator to reveal detailed countdown information.
- **Smooth Animations** — Subtle transitions for progress updates and popup appearance.
- **Remaining Time** — Displays the exact remaining days, hours, minutes, and seconds.
- **Gradient Styling** — A clean gradient fill with a translucent background track.
- **Multi-Monitor Support** — Positions the popup relative to the monitor containing the panel indicator.

## Preview

<!-- Add screenshots or GIFs here -->

<p align="center">
  <em>Screenshots coming soon.</em>
</p>

## Installation

### From GNOME Extensions

Once published, Countdown Bar will be available through the GNOME Extensions website.

### Manual Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Davitestro/countdown-bar.git
   ```

2. Create the extension directory:

   ```bash
   mkdir -p ~/.local/share/gnome-shell/extensions/countdown-bar@davit
   ```

3. Copy the extension files:

   ```bash
   cp countdown-bar/extension.js countdown-bar/metadata.json \
      ~/.local/share/gnome-shell/extensions/countdown-bar@davit/
   ```

4. Log out and log back in to refresh GNOME Shell's extension discovery.

5. Enable the extension:

   ```bash
   gnome-extensions enable countdown-bar@davit
   ```

## Configuration

Countdown Bar currently uses configuration constants defined directly in `extension.js`.

| Constant | Description |
|---|---|
| `START_DATE` | Beginning of the countdown period |
| `END_DATE` | End of the countdown period |
| `BAR_WIDTH` | Width of the panel progress bar |
| `BAR_HEIGHT` | Height of the panel progress bar |
| `POPUP_BAR_WIDTH` | Width of the popup progress bar |
| `POPUP_BAR_HEIGHT` | Height of the popup progress bar |
| `SHOW_PANEL_LABEL` | Show or hide the percentage in the panel |
| `PERCENT_DECIMALS` | Number of decimal places in popup percentage |

### Example

```javascript
const START_DATE = '2026-01-31T00:00:00+04:00';
const END_DATE = '2027-08-01T00:00:00+04:00';

const BAR_WIDTH = 140;
const BAR_HEIGHT = 6;
const POPUP_BAR_WIDTH = 220;
const POPUP_BAR_HEIGHT = 8;
const SHOW_PANEL_LABEL = true;
const PERCENT_DECIMALS = 4;
```

Dates use ISO 8601 format, including an explicit timezone offset.

## Requirements

- GNOME Shell 50
- Linux desktop running GNOME Shell
- JavaScript support through GNOME's GJS runtime

## Development

The extension uses native GNOME Shell technologies:

- **GJS** — JavaScript runtime for GNOME.
- **St** — GNOME Shell UI toolkit.
- **Clutter** — UI layout, animations, and interaction.
- **GLib** — Timers and event-loop integration.

### Useful Commands

```bash
# Enable
gnome-extensions enable countdown-bar@davit

# Disable
gnome-extensions disable countdown-bar@davit

# Inspect extension
gnome-extensions info countdown-bar@davit

# Follow GNOME Shell logs
journalctl -f -o cat /usr/bin/gnome-shell
```

## Roadmap

- [ ] Preferences window for configuring countdown dates.
- [ ] Customizable colors and gradient styles.
- [ ] Configurable panel position and dimensions.
- [ ] Multiple countdown profiles.
- [ ] Improved compatibility across GNOME Shell versions.
- [ ] Additional visual themes.

## Contributing

Contributions, bug reports, and suggestions are welcome.

If you encounter a bug or have an idea for an improvement, feel free to open an issue or submit a pull request.

## License

This project is distributed under the MIT License. See [LICENSE](LICENSE) for details.

## Author

**Davit (Davitestro)**

GitHub: [@Davitestro](https://github.com/Davitestro)

---

<p align="center">
  Made for GNOME Shell.
</p>
