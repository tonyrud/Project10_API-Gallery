(function($) {
    'use strict';
    //filter selections by name/year realeased
    //fix read media property line 193??

    let albumsAjax,
        tracksAjax,
        imageSelected,
        currentLocation = 0;

    const $galleryImgs = $('.gallery'),
        $imgReplace = $('.imageContainer img'),
        $overlay = $('#overlay'),
        $searchField = $('#search'),
        $submitButton = $('#submit'),
        $artist = $('.artist'),
        $albumName = $('.album-name'),
        $albumYear = $('.album-year'),
        $nextBtn = $('#nextPhoto'),
        $prevBtn = $('#prevPhoto'),
        $filterName = $('#filter-name'),
        $filterDate = $('#filter-date');

    /****************
      Event functions
    *****************/

    // $overlay.append($imageContainer)
    // $("body").append($overlay);

    $('form').submit(function(evt) {
        evt.preventDefault();

        // $('.item-container').addClass('animate-out')

        //run ajax function from seach val
        if ($searchField.val().length > 0) {
          getAlbumsAjax($searchField.val());
          //disable search field and button while searching
          $searchField.prop("disabled", true);
          $submitButton.attr("disabled", true).val('searching...');
        } else {
          console.log('Enter an item');
        }



    });

    // click an image in the gallery
    $galleryImgs.on("click", ".item-container a", function(evt) {
        evt.preventDefault();
        imageSelected = $(this);
        currentLocation = $(this).parent('.item-container').index();

        //pass albums info, and the album clicked
        getTracksAjax(albumsAjax, currentLocation);

        $overlay.show().animate({
            opacity: '1'
        }, 500);
    });

    // create all album content
    let setAlbumInfo = function(tracksData, selectedImage) {

        // console.log(selectedImage);
        $imgReplace.attr('src', selectedImage);
        $artist.html(tracksData.artists[0].name);
        $albumName.html(tracksData.name);
        $albumYear.html(tracksData.release_date.slice(0, 4));

        $.getJSON("http://api.flickr.com/services/feeds/photos_public.gne?jsoncallback=?", {
                tags: tracksData.artists[0].name,
                format: "json"
            },
            displayFlickrImages);
    }

    // move overlay slide
    $overlay.on('click', '.btn-change', function(e) {
        e.stopPropagation();
        let clicked = $(this),
            changeImg,
            totalItems = albumsAjax.albums.items.length - 1;

        if (clicked.hasClass('next') && (currentLocation < totalItems)) {
            currentLocation++;
        } else if (clicked.hasClass('previous') && (currentLocation > 0)) {
            currentLocation--;
        } else {}

        changeImg = albumsAjax.albums.items[currentLocation].images[1].url
        getTracksAjax(albumsAjax, currentLocation);
    });

    // filter albums
    $('.filter-container').on('click', '.filter-btn', function(e) {
        let clicked = $(this);
        if (clicked.hasClass('filter-name')) {

        } else {

        }
    });

    //remove overlay when clicked
    $overlay.on('click', function(event) {
        // event.stopPropagation();
        $overlay.animate({
            opacity: '0'
        }, 'fast', function() {
            $overlay.hide();
        })
    });

    //create gallery
    var createGallery = function(data) {
        albumsAjax = data;

        var albumsImg = data.albums.items;
        let photoHTML = '';

        var createHTML = function(current) {
            photoHTML += '<div class="item-container">';
            photoHTML += '<a href="' + current.images[0].url + '">';
            photoHTML += '<img class="image thumb" src="' + current.images[1].url + '" alt="Gallery images"/></a>';
            photoHTML += '</div>';
            $galleryImgs.html(photoHTML);
        }

        for (var album in albumsImg) {
            createHTML(albumsImg[album]);
        }

        if (albumsImg.length === 0) {
          photoHTML = '<h2>No Albums Found</h2>';
        } else {

        }

        $('.item-container').each(function(i) {
          let element = $(this);
          setTimeout(function () {
            element.addClass('animate-in');
          }, 100 * i);
        });




        $searchField.prop("disabled", false);
        $submitButton.attr("disabled", false).val('Search');
    }

    //create tracks list
    let createTracks = function(data) {
        let tracksToShow = 100;
        //run set data function
        setAlbumInfo(data, albumsAjax.albums.items[currentLocation].images[1].url)
            // tracksAjax = data;
        let tracksHTML = '';
        let tracksList = data.tracks.items

        function msToMinutesAndSeconds(ms) {
            var minutes = Math.floor(ms / 60000);
            var seconds = ((ms % 60000) / 1000).toFixed(0);
            return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
        }
        var createTrackList = function(current) {
            tracksHTML += '<li class="track">'
            tracksHTML += '<span>' + current.track_number + '. ' + current.name + '</span>' + '<span>' + msToMinutesAndSeconds(current.duration_ms) + '</span>';
            tracksHTML += '</li>'
            return tracksHTML
        }

        //loop through tracks
        for (var i = 0; i < tracksList.length; i++) {
            createTrackList(tracksList[i]);
          }

        $('.track-list').html(tracksHTML);
    }

    //create flickr images
    var displayFlickrImages = function(data) {
        let flickItems = data.items,
            listImg = '';
        for (var i = 0; i < 6; i++) {
            listImg += '<li>'
            listImg += '<img src="'
            if (data.items == 0) {
                listImg = 'no images';
            } else {
                listImg += flickItems[i].media.m + '" alt="flickr image">';
            }
            listImg += '</li>'
        }

        $('.flickr-list').html(listImg);
    }

    /****************
      AJAX Calls
    *****************/

    //ajax functions
    let getAlbumsAjax = function(query) {
        $.ajax({
            url: 'https://api.spotify.com/v1/search',
            data: {
                q: query,
                type: 'album'
            },
            success: createGallery
        });
    };

    //Ajax call for track info
    let getTracksAjax = function(data, index) {
        let imageId = data.albums.items[index].id
        $.ajax({
            url: 'https://api.spotify.com/v1/albums/' + imageId,
            success: createTracks
        });
    };
})(jQuery);
