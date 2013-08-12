from django.contrib.auth.models import User
from django.core.urlresolvers import reverse
from django.test import TestCase
from django.test.client import RequestFactory
from django.test.utils import override_settings
from django.utils import unittest

from newspaper.models import Article

from contenteditable.views import UpdateView


class BaseTestCase(TestCase):
    fixtures = ['test_auth.json']

    def setUp(self):
        self.factory = RequestFactory()
        self.obj = Article.objects.get(pk=1)
        self.url = reverse('dce_endpoint')
        self.base_data = {'model': 'article', 'pk': '1'}

    def generate(self, **updates):
        """
        Create the data that would be recieved in a JSON request.
        """
        return dict(self.base_data, **updates)


class LoggedInTestCase(BaseTestCase):
    def setUp(self):
        super(LoggedInTestCase, self).setUp()
        self.client.login(username='test', password='test')  # DEPRECATED
        self.user = User.objects.create_user('some_superuser')
        self.user.is_staff = True
        self.user.is_superuser = True


class HTTPMethods(LoggedInTestCase):
    def test_get_is_not_allowed(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 405)

    def test_post_is_allowed(self):
        response = self.client.post(self.url, self.base_data)
        self.assertEqual(response.status_code, 200)

    @unittest.expectedFailure
    def test_put_is_allowed(self):
        response = self.client.put(self.url, self.base_data)
        self.assertEqual(response.status_code, 200)

    @unittest.expectedFailure
    def test_delete_is_allowed(self):
        response = self.client.delete(self.url, self.base_data)
        self.assertEqual(response.status_code, 200)


class CRUDTest(LoggedInTestCase):
    def test_can_create_instance(self):
        new_title = 'Inserted with PUT'
        data = self.generate(title=new_title)
        data.pop('pk')
        request = self.factory.put(self.url, data)
        request.user = self.user
        request.PUT = data  # FIXME this is wrong
        view = UpdateView.as_view()
        response = view(request)
        self.assertEqual(response.status_code, 200)
        Article.objects.get(title=new_title)

    def test_can_update_field(self):
        new_title = "Poopity Poop Pooh"
        request = self.factory.post(self.url,
           self.generate(title=new_title)
        )
        request.user = self.user
        view = UpdateView.as_view()
        response = view(request)
        self.assertEqual(response.status_code, 200)
        obj = Article.objects.get(pk=1)
        self.assertEqual(obj.title, new_title)


class Permissions(BaseTestCase):
    def test_anonymous_is_rejected(self):
        response = self.client.post(self.url, self.base_data)
        self.assertEqual(response.status_code, 403)
        self.client.login(username='test', password='test')
        response = self.client.post(self.url, self.base_data)
        self.assertEqual(response.status_code, 200)


class Settings(LoggedInTestCase):
    @override_settings(CONTENTEDITABLE_ENABLED=False)
    def test_api_is_off_when_disabled(self):
        old_title = self.obj.title
        new_title = old_title + " sucks"
        response = self.client.post(self.url,
                   self.generate(title=new_title))
        self.assertEqual(response.status_code, 404)
        obj = Article.objects.get(pk=1)
        self.assertEqual(obj.title, old_title)

    @override_settings(CONTENTEDITABLE_ENABLED=False)
    def test_tags_do_nothing_when_disabled(self):
        from contenteditable.templatetags import inlineedit
        # TODO split into separate tests
        self.assertEqual(inlineedit.editablebox(self.obj), '')
        self.assertEqual(inlineedit.editableattr('name', 'placeholder'), '')

    def test_edtitable_tag_does_nothing_when_disabled(self):
        resp = self.client.get(self.obj.get_absolute_url())
        enabled_len = len(resp.content)
        with self.settings(CONTENTEDITABLE_ENABLED=False):
            resp = self.client.get(self.obj.get_absolute_url())
            disabled_len = len(resp.content)
        self.assertTrue(disabled_len < enabled_len)
