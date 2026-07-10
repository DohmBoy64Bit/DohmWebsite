import os
from flask import Blueprint, request, send_from_directory, abort

N64RECOMP_HOSTS = {'n64recompcompanion.dohmboy64.com', 'www.n64recompcompanion.dohmboy64.com'}

n64recompcompanion = Blueprint('n64recompcompanion', __name__)

_sites_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'sites', 'n64recompcompanion')

FILE_MAP = {
    '/': ('index.html', 'text/html; charset=utf-8'),
    '/index.html': ('index.html', 'text/html; charset=utf-8'),
    '/social.png': ('social.png', 'image/png'),
}


@n64recompcompanion.before_app_request
def intercept_n64recompcompanion():
    if request.host not in N64RECOMP_HOSTS:
        return None

    path = request.path.rstrip('/') or '/'

    entry = FILE_MAP.get(path)
    if entry:
        filename, mimetype = entry
        return send_from_directory(_sites_dir, filename, mimetype=mimetype)

    return abort(404)
