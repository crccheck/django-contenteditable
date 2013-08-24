import json

from django import template
from django.db.models import fields
from django.utils.safestring import mark_safe

from .. import settings


register = template.Library()


## EditableBox
@register.simple_tag
def editablebox(obj):
    if not settings.CONTENTEDITABLE_ENABLED:
        return ''
    json_data = json.dumps(dict(
        app=obj._meta.app_label,
        model=obj._meta.object_name.lower(),
        pk=obj.pk
    ))
    return "data-editmeta='{0}'".format(json_data)


@register.simple_tag
def editableattr(name, placeholder=""):
    if not settings.CONTENTEDITABLE_ENABLED:
        return ''
    return 'data-editfield="{0}" data-placeholder="{1}" '.\
        format(name, placeholder)


@register.tag(name='editable')
def do_editable(parser, token):
    try:
        bits = token.split_contents()
        if len(bits) == 3:
            tag_name, field, container = token.split_contents()
        else:
            tag_name, field = token.split_contents()
            container = "span"
        objname, fieldname = field.split('.')
    except ValueError as e:
        raise template.TemplateSyntaxError("editable tag expects one argument "
            "formatted like `object.field`, "
            "%s" % e)
    return EditableModelFieldNode(objname, fieldname, container)


class EditableModelFieldNode(template.Node):
    def __init__(self, objname, fieldname, container):
        self.objname = template.Variable(objname)
        self.fieldname = fieldname
        self.container = template.Variable(container)

    def render(self, context):
        try:
            obj = self.objname.resolve(context)
            fieldname = self.fieldname
            field = obj._meta.get_field(fieldname)
            container = self.container.resolve(context)
        except (template.VariableDoesNotExist, fields.FieldDoesNotExist):
            return ''
        base_string = '<{0} {1}>{2}</{0}>' if settings.CONTENTEDITABLE_ENABLED\
            else '<{0}>{2}</{0}>'
        attrs = ['data-editfield="%s"' % fieldname,
                 'data-placeholder="%s"' % (field.default if
                     field.default != fields.NOT_PROVIDED else ''),
                 'data-editwidget="%s"' % field.__class__.__name__]
        out = base_string.format(container, " ".join(attrs),
                                 getattr(obj, fieldname))
        return mark_safe(out)


## EditableItem
@register.tag(name='editableitem')
def do_editableitem(parser, token):
    try:
        tag_name, data_model, data_id, data_name, data_placeholder = token.split_contents()
        return EditableItemTemplate(data_model, data_id, data_name, data_placeholder)
    except ValueError:
        raise template.TemplateSyntaxError("%r tag requires data_model, data_id, data_name, data_placeholder arguments" % token.contents.split()[0])


class EditableItemTemplate(template.Node):
    def __init__(self, data_model, data_id, data_name, data_placeholder):
        self.data_model = data_model
        self.data_id = template.Variable(data_id)
        self.data_name = data_name
        self.data_placeholder = data_placeholder

    def render(self, context):
        if not settings.CONTENTEDITABLE_ENABLED:
            return ''
        if not '{0}'.format(self.data_id).startswith('"'):
            self.data_id = self.data_id.resolve(context)

        return """editableitem clearonclick returnsaves\" data-model={0} data-id={1} data-name={2} data-placeholder={3} """.format(
            self.data_model, self.data_id, self.data_name, self.data_placeholder
        )


try:
    import chunks  # only expose if chunks is installed

    @register.simple_tag
    def editablechunk(key):
        if not settings.CONTENTEDITABLE_ENABLED:
            return ''
        json_data = json.dumps(dict(
            app='chunks',
            model='chunk',
            slugfield='key',
            slug=key,
        ))
        return "data-editmeta='{0}' data-editfield='content'".format(json_data)

except ImportError:
    pass
