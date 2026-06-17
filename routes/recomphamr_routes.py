import os
from flask import Blueprint, request, send_from_directory, abort

RECOMPHAMR_HOSTS = {'recomphamr.dohmboy64.com', 'www.recomphamr.dohmboy64.com'}

recomphamr = Blueprint('recomphamr', __name__)

_sites_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'sites', 'recomphamr')

FILE_MAP = {
    '/': ('index.html', 'text/html; charset=utf-8'),
    '/index.html': ('index.html', 'text/html; charset=utf-8'),
    '/styles.css': ('styles.css', 'text/css'),
    '/script.js': ('script.js', 'application/javascript'),
}


@recomphamr.before_app_request
def intercept_recomphamr():
    if request.host not in RECOMPHAMR_HOSTS:
        return None

    path = request.path.rstrip('/') or '/'

    entry = FILE_MAP.get(path)
    if entry:
        filename, mimetype = entry
        return send_from_directory(_sites_dir, filename, mimetype=mimetype)

    return abort(404)
