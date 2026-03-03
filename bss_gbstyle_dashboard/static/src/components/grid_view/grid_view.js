/** @odoo-module */
import {Component, onWillStart, useState} from "@odoo/owl";
import { useService } from "@web/core/utils/hooks"; 
import {ScrollableComponent} from "../scrollable_component/scrollable_component";
import {TaskGridDetail} from "../task_grid_detail/task_grid_detail";
import { rpc } from "@web/core/network/rpc";


export class GridViewComponent extends Component {
    static template = "bss_gbstyle_dashboard.GridViewComponent";
    static props = {
        // Parent component passes this
        tasks: { type: Array, optional: true },

        // Odoo action-required props
        action: { type: Object, optional: true },
        actionId: { type: Number, optional: true },
        updateActionState: { type: Function, optional: true },
        className: { type: String, optional: true },
    };
    static components = {ScrollableComponent,TaskGridDetail}

    setup() {
        this.state = useState({
            taskStates: []
        });
        this.state.limit = {
            'assign': 2,
            'in_progress': 2,
            'done': 2,
            'urgent': 2,
            'overdue': 2,
            'due_soon': 2,
        };

        this.resModel = "project.task";
        this.orm = this.env.services.orm;
        this.action = useService("action");

        onWillStart(async () => {
            await this.getTaskState();
        })
    }

    async getTaskState() {
        this.state.taskStates = await this.orm.call(this.resModel, "getStates", [[]], {task_id:"this is para"});
        // console.log(this.state.taskStates);
    }

    getTasksPerState(taskState) {
        // console.log('getTasksPerState');
        let tasks = this.props.tasks;
        console.log(tasks);
        if (taskState == 'due_soon') {
            tasks = tasks.filter(task => task.is_due_soon);
        } else if (taskState == 'overdue') {
            tasks = tasks.filter(task => task.is_overdue);
        } else if (taskState == 'urgent') {
            tasks = tasks.filter(task => task.urgent_request);
        } else {
            tasks = tasks.filter(task => task.task_state == taskState);
        }
        if (this.state.limit[taskState] == 0) {
            return {'list':tasks,'count':tasks.length > 2 ? -1 : 0, 'all_tasks': tasks, 'total_count': tasks.length};
        } else {
            const count = tasks.length - this.state.limit[taskState];
            return {'list':tasks.slice(0, this.state.limit[taskState]),'count':count>0 ? count : 0, 'all_tasks': tasks, 'total_count': tasks.length};
        }
    }

    async showTaskList(stateName, tasks) {
        console.log('showTaskList');
        console.log(stateName);
        console.log(tasks);
        // const taskIds = tasks.map(task => task && task.id).filter(id => id !== undefined);
        const task_ids = [];
        for (const task of tasks) {
            if (task.id) {
                task_ids.push(task.id);
            }
        }
        const listViewId = await rpc("/web/dataset/call_kw", {
                model: "ir.model.data.wrapper",
                method: "get_res_id",
                args: ['project.open_view_all_tasks_list_view'],
                kwargs: {},
            });
        const formViewId = await rpc("/web/dataset/call_kw", {
                model: "ir.model.data.wrapper",
                method: "get_res_id",
                args: ['project.view_task_form2'],
                kwargs: {},
            });
        console.log(task_ids);
        console.log(task_ids.length);
        this.action.doAction({
            type: "ir.actions.act_window",
            name: stateName,
            res_model: "project.task",
            domain: [['id', 'in', task_ids]],
            view_mode: "list,form",
            // views: [[false, "list"],[false, "form"]],
            views: [
                [listViewId, 'list'],
                [formViewId, 'form'],
            ],
            target: "current",
        });
    }

    onClickViewMore(taskState) {
        console.log('onClickViewMore');
        this.state.limit[taskState] = 0;
        return this.getTasksPerState(taskState);
    }

    onClickViewLess(taskState) {
        this.state.limit[taskState] = 2;
        return this.getTasksPerState(taskState);
    }

}