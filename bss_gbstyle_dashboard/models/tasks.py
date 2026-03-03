from odoo import api, fields, models
from datetime import timedelta, datetime
from pytz import timezone

STATE_LIST = [
        ('draft', 'Draft'),
        ('assign','Assigned'), 
        ('in_progress', 'In Progress'), 
        ('review','Review'), 
        ('done', 'Done'), 
        ('cancel', 'Cancelled')
    ]
STATE_COLOR = [
    ('assign', '현재 할당된 업무', 'black'),
    ('in_progress', '현재 작업중인 업무', '#069614'),
    ('due_soon', '마감일이 가까운 업무', '#b36f10'),
    ('overdue', '마감이 지난 업무', 'red'),
    ('done', '완료한 업무', 'black'),
    ('urgent', '긴급 요청', 'black')
]

class ProjectTask(models.Model):
    _inherit = 'project.task'

    def getStates(self, task_id=False):
        states = []
        for state in STATE_COLOR:
            states.append((state[0],state[1],state[2]))
        return states

    dashboard_status = fields.Selection(STATE_LIST, string='Dashboard Status')
    planning_id = fields.Many2one('project.planning', string='Planning', related='project_id.planning_id', store=True)

    def get_start_and_end_date(self,year,month):

        if not year:
            year = datetime.now().year
        if not month:
            month = datetime.now().month
        start_date = datetime(int(year), int(month), 1)
        if month == 12:
            end_date = datetime(int(year) + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = datetime(int(year),int(month) + 1, 1) - timedelta(days=1)
        # Set start_date to the very beginning of the day (00:00:00)
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        # Set end_date to the very end of the day (23:59:59)
        end_date = end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        return start_date, end_date

    def get_teams(self):
        teams = []
        teams.append({'key': 0,'name': '전체 (All Team)'})
        for team in self.env['crm.team'].sudo().search([]):
            teams.append({'key': team.id,'name': team.name})
        teams = sorted(teams, key=lambda x: x['key'])
        # print("team.....",teams)
        return teams
    
    def get_managers(self):
        managers = []
        managers.append({'key': 0,'name': '전체 (All Manager)'})
        for manager in self.env['res.partner'].sudo().search([('type_of_customer', '=', 'branch_manager')]):
            managers.append({'key': manager.id,'name': manager.name})
        managers = sorted(managers, key=lambda x: x['key'])
        # print("managers...",managers)
        return managers

    def get_dashboard_data(self,name='',year=None,month=None,toYear=None,toMonth=None):
        
        # get start date and end date from year and month
        start_date, end_date = self.get_start_and_end_date(year, month)
        to_start_date, to_end_date = self.get_start_and_end_date(toYear, toMonth)
    
        # print("start_date: ", start_date)
        # print("end_date: ", end_date)
        # print("to_start_date: ", to_start_date)
        # print("to_end_date: ", to_end_date)

        domain = [('is_template','=',False),('date_deadline','>=',start_date),('date_deadline','<=',to_end_date),('user_ids','in',self.env.user.id)]
        # print("domain.............",domain)
        if name:
            domain += [('name','ilike',name)]
        task_model = self.env['project.task'].sudo()
        state_field = dict(task_model._fields['task_state'].selection)
        all_tasks = self.env['project.task'].search(domain)
        all_tasks_vals = []
        # print("all_tasks.......",all_tasks)
        # print("all_tasks......",len(all_tasks))
        # Get user's timezone
        user_tz = self.env.user.tz or 'UTC'
        local_tz = timezone(user_tz)

        for task in all_tasks:
            date_color = 'black'
            now = fields.Datetime.now()
            if task.date_deadline and task.date_deadline < now and task.task_state != 'done':
                date_color = 'red'
            elif task.date_deadline and (now + timedelta(days=1)) >= task.date_deadline >= now:
                date_color = '#b36f10'
            text_color = list(filter(lambda x: x[0] == task.task_state, STATE_COLOR))
            if text_color:
                text_color = text_color[0][2]
            else:
                text_color = 'black'

            assignes = []
            for assignee in task.user_ids:
                assignes.append((assignee.id, assignee.name))

            # Convert deadline to user timezone
            local_deadline = False
            if task.date_deadline:
                local_deadline = task.date_deadline.astimezone(local_tz)
            all_tasks_vals.append(
                {
                    'id':task.id,
                    'name':task.name,
                    'date_deadline':local_deadline,
                    'task_state':task.task_state,
                    # 'state_str': state_field.get(task.dashboard_status),
                    'state_str': self.get_task_state_label(task.task_state),
                    'is_overdue':task.date_deadline and task.date_deadline < now and task.task_state != 'done',
                    'is_due_soon':task.date_deadline and task.date_deadline >= now and task.date_deadline <= (now + timedelta(days=1)),
                    'urgent_request':task.urgent_request,
                    'planning_id':task.planning_id.name,
                    'project_id':task.project_id.name,
                    'assignee_ids':assignes,
                    'date_color': date_color,
                    'text_color': text_color,
                }
            )
        # print("all_tasks_vals.........",all_tasks_vals)
        return all_tasks_vals

    def get_admin_dashboard_data(self,name='',year=None,month=None,toYear=None,toMonth=None,team_id=None,manager_id=None):
        
        # get start date and end date from year and month
        start_date, end_date = self.get_start_and_end_date(year, month)
        to_start_date, to_end_date = self.get_start_and_end_date(toYear, toMonth)
    
        # print("start_date: ", start_date)
        # print("end_date: ", end_date)
        # print("to_start_date: ", to_start_date)
        # print("to_end_date: ", to_end_date)
        # print("team_id:  ",team_id)
        # print("manager_id:  ",manager_id)

        domain = [('is_template','=',False),('display_in_project', '=', True),('date_deadline','>=',start_date),('date_deadline','<=',to_end_date)]
        if team_id and team_id != 0:
            domain += [('team_id','=',team_id)]
        if manager_id and manager_id != 0:
            manager_user = self.env['res.users'].sudo().search([('partner_id','=',manager_id)])
            domain += [('project_id.user_id','=',manager_user.id)]
        if name:
            domain += [('name','ilike',name)]
        task_model = self.env['project.task'].sudo()
        state_field = dict(task_model._fields['task_state'].selection)
        # print("domain:  ",domain)
        all_tasks = self.env['project.task'].search(domain)
        all_tasks_vals = []
        # print("all_tasks.......",all_tasks)
        # print("all_tasks......",len(all_tasks))
        # Get user's timezone
        user_tz = self.env.user.tz or 'UTC'
        local_tz = timezone(user_tz)

        for task in all_tasks:
            date_color = 'black'
            now = fields.Datetime.now()
            if task.date_deadline and task.date_deadline < now and task.task_state != 'done':
                date_color = 'red'
            elif task.date_deadline and (now + timedelta(days=1)) >= task.date_deadline >= now:
                date_color = '#b36f10'
            text_color = list(filter(lambda x: x[0] == task.task_state, STATE_COLOR))
            if text_color:
                text_color = text_color[0][2]
            else:
                text_color = 'black'

            assignes = []
            for assignee in task.user_ids:
                assignes.append((assignee.id, assignee.name))

            # Convert deadline to user timezone
            local_deadline = False
            if task.date_deadline:
                local_deadline = task.date_deadline.astimezone(local_tz)

            all_tasks_vals.append(
                {
                    'id':task.id,
                    'name':task.name,
                    'date_deadline':local_deadline,
                    'task_state':task.task_state,
                    'state_str': self.get_task_state_label(task.task_state),
                    'is_overdue':task.date_deadline and task.date_deadline < now and task.task_state != 'done',
                    'is_due_soon':task.date_deadline and task.date_deadline >= now and task.date_deadline <= (now + timedelta(days=1)),
                    'urgent_request':task.urgent_request,
                    'planning_id':task.planning_id.name,
                    'project_id':task.project_id.name,
                    'assignee_ids':assignes,
                    'date_color': date_color,
                    'text_color': text_color,
                }
            )
        return all_tasks_vals

    def get_task_state_label(self,lable_value):
        if not lable_value:
            return ''
        match lable_value:
            case 'draft':
                return 'Draft'
            case 'assign':
                return 'Assigned'
            case 'in_progress':
                return 'In Progress'    
            case 'review':
                return 'Review'
            case 'done':
                return 'Done'
            case 'cancel':
                return 'Cancel'


class IrModelDataWrapper(models.Model):
    _name = 'ir.model.data.wrapper'
    _description = 'Public wrapper for XMLID lookups'

    @api.model
    def get_res_id(self, xmlid):
        """
        Returns the ID of a record given its XMLID.
        Safe for RPC calls from the frontend.
        """
        try:
            module, name = xmlid.split('.', 1)
        except ValueError:
            return False
        
        record = self.env['ir.model.data'].search([('module', '=', module), ('name', '=', name)], limit=1)
        if record:
            return record.res_id
        return False

    @api.model
    def get_model_name(self, xmlid):
        """
        Optional: get the model of a record given XMLID.
        """
        try:
            module, name = xmlid.split('.', 1)
        except ValueError:
            return False
        
        record = self.env['ir.model.data'].search([('module', '=', module), ('name', '=', name)], limit=1)
        if record:
            return record.model
        return False
