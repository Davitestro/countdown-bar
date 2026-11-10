import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import St from 'gi://St';

// ---- Configuration (edit here) ----
const START_DATE = '2026-01-31T00:00:00+10:00';
const END_DATE = '2027-08-01T00:00:00+10:00';

const BAR_WIDTH = 140;
const BAR_HEIGHT = 6;
const POPUP_BAR_WIDTH = 220;
const POPUP_BAR_HEIGHT = 8;
const SHOW_PANEL_LABEL = true;
const PERCENT_DECIMALS = 4;

const COLOR_TRACK = 'rgba(180, 220, 255, 0.16)';
const COLOR_FROM = '#ffffff';
const COLOR_TO = '#4fb6ff';
// -----------------------------------

const trackStyle = h =>
    background-color: ${COLOR_TRACK}; border-radius: ${h}px;;

const fillStyle = h =>
    background-gradient-direction: horizontal;  +
    background-gradient-start: ${COLOR_FROM};  +
    background-gradient-end: ${COLOR_TO};  +
    border-radius: ${h}px;;

export default class CountdownBarExtension extends Extension {
    enable() {
        this.startDate = new Date(START_DATE);
        this.endDate = new Date(END_DATE);

        this._popup = null;
        this._popupVisible = false;
        this._timerId = null;
        this._stageClickId = null;

        this._createPanelItem();
        this._update(false);

        this._timerId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            1,
            () => {
                this._update(true);

                if (this._popupVisible)
                    this._updatePopup();

                return GLib.SOURCE_CONTINUE;
            }
        );
    }

    _createPanelItem() {
        // Centered vertically in the panel (no translation hacks)
        this._container = new St.BoxLayout({
            vertical: false,
            reactive: true,
            track_hover: true,
            y_align: Clutter.ActorAlign.CENTER,
            y_expand: false,
            style: 'spacing: 8px; margin-left: 8px; margin-right: 8px; padding: 0px;',
        });

        this._barBackground = new St.Widget({
            width: BAR_WIDTH,
            height: BAR_HEIGHT,
            y_align: Clutter.ActorAlign.CENTER,
            y_expand: false,
            clip_to_allocation: true,
            style: trackStyle(BAR_HEIGHT),
        });

        this._barFill = new St.Widget({
            x: 0,
            y: 0,
            width: 0,
            height: BAR_HEIGHT,
            style: fillStyle(BAR_HEIGHT),
        });

        this._barBackground.add_child(this._barFill);
        this._container.add_child(this._barBackground);

        if (SHOW_PANEL_LABEL) {
            this._panelLabel = new St.Label({
                text: '',
                y_align: Clutter.ActorAlign.CENTER,
                style: 'font-size: 11px; font-weight: 600; color: rgba(255, 255, 255, 0.75);',
            });
            this._container.add_child(this._panelLabel);
        }

        this._container.connect('button-press-event', () => {
            this._togglePopup();
            return Clutter.EVENT_STOP;
        });

        this._container.connect('notify::hover', () => {
            if (!this._barFill)
                return;
            this._container.ease({
                opacity: this._container.hover ? 255 : 215,
                duration: 150,
                mode: Clutter.AnimationMode.EASE_OUT_QUAD,
            });
        });
        this._container.opacity = 215;

        Main.panel._leftBox.add_child(this._container);
    }

    _getProgress() {
        const now = Date.now();
        const start = this.startDate.getTime();
        const end = this.endDate.getTime();

        const total = end - start;
        const remaining = end - now;

        if (total <= 0)
            return {progress: 0, remaining: 0, total};

        const progress = Math.max(0, Math.min(1, (now - start) / total));
        return {progress, remaining, total};
    }

    _fillWidth(progress, full) {
        if (progress <= 0)
            return 0;
        return Math.max(full > 40 ? 6 : 2, Math.round(full * progress));
    }

    _setFill(actor, width, animate) {
        if (!actor)
            return;
        if (animate) {
            actor.ease({
                width,
                duration: 600,
                mode: Clutter.AnimationMode.EASE_OUT_QUAD,
            });
        } else {
            actor.width = width;
        }
    }

    _update(animate) {
        if (!this._barFill)
            return;

        const {progress, remaining, total} = this._getProgress();

        if (total <= 0) {
            this._setFill(this._barFill, 0, false);
            return;
        }

        this._setFill(
            this._barFill,
            remaining <= 0 ? BAR_WIDTH : this._fillWidth(progress, BAR_WIDTH),
            animate
        );

        if (this._panelLabel)
            this._panelLabel.text = ${(progress * 100).toFixed(2)}%;
    }

    _togglePopup() {
        if (this._popupVisible)
            this._hidePopup();
        else
            this._showPopup();
    }

    _showPopup() {
        if (this._popup)
            return;

        this._popupVisible = true;

        this._popup = new St.BoxLayout({
            vertical: true,
            reactive: true,
            opacity: 0,
            x_align: Clutter.ActorAlign.START,
            y_align: Clutter.ActorAlign.START,
            x_expand: false,
            y_expand: false,
            style: 'padding: 18px 22px; spacing: 6px; ' +
                'background-color: rgba(24, 24, 28, 0.96); ' +
                'border-radius: 18px; ' +
                'border: 1px solid rgba(255, 255, 255, 0.10); ' +
                'box-shadow: 0 8px 28px rgba(0, 0, 0, 0.55); ' +
                min-width: ${POPUP_BAR_WIDTH}px;,
        });

        this._popupTitle = new St.Label({
            text: 'DEMOBILIZATION',
            style: 'font-size: 10px; font-weight: bold; letter-spacing: 2px; color: rgba(255, 255, 255, 0.50);',
        });

        this._popupProgress = new St.Label({
            text: '0%',
            style: 'font-size: 30px; font-weight: bold;',
        });

        this._popupBarBg = new St.Widget({
            width: POPUP_BAR_WIDTH,
            height: POPUP_BAR_HEIGHT,
            x_align: Clutter.ActorAlign.START,
            clip_to_allocation: true,
            style: trackStyle(POPUP_BAR_HEIGHT),
        });

        this._popupBarFill = new St.Widget({
            x: 0,
            y: 0,
            width: 0,
            height: POPUP_BAR_HEIGHT,
            style: fillStyle(POPUP_BAR_HEIGHT),
        });
        this._popupBarBg.add_child(this._popupBarFill);

        this._popupRemaining = new St.Label({
            text: '',
            style: 'font-size: 13px; font-weight: 600; margin-top: 4px;',
        });

        const dateStyle = 'font-size: 10px; color: rgba(255, 255, 255, 0.50);';
        const fmt = d => d.toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
        });

        this._popupStart = new St.Label({
            text: From  ${fmt(this.startDate)},
            style: dateStyle + ' margin-top: 4px;',
        });

        this._popupEnd = new St.Label({
            text: To      ${fmt(this.endDate)},
            style: dateStyle,
        });

        this._popup.add_child(this._popupTitle);
        this._popup.add_child(this._popupProgress);
        this._popup.add_child(this._popupBarBg);
        this._popup.add_child(this._popupRemaining);
        this._popup.add_child(this._popupStart);
        this._popup.add_child(this._popupEnd);

        Main.layoutManager.addChrome(this._popup);

        this._stageClickId = global.stage.connect(
            'button-press-event',
            (_actor, event) => {
                const src = event.get_source();

                const insidePopup = this._popup && src && this._popup.contains(src);
                const insideBar = this._container && src && this._container.contains(src);

                if (!insidePopup && !insideBar)
                    this._hidePopup();

                return Clutter.EVENT_PROPAGATE;
            }
        );

        this._lastPopupPos = null;
        this._popupAllocId = this._popup.connect(
            'notify::allocation',
            () => this._positionPopup()
        );

        this._updatePopup(false);
        this._positionPopup();

        this._popup.ease({
            opacity: 255,
            duration: 160,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
        });
    }

    _positionPopup() {
        if (!this._popup || !this._container)
            return;

        // Anchor to the real bottom edge of the panel, on the monitor the bar lives on
        const panel = Main.panel;
        const [, panelY] = panel.get_transformed_position();
        const panelBottom = Math.floor(panelY + panel.get_height());

        const [barX] = this._container.get_transformed_position();
        const monitor =
            Main.layoutManager.findMonitorForActor(this._container) ??
            Main.layoutManager.primaryMonitor;

        const popupWidth = this._popup.get_width();
        let px = Math.floor(barX);

        if (monitor) {
            px = Math.max(
                monitor.x + 8,
                Math.min(px, monitor.x + monitor.width - popupWidth - 8)
            );
        }

        const py = panelBottom + 8;

        // Avoid needless relayout loops
        const key = ${px},${py};
        if (this._lastPopupPos === key)
            return;

        this._lastPopupPos = key;
        this._popup.set_position(px, py);
    }

    _updatePopup(animate = true) {
        if (!this._popup)
            return;

        const {progress, remaining} = this._getProgress();

        this._popupProgress.text = ${(progress * 100).toFixed(PERCENT_DECIMALS)}%;

        this._setFill(
            this._popupBarFill,
            remaining <= 0
                ? POPUP_BAR_WIDTH
                : this._fillWidth(progress, POPUP_BAR_WIDTH),
            animate
        );

        if (remaining <= 0) {
            this._popupRemaining.text = 'Demobilization complete';
        } else {
            let seconds = Math.floor(remaining / 1000);

            const days = Math.floor(seconds / 86400);
            seconds %= 86400;

            const hours = Math.floor(seconds / 3600);
            seconds %= 3600;

            const minutes = Math.floor(seconds / 60);
            seconds %= 60;

            this._popupRemaining.text =
                ${days}d ${hours}h ${minutes}m ${seconds}s left;
        }

        this._positionPopup();
    }

    _hidePopup() {
        if (this._stageClickId !== null) {
            global.stage.disconnect(this._stageClickId);
            this._stageClickId = null;
        }

        if (this._popup) {
            Main.layoutManager.removeChrome(this._popup);
            this._popup.destroy();
            this._popup = null;
        }

        this._popupAllocId = null;
        this._lastPopupPos = null;
        this._popupTitle = null;
        this._popupProgress = null;
        this._popupBarBg = null;
        this._popupBarFill = null;
        this._popupRemaining = null;
        this._popupStart = null;
        this._popupEnd = null;
        this._popupVisible = false;
    }

    disable() {
        if (this._timerId !== null) {
            GLib.source_remove(this._timerId);
            this._timerId = null;
        }

        this._hidePopup();

        if (this._container) {
            this._container.destroy();
            this._container = null;
        }

        this._barBackground = null;
        this._barFill = null;
        this._panelLabel = null;
        this.startDate = null;
        this.endDate = null;
    }
}
