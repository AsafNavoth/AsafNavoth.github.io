from flask import Blueprint

from routes.lyrics import lyrics_bp
from routes.search import search_bp

api_bp = Blueprint('api', __name__, url_prefix='/api')

api_bp.register_blueprint(search_bp)
api_bp.register_blueprint(lyrics_bp)
