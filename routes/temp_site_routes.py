from flask import Blueprint, render_template, request, jsonify, abort
from services.temp_site_service import TempSiteService
from utils.logging_config import app_logger as logger

temp_site = Blueprint('temp_site', __name__)

@temp_site.route('/tools/temp-site')
def creator_interface():
    """Render the tool interface for creating a new site."""
    return render_template('temp_site.html')

@temp_site.route('/api/temp-site/create', methods=['POST'])
def create_site():
    """API endpoint to create a new site."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        html = data.get('html', '')
        css = data.get('css', '')
        js = data.get('js', '')
        
        # Basic validation
        if not html and not css and not js:
            return jsonify({'error': 'Cannot create empty site'}), 400
            
        site_id = TempSiteService.create_site(html, css, js)
        
        return jsonify({
            'success': True,
            'id': site_id,
            'url': f"/temp/view/{site_id}"
        })
        
    except Exception as e:
        logger.error(f"API Error creating temp site: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@temp_site.route('/temp/view/<site_id>')
def view_site(site_id):
    """Render the temporary site."""
    site = TempSiteService.get_site(site_id)
    
    if not site:
        return render_template('404.html'), 404
        # Note: If you don't have a 404.html, we might need a fallback.
        # But Flask usually handles 404s if we just return 404 or abort(404).
        # Let's try abort for now if no custom template is known.
        
    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TempSite {site_id}</title>
    <style>
        /* Sandbox Warning Banner */
        .sandbox-banner {{
            background: #ff0000;
            color: white;
            text-align: center;
            padding: 5px;
            font-family: monospace;
            font-size: 12px;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 99999;
            opacity: 0.8;
            pointer-events: none;
        }}
        body {{
            margin-top: 30px; /* Space for banner */
        }}
        {site['css']}
    </style>
</head>
<body>
    <div class="sandbox-banner">⚠️ GENERATED CONTENT - EXPIRES IN 24H - BE CAREFUL ⚠️</div>
    {site['html']}
    <script>
        {site['js']}
    </script>
</body>
</html>
    """
