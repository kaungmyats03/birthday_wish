/** @odoo-module **/

import {Component, useState, onWillStart} from "@odoo/owl";
import {Tasks} from "./components/tasks/tasks";
import {registry} from "@web/core/registry";
import {loadBundle, loadCSS, loadJS} from "@web/core/assets";

export class Root extends Component {
    static template = "bss_gbstyle_dashboard.Root";
    static components = {Tasks};
    static props = {
        action: { type: Object, optional: true },
        actionId: { type: Number, optional: true },
        updateActionState: { type: Function, optional: true },
        className: { type: String, optional: true },
        globalState: { type: Object, optional: true },   // Needed to avoid unknown key error
        slots: { type: Object, optional: true },         // Needed if template uses <t t-slot>
    };
}

registry.category("actions").add("bss_gbstyle_dashboard.task", Root);