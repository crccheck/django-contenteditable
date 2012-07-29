from django.conf import settings

# to enable or disable contenteditable functionality. affects the
# templatetags and the views. You may not want this enabled in production
# because of caching and exposing primary keys.
CONTENTEDITABLE_ENABLED = getattr(settings, 'CONTENTEDITABLE_ENABLED',
    settings.DEBUG)

# define models and their fields that are allowed to be edited
# you must opt-in and explicitly allow each model and field like:
# CONTENTEDITABLE_MODELS = (
#     ('newspaper.article', ('title', 'text')),
#     ('chunks.chunk', ('content',)),
# )
CONTENTEDITABLE_MODELS = None

# CONTENTEDITABLE_MODELS gets transformered below into two internally used
# settings: editable_models and e_models

try:
    if not CONTENTEDITABLE_ENABLED:
        # don't even bother trying to figure out what's editable
        raise AttributeError
    CONTENTEDITABLE_MODELS = getattr(settings, 'CONTENTEDITABLE_MODELS')
    editable_models = dict(CONTENTEDITABLE_MODELS)
    e_models = dict()
    for appmodel, fields in CONTENTEDITABLE_MODELS:
        app, model = appmodel.split(".")
        e_models[model] = (app, fields)
except AttributeError:
    editable_models = None
    e_models = None
