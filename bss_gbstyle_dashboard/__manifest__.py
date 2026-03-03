{
    'name': 'BSS GB Style dashboard',
    'version': '1.0',
    'category': 'Website',
    'summary': 'A simple Owl web page displayed from an Odoo menu item.',
    'description': """
        This module demonstrates how to create a custom Odoo menu item
        that, when clicked, displays a basic Owl component as a web page.
    """,
    'author': 'Blue Stone Solutions',
    'depends': ['web','project', 'bss_gbstyle_main'], 
    'data': [
        'security/ir.model.access.csv',
        'views/views.xml',
        'views/project_task_view.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'bss_gbstyle_dashboard/static/src/components/**/*',
            'bss_gbstyle_dashboard/static/src/root.js',
            'bss_gbstyle_dashboard/static/src/root.xml',
            'bss_gbstyle_dashboard/static/src/components/tasks/admin_tasks.xml',
            'bss_gbstyle_dashboard/static/src/components/tasks/admin_tasks.js',
            'bss_gbstyle_dashboard/static/src/root_admin.xml',
            'bss_gbstyle_dashboard/static/src/root_admin.js',
            'bss_gbstyle_dashboard/static/src/dashboard.css',
        ],
    },
    'installable': True,
    'application': True,
    'license': 'LGPL-3',
}