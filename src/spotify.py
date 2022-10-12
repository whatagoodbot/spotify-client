import os
import spotipy
import spotipy.util as util
from dotenv import load_dotenv

load_dotenv()


def spotipy_login():
    SPOTIFY_ID = os.environ.get('SPOTIFY_CLIENT_ID')
    SPOTIFY_SECRET = os.environ.get('SPOTIFY_CLIENT_SECRET')
    SPOTIFY_USERNAME = os.environ.get('SPOTIFY_USER')
    scope = '''playlist-modify-private,
                user-read-recently-played,
                playlist-modify-public,
                playlist-read-private,
                user-follow-read,
                user-read-private'''
    token = util.prompt_for_user_token(username=SPOTIFY_USERNAME, scope=scope, client_id=SPOTIFY_ID,
                                       client_secret=SPOTIFY_SECRET, redirect_uri='http://whatagoodbot.com/test-callback')
    sp = spotipy.Spotify(auth=token, requests_timeout=10, retries=10)
    return sp


def getGenre(trackId):
    sp = spotipy_login()
    spotifyTrack = sp.track(trackId)
    return sp.artist(spotifyTrack['artists'][0]['uri'])


def getAvailableMarkets(trackId):
    sp = spotipy_login()
    spotifyTrack = sp.track(trackId)
    return spotifyTrack['available_markets']