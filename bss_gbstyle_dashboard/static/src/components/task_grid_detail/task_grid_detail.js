/** @odoo-module */
import {Component, onWillStart, useState} from "@odoo/owl";
import {useService} from "@web/core/utils/hooks";

export class TaskGridDetail extends Component {
    static template = "bss_gbstyle_dashboard.TaskGridDetail";
    static props = {
        tasks: { type: Array, optional: false },  // REQUIRED
    };

    setup() {
        this.action = useService("action");
    }

    showTaskForm(taskId) {
        this.action.doAction({
            type: "ir.actions.act_window",
            res_model: "project.task",
            res_id: taskId,
            view_mode: "form",
            views: [[false, "form"]],
            target: "current",
        });
    }
}