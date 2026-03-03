/** @odoo-module */
import {Component, onWillStart, useState} from "@odoo/owl";

export class ScrollableComponent extends Component {
    static template = "bss_gbstyle_dashboard.ScrollableComponent";
    static props = {
        slots: { type: Object, optional: true },   // needed because template uses slots
        class: { type: String, optional: true },   // for your defaultProps
    };
    static defaultProps = {
        class: "bg-gray p-1",
    };

    // setup(){
    //     console.log(this.props)
    // }
}