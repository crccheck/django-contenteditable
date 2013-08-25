import json

from django.http import Http404, HttpResponse, HttpResponseForbidden
from django.db import models
from django.views.generic import View
from django.views.generic.detail import SingleObjectMixin

from . import settings

try:
    # Because the reversion api keeps changing, it's only guaranteed to work for
    # the latest versions of Django and Reversion
    import reversion
    REVERSION_INSTALLED = True
except ImportError:
    REVERSION_INSTALLED = False


class NoPermission(Exception):
    message = 'User does not have permission'


class ContentEditableView(View, SingleObjectMixin):
    http_method_names = ['post', 'put', 'delete']

    def get_editable_model_and_fields(self, data):
        model_name = data.pop('model')
        try:
            if 'app' in data:
                app_name = data.pop('app')
                full_model_name = "%s.%s" % (app_name, model_name)
            else:
                # missing app name, guess it based on the model name
                full_model_name = settings.e_models[model_name]
                app_name = full_model_name.split('.')[0]
            editable_fields = settings.editable_models[full_model_name]
            model = models.get_model(app_name, model_name)
        # TODO except model does not exist
        except KeyError:
            raise ValueError('Unknown model: {0}'.format(model))
        # TODO check add/change/delete based on request type
        if not self.request.user.has_perm(model):
            raise NoPermission
        return model, editable_fields

    def dispatch(self, request, *args, **kwargs):
        """
        Raise 404 if app is disabled.

        This probably isn't the best way to do this. Should probably just not
        get put into the urlconf.
        """
        if not settings.CONTENTEDITABLE_ENABLED:
            # pretend that we don't exist
            raise Http404
        return super(ContentEditableView, self).dispatch(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        data = request.POST.dict().copy()
        try:
            self.model, editable_fields = self.get_editable_model_and_fields(data)
        except NoPermission as e:
            return HttpResponseForbidden(
                json.dumps(dict(message=e.message)),
                content_type='application/json')
        if 'slugfield' in data:
            self.slug_field = data.pop('slugfield')
        self.kwargs.update(data)
        obj = self.get_object()
        for fieldname in editable_fields:
            if fieldname in data:
                obj.__setattr__(fieldname, data.pop(fieldname))
        if REVERSION_INSTALLED:
            with reversion.create_revision():
                obj.save()
                reversion.set_user(request.user)
                reversion.set_comment("Contenteditable")
        else:
            obj.save()  # TODO only save if changed
        return HttpResponse(
            json.dumps(dict(message='ok')),
            content_type='application/json')
        # else:
        #     return HttpResponseBadRequest(
        #         json.dumps(dict(message='Content cannot be updated')),
        #         content_type='application/json')

    def put(self, request, *args, **kwargs):
        # hacked in just for the test case. don't know what a real PUT request
        # looks like yet
        data = request.PUT.copy()
        model, editable_fields = self.get_editable_model_and_fields(data)
        obj_data = {}
        if 'slugfield' in data:
            # inserting stuff that uses slugs probably won't work unless the
            # slug is one of the editable attributes
            slug_field = data.pop('slugfield')
            obj_data[slug_field] = data.pop('slug')
        for fieldname in editable_fields:
            if fieldname in data:
                obj_data[fieldname] = data.pop(fieldname)
        obj = model.objects.create(**obj_data)
        return HttpResponse(
            json.dumps(dict(message='ok', pk=obj.pk)),
            content_type='application/json')

    def delete(self, request, *args, **kwargs):
        """
        Here just for completeness and because the old code supported this.

        Allowing deletes this way is really dangerous.
        """
        # hacked in just for the test case. don't know what a real DELETE
        # request looks like yet
        data = request.DELETE.copy()
        try:
            self.model, __ = self.get_editable_model_and_fields(data)
        except NoPermission as e:
            return HttpResponseForbidden(
                json.dumps(dict(message=e.message)),
                content_type='application/json')
        if 'slugfield' in data:
            self.slug_field = data.pop('slugfield')
        self.kwargs.update(data)
        obj = self.get_object()
        obj.delete()
        return HttpResponse(
            json.dumps(dict(message='ok', pk=obj.pk)),
            content_type='application/json')
