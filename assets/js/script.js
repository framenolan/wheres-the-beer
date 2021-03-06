"use strict";

var searchArea, autocomplete, map, infoWindow, cacheData = null, cacheFav = null, markers = [], bounds, previousListItemIndex = null, directionsRenderer = null, directionsService = null, showingFav = false, initialSearch;
var userCurrentLocation = { lat: null, lng: null, useCur: false };

function validateEntry(e) {
    e = e.trim();
    if (!e) {
    } else if (/^\d+$/.test(e)) { //regex to check if string is only numbers
        if (e.length === 5) {
            // all number and 5 digit, use getByPostal

            // check local storage for geocode
            let storedGeocode = JSON.parse(localStorage.getItem(`geocode-${e}`));
            if (storedGeocode) {
                getByCoord(storedGeocode)
            } else {
                geocode(e)
                    .then(coord => getByCoord(coord));
            }
        } else {
            console.log("wrong number digit for zipcode");
        }
    } else if (e.includes(",")) {
        var eArray = e.split(",");
        if (eArray.length != 2) {
            console.log("invalid city entry");
        }
        eArray[0] = eArray[0].trim();
        eArray[1] = eArray[1].trim();
        if (/^[A-Za-z\s]*$/.test(eArray[0]) && /^[A-Za-z\s]*$/.test(eArray[1])) { //regex to check if string is letters and spaces only
            eArray[0] = eArray[0].split(" ").join("%20");
            e = eArray.join("+");

            // check local storage for geocode
            let storedGeocode = JSON.parse(localStorage.getItem(`geocode-${e}`));
            if (storedGeocode) {
                getByCoord(storedGeocode)
            } else {
                geocode(e)
                    .then(coord => getByCoord(coord));
            }
        } else {
            $("#searchResults").empty();
            $("#searchResults").append($(`<div class="box">Enter City, State</div>`));
        }
    } else {
        getByName(e);
    }
}

function getByCoord(coord) {
    // fetch by coordinate sort by distance
    if (!coord) {
        showResults([]);
        return;
    }
    fetch(`https://api.openbrewerydb.org/breweries?by_dist=${coord.lat},${coord.lng}`)
        .then(function (response) {
            if (!response.ok) {
                //make sure response is ok, throw error if not
                throw new Error('response not ok');
            }
            return response.json();
        })
        .then(function (data) {
            showResults(data);
        })
        .catch(function (error) {
            console.log('getByCoord error ', error);
        });

}

function getByName(name) {
    // fetch by name
    fetch(`https://api.openbrewerydb.org/breweries?by_name=${name}`)
        .then(function (response) {
            if (!response.ok) {
                throw new Error('response not ok');
            }
            return response.json();
        })
        .then(function (data) {
            showResults(data);
        })
        .catch(function (error) {
            console.log('get by name error', error);
        })
}

function geocode(location) {
    // location is zip code ex. 98005
    // OR city + state encoded ex. san%20diego+ca
    let url = `https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyA-pYFi70-5pv6ldc1jAStH871OgfoMre8&address=${location}`;
    return fetch(url)
        .then(function (response) {
            if (!response.ok) {
                throw new Error('response not ok');
            }
            return response.json();
        })
        .then(res => {
            if (res && res.results && res.results.length) {
                searchArea = res.results[0].geometry.location;
                // setting local storage
                localStorage.setItem(`geocode-${location}`, JSON.stringify(res.results[0].geometry.location));
                return res.results[0].geometry.location;
            } else {
                return null;
            }
        })
        .catch(err => {
            console.log(err);
        });
}

// Validation based on brewery type and if lat/lon are empty, removes if brewery not valid
function checkTypeLatLng(data) {
    for (let i = 0; i < data.length; i++) {
        let breweryType = data[i].brewery_type
        let breweryLat = data[i].latitude
        let breweryLng = data[i].longitude

        if (breweryType == "closed" || breweryType == "planning") {
            data.splice(i, 1);
        } else if (!breweryLat || !breweryLng) {
            data.splice(i, 1);
        }
    }
    cacheData = data;
    return data;
}

function showResults(data) {
    $("#searchResults").empty();
    $('html, body').animate({
        scrollTop: $('#map').offset().top - 10
    }, 100);
    if (!data) {
        $("#searchResults").append($(`<div class="box">No Results</div>`));
        $(".main-section").removeClass("min-height");
    }
    else if (data.length === 0) {
        $("#searchResults").append($(`<div class="box">No Results</div>`));
        $(".main-section").removeClass("min-height");
    } else {
        data = checkTypeLatLng(data);
        cacheFav = JSON.parse(localStorage.getItem("favBrews"));
        // loop thru data and populate html
        var favToShow = []
        for (let i = 0; i < data.length; i++) {
            // check if favorited
            var faved = false;
            if (cacheFav) {
                for (let j = 0; j < cacheFav.length; j++) {
                    if (data[i].id === cacheFav[j].id) {
                        faved = true;
                        j = cacheFav.length;
                    }
                }
            }
            if (showingFav && faved) {
                favToShow.push(data[i]);
                var brewBox = $(`<div id="idx-${i}" data-index="${i}" class="box"></div>`);
                brewBox.append($(`<h1>${data[i].name}&nbsp&nbsp<a id="${data[i].id}">????</a></h1>`));
                var hidden = $(`<div id="hidden-${i}" style="display:none"></div>`)
                if (data[i].street) {
                    hidden.append($(`<p>${data[i].street}</p>`));
                }
                if (data[i].city && data[i].state && data[i].postal_code) {
                    hidden.append($(`<p>${data[i].city}, ${data[i].state} ${data[i].postal_code}</p>`));
                }
                if (data[i].phone) {
                    hidden.append($(`<a href="tel:${data[i].phone}">${data[i].phone}</a>`)).append('<br/>');
                }
                if (data[i].website_url) {
                    hidden.append($(`<a href="${data[i].website_url}" target="_blank">${data[i].website_url}</a>`));
                }
                brewBox.append(hidden);
                $("#searchResults").append(brewBox);
                $("#searchResults").append($(`<form class="form-box" id="form-${i}" style="display:none"><input id="search-${i}" type="text" placeholder="Enter Starting Location" class="input is-normal mt-1"></input>
                    <input type="submit" index="${i}" class="button neutral-btn mt-2 mr-3" value="Get Directions"><input type="button" index="${i}" class="button neutral-btn mt-2" value="Use Current Location"></form>`));

            } else if (!showingFav) {
                var brewBox = $(`<div id="idx-${i}" data-index="${i}" class="box"></div>`);
                if (faved) {
                    brewBox.append($(`<h1>${data[i].name}&nbsp&nbsp<a id="${data[i].id}">????</a></h1>`));
                } else {
                    brewBox.append($(`<h1>${data[i].name}&nbsp&nbsp<a id="${data[i].id}">????</a></h1>`));
                }
                var hidden = $(`<div id="hidden-${i}" style="display:none"></div>`)
                if (data[i].street) {
                    hidden.append($(`<p>${data[i].street}</p>`));
                }
                if (data[i].city && data[i].state && data[i].postal_code) {
                    hidden.append($(`<p>${data[i].city}, ${data[i].state} ${data[i].postal_code}</p>`));
                }
                if (data[i].phone) {
                    hidden.append($(`<a href="tel:${data[i].phone}">${data[i].phone}</a>`)).append('<br/>');
                }
                if (data[i].website_url) {
                    hidden.append($(`<a href="${data[i].website_url}" target="_blank">${data[i].website_url}</a>`));
                }
                brewBox.append(hidden);
                $("#searchResults").append(brewBox);
                $("#searchResults").append($(`<form class="form-box" id="form-${i}" style="display:none"><input id="search-${i}" type="text" placeholder="Enter Starting Location" class="input is-normal mt-1"></input>
                    <input type="submit" index="${i}" class="button neutral-btn mt-2 mr-3" value="Get Directions"><input type="button" index="${i}" class="button neutral-btn mt-2" value="Use Current Location"></form>`));
            }
        }

        $(".main-section").addClass("min-height");
        if (showingFav) {
            if (favToShow.length == 0) {
                $("#searchResults").append($(`<div class="box">No Favorites Here</div>`));
                $(".main-section").removeClass("min-height");
            }
            updateMap(searchArea, favToShow);
        } else {
            updateMap(searchArea, data);
        }
    }
}

//helper function to save favorites
function saveFav(id) {
    cacheFav = JSON.parse(localStorage.getItem("favBrews"));
    var fav;
    if (cacheData) {
        for (let i = 0; i < cacheData.length; i++) {
            if (cacheData[i].id === id) {
                fav = cacheData[i];
                i = cacheData.length;
            }
        }
    }
    if (!cacheFav) {
        //create new if no array
        cacheFav = [fav];
    } else {
        //check if fav already exists in favArray
        var exists = false;
        for (let i = 0; i < cacheFav.length; i++) {
            if (cacheFav[i].id === id) {
                exists = true;
                i = cacheFav.length;
            }
        }
        if (!exists) {
            cacheFav.push(fav);
        }
    }
    // update local storage
    localStorage.setItem("favBrews", JSON.stringify(cacheFav));
}

//helper function to delete favorites
function delFav(id) {
    cacheFav = JSON.parse(localStorage.getItem("favBrews"));
    if (cacheFav) {
        for (let i = 0; i < cacheFav.length; i++) {
            if (cacheFav[i].id === id) {
                cacheFav.splice(i, 1);
            }
        }
    }
    // update local storage
    localStorage.setItem("favBrews", JSON.stringify(cacheFav));
}

// favoring items
$("#searchResults").on("click", "a", event => {
    event.preventDefault();
    var id = event.target.getAttribute('id');
    if (event.target.textContent == "????") {
        event.target.textContent = "????";
        saveFav(id);
    } else if (event.target.textContent == "????") {
        event.target.textContent = "????";
        delFav(id);
    }
});

// show favorites
$("#showFavBtn").on("click", event => {
    event.preventDefault();
    if (showingFav) {
        showingFav = false;
        event.target.style.backgroundColor = 'gray';
        showResults(cacheData);
    } else {
        showingFav = true;
        event.target.style.backgroundColor = '#FEE102';
        if (!cacheData) {
            var favArray = JSON.parse(localStorage.getItem("favBrews"));
            showResults(favArray);
        } else {
            showResults(cacheData);
        }
    }
});

// Prints search term to top of search results
function printSearchTerm(searchTerm) {
    $("#resultsTextDiv").empty();
    if (searchTerm) {
        $("#resultsTextDiv").append($(`<p id="resultsText" class="is-medium light-white">Results for "${searchTerm}"</p>`));
    }
}

// ******* MAP ***********
// ******* STUFF BELOW ***********
// ******* HERE ***********

// search by user input address
$("#searchResults").on("click", ":submit", event => {
    event.preventDefault();
    var place = autocomplete.getPlace();
    var i = event.target.getAttribute('index');
    $(`#search-${i}`).val("");
    if (place) {
        var start = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
        var destination = { lat: $(`#button-idx-${i}`).attr('data-lat'), lng: $(`#button-idx-${i}`).attr('data-lng') };
        calculateAndDisplayRoute(start, destination);
    } else if (userCurrentLocation.useCur) {
        var destination = { lat: $(`#button-idx-${i}`).attr('data-lat'), lng: $(`#button-idx-${i}`).attr('data-lng') };
        calculateAndDisplayRoute(userCurrentLocation, destination);
    }
});

// enter current location as starting point
$("#searchResults").on("click", ":button", event => {
    event.preventDefault();
    if (!userCurrentLocation.lat && !userCurrentLocation.useCur) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                userCurrentLocation = { lat: position.coords.latitude, lng: position.coords.longitude, useCur: true };
                var i = event.target.getAttribute('index');
                $(`#search-${i}`).attr("placeholder", "Using Current Location");
                $(`#search-${i}`).val("");
                var destination = { lat: $(`#button-idx-${i}`).attr('data-lat'), lng: $(`#button-idx-${i}`).attr('data-lng') };
                calculateAndDisplayRoute(userCurrentLocation, destination);
            });
        }
    } else if (userCurrentLocation.lat) {
        var i = event.target.getAttribute('index');
        $(`#search-${i}`).attr("placeholder", "Using Current Location");
        $(`#search-${i}`).val("");
        var destination = { lat: $(`#button-idx-${i}`).attr('data-lat'), lng: $(`#button-idx-${i}`).attr('data-lng') };
        calculateAndDisplayRoute(userCurrentLocation, destination);
    }
});


// IMPORTANT: this event bubbling links the corresponding map markers map with list items
// either way markerToggleListItem will be called so all styling and dynamic changes only need to be there
// it's the next function below
$("#searchResults").on("click", ".box", event => {
    if (markers.length) {
        var index = $(event.target).is("div") ? $(event.target).attr('data-index') : $(event.target).parent('div').attr('data-index');
        google.maps.event.trigger(markers[index], 'click');
    } else {
        //browser doesnt support geolocation
    }
});

function markerToggleListItem(i) {
    // to do scorll to this maybe expand, add class, make sure to remove previous one
    if (previousListItemIndex == i && document.activeElement.nodeName != 'INPUT') {
        $(`#idx-${previousListItemIndex}`).css("backgroundColor", "white");
        $(`#hidden-${previousListItemIndex}`).hide();
        $(`#form-${previousListItemIndex}`).hide();
        infoWindow.close();
        previousListItemIndex = null;
    } else {
        $(`#idx-${i}`).css("backgroundColor", "var(--colorfulaccent)");
        $(`#hidden-${i}`).show();
        // add autocomplete to the search box, show search box
        autocomplete = new google.maps.places.Autocomplete(document.getElementById(`search-${i}`));
        if (userCurrentLocation.useCur) {
            $(`#search-${i}`).attr("placeholder", "Using Current Location");
        }
        $(`#form-${i}`).show();
        // change the styling of the previously clicked list item back by removing the class or whatever
        // do the opposite here of what we did above
        if (previousListItemIndex !== null) {
            $(`#idx-${previousListItemIndex}`).css("backgroundColor", "white");
            $(`#hidden-${previousListItemIndex}`).hide();
            $(`#form-${previousListItemIndex}`).hide();
        }

        $("#searchResults").scrollTo(`#idx-${i}`);
        previousListItemIndex = i;
    }
}

// center ({lat: lat, lng: lng}) results array of brewery objects
function updateMap(center, results) {
    if (!initialSearch) {
        $("#collage").addClass("hide");
        $("#mapContainer").removeClass("hide");
        $("#collage2").removeClass("hide");
        $("#sidebarColumn").removeClass("formatCenter");
        $("#mapColumn").removeClass("formatFullWidth");
        $("#section").removeClass("formatPadding");
        initialSearch = true;
    }

    if (markers.length) {
        // remove old markers from map, marker.setMap(null);
        markers.forEach(marker => marker = null);
        markers = [];
    }

    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsService = new google.maps.DirectionsService();
    infoWindow = new google.maps.InfoWindow({ content: "", disableAutoPan: true });
    map = new google.maps.Map(document.querySelector("#map"), { center, disableDefaultUI: true });
    bounds = new google.maps.LatLngBounds();

    directionsRenderer.setMap(map);
    directionsRenderer.setPanel(document.querySelector("#directionsContainer"));

    // Add markers to the map.
    for (let i = 0; i < results.length; i++) {
        var position = new google.maps.LatLng(results[i].latitude, results[i].longitude);
        bounds.extend(position);
        const marker = new google.maps.Marker({
            position,
            map,
            title: results[i].name,
            optimized: false,
            animation: google.maps.Animation.DROP,
        });
        map.fitBounds(bounds);
        // open info window when marker is clicked
        marker.addListener("click", (event) => {
            infoWindow.setContent(`
                <h3 id="button-idx-${i}" data-index="${i}" data-lat="${results[i].latitude}" data-lng="${results[i].longitude}">${results[i].name}</h3>
                <h3>${results[i].street}</h3>
                <h3>${results[i].city}, ${results[i].state} ${results[i].postal_code}</h3>
            `);
            infoWindow.open(map, marker);
            map.panTo({ lat: Number(results[i].latitude), lng: Number(results[i].longitude) });
            markerToggleListItem(i);
        });
        markers.push(marker);
    }
    infoWindow.addListener("closeclick", (event) => {
        $(`#idx-${previousListItemIndex}`).css("backgroundColor", "white");
        $(`#hidden-${previousListItemIndex}`).hide();
        $(`#form-${previousListItemIndex}`).hide();
        previousListItemIndex = null;
    });
    previousListItemIndex = null;
    $('html, body').animate({
        scrollTop: $('#map').offset().top - 10
    }, 100);
}

// display directions and draw route
function calculateAndDisplayRoute(start, end) {
    const origin = new google.maps.LatLng(start.lat, start.lng);
    const destination = new google.maps.LatLng(end.lat, end.lng);
    markers.forEach(marker => marker.setMap(null));

    directionsService
        .route({
            origin,
            destination,
            travelMode: google.maps.TravelMode.DRIVING,
        })
        .then((response) => {
            $("#directionsContainer").html("<button id='backButton' class='button neutral-btn'>Back</button>");
            $("#directionsContainer").removeClass("hide");
            $("#directionsContainer").addClass("show");
            $("#sidebarColumn").addClass("hide");
            directionsRenderer.setDirections(response);
        })
        .catch((e) => window.alert("Directions request failed due to " + e));
}

// back button listener
$("#directionsContainer").on("click", "#backButton", event => {
    if ($(event.target).is("button")) {
        // reset autocomplete on back
        autocomplete = new google.maps.places.Autocomplete(document.getElementsByClassName('pac-target-input')[0]);

        $("#directionsContainer").removeClass("show");
        $("#directionsContainer").addClass("hide");
        $("#sidebarColumn").removeClass("hide");
        markers.forEach(marker => {
            bounds.extend(marker.position);
            map.fitBounds(bounds);
            marker.setMap(map);
            marker.setAnimation(google.maps.Animation.DROP);
        });
        directionsRenderer.set('directions', null);
    }
});
// directions button listener
$("#map").on("click", ".directionsButton", event => {
    if ($(event.target).is("button")) {
        var destination = { lat: $(event.target).attr('data-lat'), lng: $(event.target).attr('data-lng') };

        // to do display destination name on info window
        // make sure getting user location works properly and on time and error if not
        if (!userCurrentLocation) {
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition((position) => {
                    userCurrentLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
                    calculateAndDisplayRoute(userCurrentLocation, destination);
                });
            }
        } else {
            calculateAndDisplayRoute(userCurrentLocation, destination);
        }
    }
});

// list scroll function on marker or item click
jQuery.fn.scrollTo = function (elem, speed) {
    $(this).animate({
        scrollTop: $(this).scrollTop() - $(this).offset().top + $(elem).offset().top
    }, speed == undefined ? 1000 : speed);
    return this;
};

// ******* END ***********
// ******* OF ***********
// ******* MAP ***********

$("#searchBtn").on('click', function (event) {
    event.preventDefault();
    validateEntry($("#searchInput").val());
    printSearchTerm($("#searchInput").val());
    $("#searchInput").val("");
});
