from django.conf.urls import patterns, url

from . import views


urlpatterns = patterns('',
    url(r'update/$', views.ContentEditableView.as_view(), name="dce_endpoint"),
)
