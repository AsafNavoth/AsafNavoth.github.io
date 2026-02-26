import logging

from flask import Blueprint, request, jsonify
import requests
from requests.exceptions import HTTPError, RequestException

from config import LRCLIB_ALLOWED_SEARCH_PARAMS, LRCLIB_BASE_URL

logger = logging.getLogger(__name__)
search_bp = Blueprint('search', __name__)


@search_bp.route('/search')
def search():
    search_params = {
        param_name: param_value
        for param_name, param_value in request.args.items()
        if param_name in LRCLIB_ALLOWED_SEARCH_PARAMS and param_value
    }
    logger.info("search: params=%s", search_params)

    if not search_params.get('q') and not search_params.get('track_name'):
        logger.warning("search: missing q or track_name")
        return jsonify({'error': 'At least one of q or track_name is required'}), 400

    try:
        lrclib_response = requests.get(
            f'{LRCLIB_BASE_URL}/api/search',
            params=search_params,
            timeout=10,
        )
        lrclib_response.raise_for_status()
        data = lrclib_response.json()
        logger.info("search: success results=%d", len(data) if isinstance(data, list) else 0)
        return jsonify(data)

    except HTTPError:
        logger.warning("search: lrclib returned %s", lrclib_response.status_code)
        return jsonify(lrclib_response.json()), lrclib_response.status_code

    except RequestException as e:
        logger.error("search: request failed err=%s", e)
        return jsonify({'error': 'Failed to reach lyrics service', 'detail': str(e)}), 502
