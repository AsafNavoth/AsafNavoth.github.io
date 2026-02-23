import requests_mock

from app import LRCLIB_BASE_URL


def test_search_returns_400_when_no_query_params(client):
    response = client.get('/api/search')

    assert response.status_code == 400
    assert response.get_json() == {
        'error': 'At least one of q or track_name is required'
    }


def test_search_returns_400_when_empty_query(client):
    response = client.get('/api/search', query_string={'q': ''})

    assert response.status_code == 400


def test_search_returns_results_when_q_provided(client):
    mock_results = [
        {
            'id': 123,
            'trackName': 'Test Song',
            'artistName': 'Test Artist',
            'albumName': 'Test Album',
            'duration': 180,
            'instrumental': False,
        }
    ]

    with requests_mock.Mocker() as mock:
        mock.get(
            f'{LRCLIB_BASE_URL}/api/search',
            json=mock_results,
        )

        response = client.get('/api/search', query_string={'q': 'test song'})

    assert response.status_code == 200
    assert response.get_json() == mock_results


def test_search_forwards_only_allowed_params(client):
    with requests_mock.Mocker() as mock:
        mock.get(f'{LRCLIB_BASE_URL}/api/search', json=[])

        client.get(
            '/api/search',
            query_string={
                'q': 'test',
                'track_name': 'song',
                'artist_name': 'artist',
                'album_name': 'album',
                'disallowed_param': 'ignored',
            },
        )

        request_history = mock.request_history
        assert len(request_history) == 1
        assert request_history[0].qs == {
            'q': ['test'],
            'track_name': ['song'],
            'artist_name': ['artist'],
            'album_name': ['album'],
        }


def test_search_works_with_track_name_only(client):
    with requests_mock.Mocker() as mock:
        mock.get(f'{LRCLIB_BASE_URL}/api/search', json=[])

        response = client.get(
            '/api/search',
            query_string={'track_name': '22'},
        )

    assert response.status_code == 200


def test_get_lyrics_returns_lyrics_for_valid_id(client):
    mock_lyrics = {
        'id': 3396226,
        'trackName': 'I Want to Live',
        'artistName': 'Borislav Slavov',
        'albumName': "Baldur's Gate 3",
        'duration': 233,
        'instrumental': False,
        'plainLyrics': 'I feel your breath upon my neck',
        'syncedLyrics': '[00:17.12] I feel your breath upon my neck',
    }

    with requests_mock.Mocker() as mock:
        mock.get(
            f'{LRCLIB_BASE_URL}/api/get/3396226',
            json=mock_lyrics,
        )

        response = client.get('/api/lyrics/3396226')

    assert response.status_code == 200
    assert response.get_json() == mock_lyrics


def test_get_lyrics_returns_404_when_not_found(client):
    with requests_mock.Mocker() as mock:
        mock.get(
            f'{LRCLIB_BASE_URL}/api/get/999999999',
            status_code=404,
            json={
                'code': 404,
                'name': 'TrackNotFound',
                'message': 'Failed to find specified track',
            },
        )

        response = client.get('/api/lyrics/999999999')

    assert response.status_code == 404
