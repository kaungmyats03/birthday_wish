/** @odoo-module */
import { Component, onWillStart, onMounted, useState, useRef , useEffect} from "@odoo/owl";
import {TaskList} from "../task_list/task_list";
import {GridViewComponent} from "../grid_view/grid_view";
import { registry } from "@web/core/registry";
import {useAutofocus} from "@web/core/utils/hooks";
import {loadJS} from "@web/core/assets";
import { _t } from "@web/core/l10n/translation";

const VIEW = {
    listView: "list",
    gridView: "grid",
}

export class Tasks extends Component {
    static template = "bss_gbstyle_dashboard.Tasks";
    static props = {};
    static components = {TaskList, GridViewComponent};

    setup() {
        // Get current date for default values
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
        // For this dashboard we keep To Year/Month the same as From (current year/month)
        const toYear = currentYear;
        const toMonth = currentMonth;

        this.state = useState({
            view: VIEW.gridView,
            tasks: [],
            selectedFromYear: String(currentYear),
            selectedFromMonth: String(currentMonth),
            selectedToYear: String(toYear),
            selectedToMonth: String(toMonth),
            years: [],
            months: [],
            fromMonths: [],
            toMonths: []
        });
        this.nameRef = useAutofocus({refName: 'name'});
        this.model = "project.task";
        this.orm = this.env.services.orm;

        // A flag to let us know initial data is loaded
        this._initialDataLoaded = false;
        this.taskBarChartRef = useRef("task_bar_chart");
        this.taskLineChartRef = useRef("task_line_chart");

        onWillStart(async () => {
            // Initial data fetching
            await this.getYears();
            this.getMonths();
            // Fetch tasks with default date filter values so UI and data are in sync
            await this.getAllTasks(
                '',
                parseInt(this.state.selectedFromYear),
                parseInt(this.state.selectedFromMonth),
                parseInt(this.state.selectedToYear),
                parseInt(this.state.selectedToMonth),
            );
            this._initialDataLoaded = true;
        });

        // When mounted, ensure the charts are rendered only when all the process for initial data is done (DOM ready, data ready)
        onMounted(async () => {
            // Wait until initial data loaded (should be very fast, but for safety)
            // If data is not ready (shouldn't happen due to onWillStart), poll briefly.
            while (!this._initialDataLoaded) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            await this.render_charts();
        });

        useEffect(
            () => {
                // Only render charts when grid view is active
                if (this.state.view !== VIEW.gridView) {
                    // destroy charts when leaving grid
                    this.barChart?.destroy();
                    this.lineChart?.destroy();
                    this.barChart = null;
                    this.lineChart = null;
                    // No cleanup needed
                    return;
                }

                // Wait one microtask so OWL finishes DOM insertion then render charts
                (async () => {
                    await Promise.resolve();
                    await this.render_charts();
                })();

                // Return undefined for cleanup to avoid OwlError (NOT an async or non-function)
                return undefined;
            },
            () => [this.state.view]
        );

    }

    switchView() {
        if (this.state.view === VIEW.gridView) {
            this.barChart?.destroy();
            this.lineChart?.destroy();
            this.barChart = null;
            this.lineChart = null;
        }
        this.state.view = this.state.view === VIEW.listView ? VIEW.gridView : VIEW.listView;
    }

    getComponent() {
        return this.state.view === VIEW.listView ? GridViewComponent : TaskList;
    }

    getToLabel() {
        return _t("To:");
    }

    getFromLabel() {
        return _t("From:");
    }

    async getAllTasks(name, year, month, toYear, toMonth) {
        const domain = [['name', 'ilike', name]];
        console.log(name, year, month);
        // this.state.tasks = await this.orm.searchRead(this.model, domain, ['name', 'date_deadline','state','project_id']);
        this.state.tasks = await this.orm.call(this.model, "get_dashboard_data", [this.model,name, year, month, toYear, toMonth]);
        // console.log("tasks..........",this.state.tasks)
        /** 
        // append images to partners 
        this.state.partners = this.state.partners.map(partner => {
            return {...partner, imageURL: `/web/image/${this.model}/${partner.id}/avatar_128`}
            // return {email:partner.email,name:partner.name, imageURL: `/web/image/${this.model}/${partner.id}/avatar_128`}
        })
        **/
    }
    async searchTasks(e) {
        if (e.type==='click' || e.type === 'keydown' || (e.key === 'Enter' || e.keyCode === 13)) {
            console.log('nameref');
            console.log(this.nameRef);
            let name = this.nameRef.el.value.trim();
            await this.getAllTasks(name, parseInt(this.state.selectedFromYear), parseInt(this.state.selectedFromMonth),parseInt(this.state.selectedToYear), parseInt(this.state.selectedToMonth));
            await this.render_charts();  // refresh charts
            // this.nameRef.el.value = null;
            return null;
        }

    }

    async getYears() {
        this.state.years = this.getYearListUntilToday();
    }
    getYearListUntilToday() {
        const currentYear = new Date().getFullYear()+1;
        const startYear = 2025; // or set as needed
        const years = [];
        for (let year = startYear; year <= currentYear; year++) {
            years.push(String(year)); // keep values as strings to match state
        }
        return years.reverse();
    }
    getMonths() {
        this.state.months = this.getMonthList();
    }
    getMonthList() {
        const months = [
            { key: '1', name: 'January' },
            { key: '2', name: 'February' },
            { key: '3', name: 'March' },
            { key: '4', name: 'April' },
            { key: '5', name: 'May' },
            { key: '6', name: 'June' },
            { key: '7', name: 'July' },
            { key: '8', name: 'August' },
            { key: '9', name: 'September' },
            { key: '10', name: 'October' },
            { key: '11', name: 'November' },
            { key: '12', name: 'December' },
        ];
        return months;
    }
    async filterByYearAndMonth() {
        let name = this.nameRef?.el?.value?.trim() || '';
        await this.getAllTasks(name, parseInt(this.state.selectedFromYear), parseInt(this.state.selectedFromMonth), parseInt(this.state.selectedToYear), parseInt(this.state.selectedToMonth));
        await this.render_charts();  // refresh charts
    }
    async render_charts() {
        // Ensure Chart.js is loaded
        await loadJS("https://cdn.jsdelivr.net/npm/chart.js");
    
        // // Get dashboard data (already using ORM)
        // this.state.tasks = await this.orm.call(this.model, "get_dashboard_data", [
        //     this.model,
        //     this.state.name,
        //     this.state.selectedYear,
        //     this.state.selectedMonth
        // ]);
    
        // Filter and count tasks by their task_state
        // For example, let's count tasks for New (new_task), In Progress (on_process), and Done (closed)
        const tasks = this.state.tasks || [];

        // Count by status for the current filter
        console.log("task state................",tasks)
        const newTasks = tasks.filter(t => t.task_state === 'draft').length;
        const progressTasks = tasks.filter(t => t.task_state === 'in_progress').length;
        const doneTasks = tasks.filter(t => t.task_state === 'done').length;

        // You can use these counts for further charting or display
        console.log('New:', newTasks, 'In Progress:', progressTasks, 'Done:', doneTasks);

        // --- BAR CHART ---
        // Build monthly bar chart data, grouped by year/month for each status: All Done, On Time, Over Due (like the sample image)
        // Parse/prepare grouped data:
        const monthsMap = {}; // key = 'YYYY.MM'
        tasks.forEach(t => {
            // Group by year + month, use date_deadline (assume it's ISO string).
            let ym = "Unknown";
            if (t.date_deadline) {
                const date = new Date(t.date_deadline);
                ym = date.getFullYear() + '.' + String(date.getMonth() + 1).padStart(2, "0");
            }
            if (!monthsMap[ym]) {
                monthsMap[ym] = { alldone: 0, ontime: 0, overdue: 0, new: 0, inprocess: 0, done: 0, total: 0 };
            }
            // Assume t.task_state and t.date_color (matches odoo python: black=done, green=ontime, red=overdue)
            if (t.task_state === 'done') {
                monthsMap[ym].alldone += 1;
                monthsMap[ym].done += 1;
            }
            if (t.date_color === '#069614') { // ontime
                monthsMap[ym].ontime += 1;
            }
            if (t.date_color === 'red') { // overdue
                monthsMap[ym].overdue += 1;
            }
            // For line chart by task_state (regardless of date_color)
            if (t.task_state === 'draft') {
                monthsMap[ym].new += 1;
            }
            if (t.task_state === 'in_progress') {
                monthsMap[ym].inprocess += 1;
            }
            // For total per month
            monthsMap[ym].total += 1;
        });

        // Sorted month keys
        const monthKeys = Object.keys(monthsMap).sort((a, b) => a.localeCompare(b));
        const monthTotalTasks = monthKeys.map(k => monthsMap[k].total);
        // Data arrays for bar chart
        const alldone = monthKeys.map(k => monthsMap[k].alldone);
        const ontime = monthKeys.map(k => monthsMap[k].ontime);
        const overdue = monthKeys.map(k => monthsMap[k].overdue);

        // Data arrays for line chart (solve the undefined variables problem)
        const monthNewTasks = monthKeys.map(k => monthsMap[k].new);
        const monthInProgressTasks = monthKeys.map(k => monthsMap[k].inprocess);
        const monthDoneTasks = monthKeys.map(k => monthsMap[k].done);

        // Render bar chart\

        const ctxBar = this.taskBarChartRef.el;
        if (!ctxBar) return;
        if (this.barChart) this.barChart.destroy();

        // const ctxBar = document.getElementById("task_bar_chart");
        // if (this.barChart) this.barChart.destroy();
        this.barChart = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: monthKeys.map(k => {
                    // Label to "YYYY.MM" to "YYYY.MMM"
                    const [y, m] = k.split(".");
                    const monthName = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][parseInt(m,10)-1] || m;
                    return `${y}.${monthName}`;
                }),
                datasets: [
                    {
                        label: 'All Done',
                        backgroundColor: '#21b5b9',
                        data: alldone,
                        stack: 'Stack 0'
                    },
                    {
                        label: 'On Time',
                        backgroundColor: '#38c05b',
                        data: ontime,
                        stack: 'Stack 0'
                    },
                    {
                        label: 'Over Due',
                        backgroundColor: '#9949b4',
                        data: overdue,
                        stack: 'Stack 0'
                    }
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.5,
                plugins: {
                    legend: { 
                        display: true, 
                        position: 'right',
                        labels: {
                            padding: 15,
                            font: { size: 12, weight: '500' },
                            usePointStyle: true
                        }
                    },
                    tooltip: { 
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 13, weight: 'bold' },
                        bodyFont: { size: 12 }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        ticks: { 
                            color: '#333', 
                            font: { size: 11, weight: '600' }
                        },
                        grid: {
                            color: '#f0f0f0',
                            drawBorder: false
                        }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        ticks: { 
                            color: '#333', 
                            font: { size: 11, weight: '600' }
                        },
                        grid: {
                            color: '#f0f0f0',
                            drawBorder: false
                        }
                    }
                },
            }
        });
    
        //--- LINE CHART ---
        // const ctxLineWrapper = document.getElementById("task_line_chart");
        const ctxLine = this.taskLineChartRef.el;
        if (!ctxLine) {
            console.warn("Line chart canvas not available (view not grid yet)");
            return;
        }
        if (this.lineChart) this.lineChart.destroy();

        // // let ctxLine = null;
        // if (ctxLineWrapper && ctxLineWrapper.nodeName === 'CANVAS') {
        //     ctxLine = ctxLineWrapper;
        // } else if (ctxLineWrapper) {
        //     ctxLine = ctxLineWrapper.querySelector('canvas');
        // }

        if (!ctxLine) {
            console.error("Failed to create chart: can't acquire context from the given item. #task_line_chart not found or is not a <canvas> element.");
        } else {
            if (this.lineChart) this.lineChart.destroy();
            this.lineChart = new Chart(ctxLine, {
                type: 'line',
                data: {
                    labels: monthKeys.map(k => {
                        const [y, m] = k.split(".");
                        const monthName = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][parseInt(m,10)-1] || m;
                        return `${y}.${monthName}`;
                    }),
                    datasets: [
                        {
                            label: 'Total',
                            data: monthTotalTasks,
                            borderColor: '#bbb', 
                            backgroundColor: 'rgba(200,200,200,0.2)',
                            fill: false,
                            tension: 0.25,
                            borderWidth: 2,
                            pointRadius: 3,
                            pointBackgroundColor: '#bbb',
                            spanGaps: true
                        },
                        {
                            label: 'New',
                            data: monthNewTasks,
                            borderColor: '#ff9800',
                            backgroundColor: '#ff9800',
                            fill: false,
                            tension: 0.25,
                            borderWidth: 2,
                            pointRadius: 3,
                            pointBackgroundColor: '#ff9800',
                            spanGaps: true
                        },
                        {
                            label: 'In Process',
                            data: monthInProgressTasks,
                            borderColor: '#f44336',
                            backgroundColor: '#f44336',
                            fill: false,
                            tension: 0.25,
                            borderWidth: 2,
                            pointRadius: 3,
                            pointBackgroundColor: '#f44336',
                            spanGaps: true
                        },
                        {
                            label: 'Done',
                            data: monthDoneTasks,
                            borderColor: '#2979ff',
                            backgroundColor: '#2979ff',
                            fill: false,
                            tension: 0.25,
                            borderWidth: 2,
                            pointRadius: 3,
                            pointBackgroundColor: '#2979ff',
                            spanGaps: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: 1.5,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'right',
                            align: 'center',
                            labels: {
                                usePointStyle: true,
                                padding: 15,
                                font: { size: 12, weight: '500' }
                            }
                        },
                        tooltip: {
                            enabled: true,
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 12,
                            titleFont: { size: 13, weight: 'bold' },
                            bodyFont: { size: 12 },
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) label += ': ';
                                    label += context.parsed.y;
                                    return label;
                                }
                            }
                        }
                    },
                    layout: {
                        padding: 15
                    },
                    scales: {
                        x: {
                            grid: { 
                                display: true, 
                                color: "#f0f0f0",
                                drawBorder: false
                            },
                            ticks: { 
                                font: { size: 11, weight: '600' }, 
                                color: "#333"
                            }
                        },
                        y: {
                            grid: { 
                                display: true, 
                                color: "#f0f0f0",
                                drawBorder: false
                            },
                            min: 0,
                            max: 120,
                            beginAtZero: true,
                            ticks: {
                                callback: function(val) { return val + ".0%"; },
                                stepSize: 20,
                                font: { size: 11, weight: '600' },
                                color: "#333"
                            }
                        }
                    },
                    elements: {
                        line: { 
                            borderJoinStyle: 'round',
                            borderWidth: 2.5
                        },
                        point: { 
                            hoverRadius: 6,
                            radius: 4
                        }
                    }
                }
            });
        }
    }
}
