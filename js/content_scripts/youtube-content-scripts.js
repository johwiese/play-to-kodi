initYouTubeList();

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action == "getPlaylistUrls") {
            initYouTubeList();
            sendResponse({urlList: JSON.stringify(urlList)});
        } else if (request.action == "onPlayback") {
            $("video")[0].pause();
        }
    }
);

/**
 * if this is youtube page which is part of a playlist , show all videos and the option to queue them all
 *
 */
function initYouTubeList(){
    var tabUrl = window.location.href;
    var youTubeListId = getURLParameter(tabUrl, 'list');
    if (youTubeListId && youTubeListId != playlistId){
        playlistId = youTubeListId;
        extractVideosFromYouTubePlaylist(youTubeListId);
    }
}

function extractVideosFromYouTubePlaylist(playListID, token) {
    var videoURL = 'https://www.youtube.com/watch?v=';
    var playListURL = '//www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=' + playListID + '&key=AIzaSyA3INgfTLddMbrJm8f68xpvfPZDAzDqk10';
    if (token) {
        playListURL = playListURL + '&pageToken=' + token;
    }

    $.getJSON(playListURL, function (data) {
        var nextPageToken;
        if (data.nextPageToken) {
            nextPageToken = data.nextPageToken;
        }

        $.each(data.items, function (i, item) {
            var videoID = item.contentDetails.videoId;
            var url = videoURL + videoID;

            urlList.push(url);
        });

        if (nextPageToken) {
            extractVideosFromYouTubePlaylist(playListID, startIndex + itemsPerPage);
        }
    });
}

var playlistId;
var urlList = [];

function getURLParameter(tabUrl, sParam) {
    var sPageURL = tabUrl.substring(tabUrl.indexOf('?') + 1 );
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) {
            return sParameterName[1];
        }
    }
    return null;
}


// On page thumbnail actions.

var observer = new MutationObserver(mutations => {
    const initButtonNodes = ['YTD-ITEM-SECTION-RENDERER', 'YTD-PLAYLIST-VIDEO-RENDERER', 'YTD-GRID-VIDEO-RENDERER'];

    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (initButtonNodes.indexOf(node.nodeName) >= 0) initButtons(node);
        }
    }
});

observer.observe(document, {
    childList: true,
    subtree: true,
});

initButtons(document);

function initButtons(parent) {
    for (const thumbnail of parent.querySelectorAll('ytd-thumbnail')) {
        if (thumbnail.querySelector('.ptk-thumbnail-buttons')) continue;

        const href = (thumbnail.querySelector('a#thumbnail') || {}).href;

        thumbnail.appendChild(createThumbnailButtons(thumbnail, href));
    }
}

function createThumbnailButtons(thumbnail, href) {
    const iconsBaseUrl = 'https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg';

    const container = document.createElement('div');

    container.className = 'ptk-thumbnail-buttons';
    container.style.cssText = 'width: 108px; height: 36px; margin: auto; z-index: 100; position: absolute; top: 0; left: 0; right: 0; bottom: 20px;';

    container.appendChild(createThumbnailButton('Play now', `${iconsBaseUrl}/ic_play_arrow_white_24px.svg`, 'playThis', href));
    container.appendChild(createThumbnailButton('Play this Next', `${iconsBaseUrl}/ic_playlist_play_white_24px.svg`, 'playThisNext', href));
    container.appendChild(createThumbnailButton('Queue', `${iconsBaseUrl}/ic_playlist_add_white_24px.svg`, 'queueThis', href));

    return container;
}

function createThumbnailButton(title, image, action, href) {
    const button = document.createElement('a');

    button.className = 'ptk-thumbnail-button';
    button.style.cssText = 'width: 28px; height: 28px; margin: 4px; cursor: pointer; opacity: 0.8; display: inline-flex; align-items: center; justify-content: center; border-radius: 2px; background-color: #111;';

    button.title = title;
    button.innerHTML = `<iron-icon src="${image}">`;

    button.onclick = () => {
        chrome.extension.sendMessage({action: action, url: href}, () => {});

        return false;
    };

    return button;
}
