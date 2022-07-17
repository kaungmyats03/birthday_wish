# -*- coding: utf-8 -*-


from datetime import datetime
from odoo import models, fields, api


class Partner(models.Model):
    _inherit = 'res.partner'
    _description = 'Partner'

    dob = fields.Date(string="Date of Birth")

    def send_birthday_wish(self):
        user_id = self.env['res.users'].browse(self._context.get('uid'))
        bd_peoples = self.env['res.partner'].search([('dob', '=', datetime.today())])
        template = self.env.ref('birthday_wish.mail_template_birthday_wish')
        for bd_person in bd_peoples:
            # By Using Mail Template
            template.send_mail(bd_person.id, force_send=True)

            # Without Using Mail Template
#             subject = "Happy Birthday " + bd_person.name
#             body = """Hoping that this birthday is the start of an amazing year where you accomplish every goal and shatter every record there is to break.
#                       Enjoy your birthday!"""
#             vals = {
#                 'subject': subject,
#                 'body_html': body,
#                 'email_to': str(bd_person.email),
#                 'auto_delete': False,
#                 'email_from': bd_person.user_id.email_formatted or user_id.email_formatted, # or any mail you like
#             }

#             mail_id = self.env['mail.mail'].sudo().create(vals)
#             mail_id.sudo().send()
        return
