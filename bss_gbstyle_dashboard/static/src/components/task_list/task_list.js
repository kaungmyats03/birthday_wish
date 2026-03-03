/** @odoo-module */
import {Component,onWillStart,useState} from "@odoo/owl";
import {ScrollableComponent} from "../scrollable_component/scrollable_component";
import {useService} from "@web/core/utils/hooks";

// const ASSIGNEE_COLORS = [
//     "#90f0f0",
//     "#f09390",
//     "#f09390",
//     "#e6f090",
//     "#e6f090",
//     "#90b9f0",
//     "#a690f0",
//     "#f090ed",
//     "#f090a6"
// ];

const ASSIGNEE_COLORS = [
    "#6c6c67"
];

export class TaskList extends Component {
    static template = "bss_gbstyle_dashboard.TaskList";
    static props = {
        tasks: { type: Array }
    };
    static components = {ScrollableComponent}

    setup(){
        this.action = useService("action");
        this.state = useState({
            assigneeColors: new Map()
        });
    }

    getAssigneeColor(assigneeId) {
        if (!this.state.assigneeColors.has(assigneeId)) {
            const randomIndex = Math.floor(Math.random() * ASSIGNEE_COLORS.length);
            this.state.assigneeColors.set(assigneeId, ASSIGNEE_COLORS[randomIndex]);
        }
        return this.state.assigneeColors.get(assigneeId);
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