import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import St from 'gi://St';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

const PANEL_BAR_WIDTH = 140;
const PANEL_BAR_HEIGHT = 6;
const POPUP_BAR_WIDTH = 220;
const POPUP_BAR_HEIGHT = 8;

const PANEL_UPDATE_SECONDS = 60;
const POPUP_UPDATE_SECONDS = 1;

/**
 * @param {number} start start time in ms (may be NaN)
 * @param {number} end end time in ms (may be NaN)
 * @returns {{valid: boolean, progress: number, remaining: number}}
 */
function getProgress(start, end) {
    const total = end - start;
    if (!(total > 0))
        return {valid: false, progress: 0, remaining: 0};

    const now = Date.now();
    const progress = Math.max(0, Math.min(1, (now - start) / total));
    return {valid: true, progress, remaining: end - now};
}

const ProgressBar = GObject.registerClass(
class CountdownProgressBar extends St.Widget {
    constructor(width, height, styleClass) {
        super({
            style_class: `countdown-bar-track ${styleClass}`,
            width,
            height,
            y_align: Clutter.ActorAlign.CENTER,
            clip_to_allocation: true,
        });

        this._fullWidth = width;

        this._fill = new St.Widget({
            style_class: 'countdown-bar-fill',
            x: 0,
            y: 0,
            width: 0,
            height,
        });
        this.add_child(this._fill);
    }

    setProgress(progress, animate) {
        const minWidth = this._fullWidth > 40 ? 6 : 2;
        const width = progress <= 0
            ? 0
            : Math.max(minWidth, Math.round(this._fullWidth * progress));

        if (animate) {
            this._fill.ease({
                width,
                duration: 600,
                mode: Clutter.AnimationMode.EASE_OUT_QUAD,
            });
        } else {
            this._fill.remove_all_transitions();
            this._fill.width = width;
        }
    }

    destroy() {
        this._fill?.remove_all_transitions();
        super.destroy();
    }
});

const CountdownIndicator = GObject.registerClass(
class CountdownIndicator extends PanelMenu.Button {
    constructor(settings) {
        super(0.0, 'Countdown Bar', false);

        this._settings = settings;
        this._panelTimerId = null;
        this._popupTimerId = null;

        this._readSettings();
        this._buildPanel();
        this._buildMenu();

        this._settingsChangedId = this._settings.connect('changed', () => {
            this._readSettings();
            this._update(false);
            this._updatePopup(false);
        });

        this.menu.connect('open-state-changed', (_menu, open) => {
            this._onMenuToggled(open);
        });

        this._update(false);
        this._updatePopup(false);

        this._panelTimerId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            PANEL_UPDATE_SECONDS,
            () => {
                this._update(true);
                return GLib.SOURCE_CONTINUE;
            }
        );
    }

    _readSettings() {
        this._startDate = new Date(this._settings.get_string('start-date'));
        this._endDate = new Date(this._settings.get_string('end-date'));
        this._decimals = this._settings.get_int('percent-decimals');

        if (this._panelLabel)
            this._panelLabel.visible = this._settings.get_boolean('show-panel-label');
    }

    _buildPanel() {
        const box = new St.BoxLayout({
            style_class: 'countdown-bar-box',
            y_align: Clutter.ActorAlign.CENTER,
        });

        this._panelBar = new ProgressBar(
            PANEL_BAR_WIDTH, PANEL_BAR_HEIGHT, 'countdown-bar-panel');
        box.add_child(this._panelBar);

        this._panelLabel = new St.Label({
            style_class: 'countdown-bar-label',
            y_align: Clutter.ActorAlign.CENTER,
            visible: this._settings.get_boolean('show-panel-label'),
        });
        box.add_child(this._panelLabel);

        this.add_child(box);
    }

    _buildMenu() {
        const item = new PopupMenu.PopupBaseMenuItem({
            reactive: false,
            can_focus: false,
        });

        const box = new St.BoxLayout({
            style_class: 'countdown-bar-popup',
            vertical: true,
            x_expand: true,
        });

        box.add_child(new St.Label({
            style_class: 'countdown-bar-title',
            text: 'DEMOBILIZATION',
        }));

        this._popupPercent = new St.Label({style_class: 'countdown-bar-percent'});
        box.add_child(this._popupPercent);

        this._popupBar = new ProgressBar(
            POPUP_BAR_WIDTH, POPUP_BAR_HEIGHT, 'countdown-bar-popup-bar');
        this._popupBar.x_align = Clutter.ActorAlign.START;
        box.add_child(this._popupBar);

        this._popupRemaining = new St.Label({style_class: 'countdown-bar-remaining'});
        box.add_child(this._popupRemaining);

        this._popupStart = new St.Label({style_class: 'countdown-bar-date'});
        box.add_child(this._popupStart);

        this._popupEnd = new St.Label({style_class: 'countdown-bar-date'});
        box.add_child(this._popupEnd);

        item.add_child(box);
        this.menu.addMenuItem(item);
    }

    _update(animate) {
        const {progress} = getProgress(
            this._startDate.getTime(), this._endDate.getTime());

        this._panelBar.setProgress(progress, animate);
        this._panelLabel.text = `${(progress * 100).toFixed(2)}%`;
    }

    _updatePopup(animate) {
        const {valid, progress, remaining} = getProgress(
            this._startDate.getTime(), this._endDate.getTime());

        this._popupPercent.text = `${(progress * 100).toFixed(this._decimals)}%`;
        this._popupBar.setProgress(progress, animate);

        const fmt = d => d.toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
        });
        this._popupStart.text = `From  ${fmt(this._startDate)}`;
        this._popupEnd.text = `To      ${fmt(this._endDate)}`;

        if (!valid) {
            this._popupRemaining.text = 'Invalid date range';
        } else if (remaining <= 0) {
            this._popupRemaining.text = 'Demobilization complete';
        } else {
            let seconds = Math.floor(remaining / 1000);
            const days = Math.floor(seconds / 86400);
            seconds %= 86400;
            const hours = Math.floor(seconds / 3600);
            seconds %= 3600;
            const minutes = Math.floor(seconds / 60);
            seconds %= 60;
            this._popupRemaining.text = `${days}d ${hours}h ${minutes}m ${seconds}s left`;
        }
    }

    _onMenuToggled(open) {
        this._stopPopupTimer();

        if (!open)
            return;

        this._updatePopup(false);

        // Tick every second only while the popup is visible.
        this._popupTimerId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            POPUP_UPDATE_SECONDS,
            () => {
                this._updatePopup(true);
                return GLib.SOURCE_CONTINUE;
            }
        );
    }

    _stopPopupTimer() {
        if (this._popupTimerId !== null) {
            GLib.source_remove(this._popupTimerId);
            this._popupTimerId = null;
        }
    }

    destroy() {
        if (this._panelTimerId !== null) {
            GLib.source_remove(this._panelTimerId);
            this._panelTimerId = null;
        }
        this._stopPopupTimer();

        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = null;
        }
        this._settings = null;

        super.destroy();
    }
});

export default class CountdownBarExtension extends Extension {
    enable() {
        this._indicator = new CountdownIndicator(this.getSettings());
        Main.panel.addToStatusArea(this.uuid, this._indicator, 0, 'left');
    }

    disable() {
        this._indicator?.destroy();
        this._indicator = null;
    }
}