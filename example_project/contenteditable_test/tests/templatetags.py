from django.template import Context, Template
from django.test import TestCase
from django.test.utils import override_settings

from newspaper.models import Article

from contenteditable.templatetags import contenteditable


# make sure template errors aren't swallowed
@override_settings(TEMPLATE_DEBUG=False)
class TemplatetagsTest(TestCase):
    """Quick n dirty test coverage for templatetags."""
    def setUp(self):
        super(TemplatetagsTest, self).setUp()
        self.obj = Article.objects.get(pk=1)

    def test_editablebox(self):
        t = Template('{% load editablebox from contenteditable %}'
                '{% editablebox object %}')
        c = Context({
            'object': self.obj,
        })
        out = t.render(c)
        self.assertIn('data-editmeta', out)

    def test_editableattr(self):
        t = Template('{% load editableattr from contenteditable %}'
                '{% editableattr "attrname" %}')
        c = Context()
        out = t.render(c)
        self.assertIn('data-edit', out)

    def test_editable(self):
        t = Template('{% load editable from contenteditable %}'
                '{% editable object.title "poop" %}')
        c = Context({
            'object': self.obj,
        })
        out = t.render(c)
        self.assertIn('data-edit', out)
        self.assertIn('</poop>', out)

    def test_editableitem(self):
        # TODO I'm not sure what this does. I don't think it's used.
        pass

    @override_settings(CONTENTEDITABLE_ENABLED=False)
    def test_tags_do_nothing_when_disabled(self):
        # TODO split into separate tests
        self.assertEqual(contenteditable.editablebox(self.obj), '')
        self.assertEqual(contenteditable.editableattr('name', 'placeholder'), '')

    @override_settings(CONTENTEDITABLE_ENABLED=False)
    def test_editable_tag_does_nothing_when_disabled(self):
        t = Template('{% load editable from contenteditable %}'
                '{% editable object.title "hi" %}')
        c = Context({
            'object': self.obj,
        })
        self.assertNotIn('data-edit', t.render(c))
