from django.db import models
from django.core.urlresolvers import reverse


class Article(models.Model):
    title = models.CharField(max_length=200)
    text = models.TextField(default=u'This article has no text',
                            blank=True, null=True)

    def __unicode__(self):
        return self.title

    def get_absolute_url(self):
        return reverse('article_detail', kwargs=dict(pk=self.pk))
