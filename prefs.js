import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

/**
 * @param {string} text ISO 8601 timestamp, e.g. 2026-01-31T00:00:00+10:00
 * @returns {boolean} whether the text parses as an ISO 8601 date
 */
function isValidIso(text) {
    return GLib.DateTime.new_from_iso8601(text, null) !== null;
}

export default class CountdownBarPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage({
            title: 'General',
            icon_name: 'preferences-system-symbolic',
        });
        window.add(page);

        const dates = new Adw.PreferencesGroup({
            title: 'Dates',
            description: 'Use ISO 8601 with a UTC offset, e.g. 2026-01-31T00:00:00+10:00',
        });
        page.add(dates);

        for (const [key, title] of [['start-date', 'Start date'], ['end-date', 'End date']]) {
            const row = new Adw.EntryRow({title});
            row.set_text(settings.get_string(key));
            row.connect('changed', () => {
                const text = row.get_text();
                if (isValidIso(text)) {
                    row.remove_css_class('error');
                    settings.set_string(key, text);
                } else {
                    row.add_css_class('error');
                }
            });
            dates.add(row);
        }

        const display = new Adw.PreferencesGroup({title: 'Display'});
        page.add(display);

        const labelRow = new Adw.SwitchRow({
            title: 'Show percentage in panel',
        });
        settings.bind('show-panel-label', labelRow, 'active',
            Gio.SettingsBindFlags.DEFAULT);
        display.add(labelRow);

        const decimalsRow = new Adw.SpinRow({
            title: 'Popup percentage decimals',
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 8,
                step_increment: 1,
            }),
        });
        settings.bind('percent-decimals', decimalsRow, 'value',
            Gio.SettingsBindFlags.DEFAULT);
        display.add(decimalsRow);
    }
}
