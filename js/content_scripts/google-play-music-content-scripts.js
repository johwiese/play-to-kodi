
var script = document.createElement('script');
script.textContent = 'window.postMessage(window["USER_ID"], window.location.origin);';
document.body.appendChild(script);

window.addEventListener('message', function(event) {
    if (event.source == window) {
        initMusic(event.data);
    }
});

$(window).on('load', initMenu);

// ---

var tracks = {}, albums = {}, artists = {};

function initMusic(userId) {
    tracks = {};
    albums = {};
    artists = {};

    window.indexedDB.open('music_' + userId).onsuccess = function(event) {
        var db = event.target.result;

        var keys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];

        for (var i = 0; i < keys.length; i++) {
            for (var j = 0; j < keys.length; j++) {
                db.transaction('tracks').objectStore('tracks').get(keys[i] + keys[j]).onsuccess = function(event) {
                    $.each($.parseJSON(event.target.result), function() {
                        var track = encodeKey(this[1]),
                            album = encodeKey(this[4]),
                            artist = encodeKey(this[5]);

                        tracks[this[0]] = this[27];

                        if (!albums[artist + '/' + album]) {
                            albums[artist + '/' + album] = this[32];
                        }

                        if (!artists[artist]) {
                            artists[artist] = this[33];
                        }
                    });
                };
            }
        }
    };
}

function encodeKey(key) {
    return encodeURIComponent(key).replace(/%20/g, '+');
}

function initMenu() {
    $('.goog-menu').prepend('<div class="goog-menuseparator" role="separator"></div>');

    var playLabel = 'Play to Kodi',
        playNextLabel = 'Play next',
        queueLabel = 'Queue';

    $('.goog-menu.song-menu').prepend(createMenuItem(queueLabel).on('click', function() {
        queueThis(getTrackMenuDataPath());
    })).prepend(createMenuItem(playNextLabel).on('click', function() {
        playThisNext(getTrackMenuDataPath());
    })).prepend(createMenuItem(playLabel).on('click', function() {
        playThis(getTrackMenuDataPath());
    }));

    $('.goog-menu.album-menu').prepend(createMenuItem(queueLabel).on('click', function() {
        queueThis(getAlbumMenuDataPath());
    })).prepend(createMenuItem(playNextLabel).on('click', function() {
        playThisNext(getAlbumMenuDataPath());
    })).prepend(createMenuItem(playLabel).on('click', function() {
        playThis(getAlbumMenuDataPath());
    }));

    $('.goog-menu.playlist-menu').prepend(createMenuItem(queueLabel).on('click', function() {
        queueThis(getPlaylistMenuDataPath());
    })).prepend(createMenuItem(playNextLabel).on('click', function() {
        playThisNext(getPlaylistMenuDataPath());
    })).prepend(createMenuItem(playLabel).on('click', function() {
        playThis(getPlaylistMenuDataPath());
    }));

    $('.goog-menu:not(.song-menu):not(.album-menu):not(.playlist-menu)').prepend(createMenuItem(queueLabel).on('click', function() {
        queueThis(getOtherMenuDataPath());
    })).prepend(createMenuItem(playNextLabel).on('click', function() {
        playThisNext(getOtherMenuDataPath());
    })).prepend(createMenuItem(playLabel).on('click', function() {
        playThis(getOtherMenuDataPath());
    }));
}

function createMenuItem(label) {
    var menuItem = $('<div class="goog-menuitem" role="menuitem"><div class="goog-menuitem-content"><paper-ripple></paper-ripple>' + label + '</div></div>');

    menuItem.on('mouseover', function() {
        $(this).addClass('goog-menuitem-highlight');
    });

    menuItem.on('mouseout', function() {
        $(this).removeClass('goog-menuitem-highlight');
    });

    menuItem.on('click', function() {
        $(this).parent('.goog-menu').hide();
    });

    return menuItem;
}

function getTrackMenuDataPath() {
    var trackId, albumId;

    if ((trackId = getTrackId())) {
        return '/track/' + trackId + '/' + (getAlbumId() || '') + '/' + (getTrackArtist() || '') + '/' + (getTrackTitle() || '');
    }
}

function getAlbumMenuDataPath() {
    var albumId;

    if ((albumId = getAlbumId())) {
        return '/album/' + albumId;
    }
}

function getPlaylistMenuDataPath() {
    var playlistId, autoPlaylistId;

    if ((playlistId = getPlaylistId())) {
        return '/pl/' + playlistId;
    }

    if ((autoPlaylistId = getAutoPlaylistId())) {
        return '/ap/' + autoPlaylistId;
    }
}

function getOtherMenuDataPath() {
    var artistId, stationId;

    if ((artistId = getArtistId())) {
        return '/artist/' + artistId;
    }

    if ((stationId = getStationId())) {
        return '/wst/' + stationId;
    }
}

function getTrackId() {
    var dataId = $('.song-row.selected-song-row').data('id');

    if (dataId && (dataMatch = dataId.match('([^-]+-[^-]+-[^-]+-[^-]+-[^-]+)'))) {
        return tracks[dataMatch[1]] || dataId;
    }

    return dataId;
}

function getTrackTitle() {
    var songRow = $('.song-row.selected-song-row');

    if (songRow) {
        return songRow.find('[data-col="title"] .column-content').text().trim();
    }
}

function getTrackArtist() {
    var songRow = $('.song-row.selected-song-row');

    if (songRow) {
        return songRow.find('[data-col="artist"] .column-content').text().trim();
    }
}

function getAlbumId() {
    var dataId = $('.song-table[data-type="album"], .menu-displayed[data-type="album"]').data('id');

    if (dataId && (dataMatch = dataId.match('([^/]*)/([^/]+)/([^/]+)'))) {
        return dataMatch[1] || albums[dataMatch[2] + '/' + dataMatch[3]] || dataId;
    }

    return dataId;
}

function getArtistId() {
    var dataId = $('.menu-displayed[data-type="artist"]').data('id');

    if (dataId && (dataMatch = dataId.match('([^/]*)/([^/]+)'))) {
        return dataMatch[1] || artists[dataMatch[2]] || dataId;
    }

    return dataId;
}

function getPlaylistId() {
    var dataId = $('.song-table[data-type="pl"], .menu-displayed[data-type="pl"]').data('id');

    return dataId;
}

function getAutoPlaylistId() {
    var dataId = $('.song-table[data-type="ap"], .menu-displayed[data-type="ap"]').data('id');

    return dataId;
}

function getStationId() {
    var dataId = $('.info[data-type="wst"], .menu-displayed[data-type="wst"]').data('id');

    return dataId;
}

var baseUrl = 'https://play.google.com/music/listen#';

function playThis(path) {
    chrome.extension.sendMessage({action: 'playThis', url: baseUrl + path}, function(response) {});
}

function playThisNext(path) {
    chrome.extension.sendMessage({action: 'playThisNext', url: baseUrl + path}, function(response) {});
}

function queueThis(path) {
    chrome.extension.sendMessage({action: 'queueThis', url: baseUrl + path}, function(response) {});
}
