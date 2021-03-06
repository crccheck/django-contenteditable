import random

from django.contrib.auth.models import User
from django.core.urlresolvers import reverse
from django.http import Http404
from django.test import TestCase
from django.test.client import RequestFactory
from django.test.utils import override_settings
from django.utils.unittest import expectedFailure, skip

from newspaper.models import Article

from contenteditable.views import ContentEditableView


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

    @skip("covered below, django test client won't send PUT params")
    def test_put_is_allowed(self):
        response = self.client.put(self.url, self.base_data)
        self.assertEqual(response.status_code, 200)

    @skip("covered below, django test client won't send DELETE params")
    def test_delete_is_allowed(self):
        response = self.client.delete(self.url, self.base_data)
        self.assertEqual(response.status_code, 200)


class CRUDTest(LoggedInTestCase):
    def test_can_create_instance(self):
        # TODO finish writing me
        new_title = 'Inserted with PUT'
        data = self.generate(title=new_title)
        data.pop('pk')
        request = self.factory.put(self.url, data)
        request.user = self.user
        request.PUT = data  # FIXME this is wrong
        view = ContentEditableView.as_view()
        response = view(request)
        self.assertEqual(response.status_code, 200)
        Article.objects.get(title=new_title)

    def test_can_update_field(self):
        new_title = u"Poopity Poop Pooh"
        request = self.factory.post(self.url,
           self.generate(title=new_title)
        )
        request.user = self.user
        view = ContentEditableView.as_view()
        response = view(request)
        self.assertEqual(response.status_code, 200)
        obj = Article.objects.get(pk=1)
        self.assertEqual(obj.title, new_title)

    def test_can_delete_field(self):
        # TODO finish writing me
        data = self.generate()
        request = self.factory.delete(self.url, data)
        request.user = self.user
        request.DELETE = data  # FIXME this is wrong
        view = ContentEditableView.as_view()
        response = view(request)
        self.assertEqual(response.status_code, 200)
        with self.assertRaises(Article.DoesNotExist):
            Article.objects.get(pk=data['pk'])


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
        view = ContentEditableView.as_view()
        request = self.factory.post(self.url, self.generate())
        request.user = self.user
        with self.assertRaises(Http404):
            view(request)


# TODO skipIf reversion is not installed
class ReversionTest(LoggedInTestCase):
    # WIP
    def test_can_update_field(self):
        from django.contrib.contenttypes.models import ContentType
        from reversion.models import Version

        new_title = u"Title {0}".format(random.randint(0, 99))
        request = self.factory.post(self.url,
           self.generate(title=new_title)
        )
        request.user = self.user
        view = ContentEditableView.as_view()
        response = view(request)
        self.assertEqual(response.status_code, 200)
        obj = Article.objects.get(pk=1)
        self.assertEqual(obj.title, new_title)

        article_type = ContentType.objects.get(model='article')
        versions = Version.objects.filter(
            content_type=article_type,
            object_repr=new_title,
        )
        self.assertTrue(versions.get())
