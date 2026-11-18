# Countdown Bar

GNOME Shell extension that shows a progress bar in the top panel between a configurable start and end date.
Click it for a popup with the exact percentage and time remaining.

Configure dates and display options in the extension's Preferences window.

## Install from source

    git clone <this repo> ~/.local/share/gnome-shell/extensions/countdown-bar@davit
    gnome-extensions enable countdown-bar@davit

## Build zip

    gnome-extensions pack --force --extra-source=prefs.js .