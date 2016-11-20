(function($) {
    'use strict';

    let albumsAjax,
        tracksAjax,
        imageSelected,
        photoHTML,
        itemsSort,
        tracksArray = [],
        currentLocation = 0;

    const $gallery = $('.gallery'),
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


    // compare functions for sorting
    let compare = {
        name: function(a, b) {
            a = a.replace(/^the /i, ''); //remove 'the' from the beginning of name
            b = b.replace(/^the /i, ''); //remove 'the' from the beginning of name

            if (a < b) {
                return -1;
            } else {
                return a > b ? 1 : 0; //if a is greater than b, return 1 : or return 0 if the same
            }
        },
        date: function(a, b) {
            a = new Date(a);
            b = new Date(b);

            return a - b;
        }
    };


    /****************
      Event functions
    *****************/

    $('form').submit(function(evt) {
        evt.preventDefault();
        photoHTML = '';
        tracksArray = [];

        $('.filter-btn').removeClass('ascending descending');
        //run ajax function from seach val
        if ($searchField.val().length > 0) {
            getAlbumsAjax($searchField.val());

            //disable search field and button while searching
            disableBtns(true, 'searching...');
        } else {
            console.log('Enter an item');
        }



    });

    let disableBtns = function(disable, btnValue){
      $searchField.prop("disabled", disable);
      $submitButton.attr("disabled", disable).val(btnValue);
    }

    // click an image in the gallery
    $gallery.on("click", ".item-container .overlay-details", function(evt) {
        evt.preventDefault();
        imageSelected = $(this).siblings('a');
        currentLocation = $(this).parent('.item-container').index();

        createTracks(tracksArray[currentLocation]);



        $overlay.show().animate({
            opacity: '1'
        }, 500);
    });

    // move overlay slide
    $overlay.on('click', '.btn-change', function(e) {
        e.stopPropagation();
        let clicked = $(this),
            totalItems = albumsAjax.length - 1;

        if (clicked.hasClass('next') && (currentLocation < totalItems)) {
            currentLocation++;
        } else if (clicked.hasClass('previous') && (currentLocation > 0)) {
            currentLocation--;
        } else {}

        createTracks(tracksArray[currentLocation]);
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

    /****************
      filter functions
    *****************/

    let gallerySort = function() {

    };

    // filter albums
    $('.filter-container').on('click', '.filter-btn', function(e) {
      $gallery.each(function() {
          let $gallerySort = $(this);
          itemsSort = $gallery.find('.item-container').toArray();
      });

        let $clicked = $(this),
            order = $clicked.data('sort'),
            column;

        //check if item is ascending or descending, then reverse
        if ($clicked.is('.ascending') || $clicked.is('.descending')) {
            $clicked.toggleClass('ascending descending');
            gallerySort();
            $gallery.append(itemsSort.reverse());
            tracksArray.reverse();
        } else {
            gallerySort();
            $clicked.addClass('ascending');
            $clicked.siblings().removeClass('ascending descending');

            //if compare object has data-sort
            if (compare.hasOwnProperty(order)) {
              column = $clicked.index()-1;

                for (var track in tracksArray) {
                  if (column === 0) {
                    tracksArray.sort(function(a, b) {
                        a = a.name;
                        b = b.name;
                        return compare[order](a,b);
                    });
                  } else {
                    tracksArray.sort(function(a, b) {
                        a = a.release_date;
                        b = b.release_date;
                        return compare[order](a,b);
                    });
                  }
                }

                itemsSort.sort(function(a, b) {
                    a = a.children[1].children[column].innerHTML;
                    b = b.children[1].children[column].innerHTML;
                    return compare[order](a,b);
                });
                $gallery.append(itemsSort);
            }
        }
    });

    // create all album content
    let setAlbumInfo = function(tracksData) {
        let year = tracksData.release_date.slice(0, 4),
            name = tracksData.name,
            picture = tracksData.images[0].url;

        $imgReplace.attr('src', picture);
        $artist.html(tracksData.artists[0].name);
        $albumName.html(name);
        $albumYear.html(year);
        $.getJSON("http://api.flickr.com/services/feeds/photos_public.gne?jsoncallback=?", {
                tags: tracksData.artists[0].name,
                format: "json"
            },
            displayFlickrImages);
    }

    //create gallery
    var createGallery = function(data) {
        let albumImg = data.images[1].url,
            albumYear = data.release_date.slice(0, 4),
            albumName = data.name;

        photoHTML += '<div class="item-container">';
        photoHTML += '<a href="' + albumImg + '">';
        photoHTML += '<img class="image thumb" src="' + albumImg + '" alt="Gallery images"/></a>';
        photoHTML += '<div class="overlay-details">'
        photoHTML += '<h2 class="overlay-album">' + albumName + '</h2>'
        photoHTML += '<h3 class="overlay-year">' + albumYear + '</h3>'
        photoHTML += '</div>'
        photoHTML += '</div>';

        $gallery.html(photoHTML);

        //animate albums in
        $('.item-container').each(function(i) {
            let element = $(this);
            setTimeout(function() {
                element.addClass('animate-in');
            }, 100 * i);
        });

        disableBtns(false, 'Search');
    }

    let tracksData = function(data) {
        tracksAjax = data;
        tracksArray.push(tracksAjax);
        createGallery(tracksAjax);
    }

    let albumData = function(data) {
        albumsAjax = data.albums.items;

        if (albumsAjax.length === 0) {
            photoHTML = '<h2>No Albums Found</h2>';
            $gallery.html(photoHTML);
            disableBtns(false, 'Search');
        }
        for (var album in albumsAjax) {
            getTracksAjax(data, album);
        }

        // createGallery(albumsAjax);
    }

    //create tracks list
    let createTracks = function(data) {

        //run set data function
        setAlbumInfo(data)
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
        };

        //loop through tracks
        for (var i = 0; i < tracksList.length; i++) {
            createTrackList(tracksList[i]);
        };

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
    };

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
            success: albumData
        });

    };

    //Ajax call for track info
    let getTracksAjax = function(data, index) {
        // console.log(data);
        let imageId = data.albums.items[index].id;
        $.ajax({
            url: 'https://api.spotify.com/v1/albums/' + imageId,
            success: tracksData
        });
    };
})(jQuery);
