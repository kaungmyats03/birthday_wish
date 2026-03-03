/** @odoo-module **/

import {Component, useState, onWillStart} from "@odoo/owl";
import {AdminTasks} from "./components/tasks/admin_tasks";
import {registry} from "@web/core/registry";
import {loadBundle, loadCSS, loadJS} from "@web/core/assets";

export class RootAdmin extends Component {
    static template = "bss_gbstyle_dashboard.RootAdmin";
    static components = {AdminTasks};
    // Declare all props that Odoo may inject
    static props = {
        action: { type: Object, optional: true },
        actionId: { type: Number, optional: true },
        updateActionState: { type: Function, optional: true },
        className: { type: String, optional: true },
        globalState: { type: Object, optional: true },
        slots: { type: Object, optional: true },
    };


}

registry.category("actions").add("bss_gbstyle_dashboard.task_admin", RootAdmin);