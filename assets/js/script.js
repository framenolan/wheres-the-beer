"use strict";

var currentLocation, markers = [], previousListItemIndex = null;

function validateEntry(e) {
    e = e.trim();
    if (!e) {
    } else if (/^\d+$/.test(e)) { //regex to check if string is only numbers
        if (e.length === 5) {
            // all number and 5 digit, use getByPostal
            geocode(e).then(function (coord) {
                getByCoord(coord);
            });
            //getByCoord(coord);
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
            geocode(e).then(function (coord) {
                getByCoord(coord);
            });
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
    console.log("get by coords coord ", coord);
    if (!coord) {
        showResults([]);
        return;
    }
    fetch(`https://api.openbrewerydb.org/breweries?by_dist=${coord.lat},${coord.lng}`)
        .then(function (response) {
            console.log("get by coords res ", response);
            if (!response.ok) {
                //make sure response is ok, throw error if not
                throw new Error('response not ok');
            }
            return response.json();
        })
        .then(function (data) {
            console.log("data ", data)
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
            console.long('get by name error')
        })
}

function geocode(location) {
    // location is zip code ex. 98005
    // OR city + state encoded ex. san%20diego+ca
    let url = `https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyA-pYFi70-5pv6ldc1jAStH871OgfoMre8&address=${location}`;
    return fetch(url)
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(res => {
            if (res && res.results && res.results.length) {
                currentLocation = res.results[0].geometry.location;
                return res.results[0].geometry.location;
            } else {
                Promise.reject(res);
                // to do display error to user with input
                return null;
            }
        })
        .catch(err => {
            console.log("err: ", err);
        });
}

function showResults(data) {
    $("#searchResults").empty();
    if (data.length === 0) {
        $("#searchResults").append($(`<div class="box">No Results</div>`));
    } else {
        for (let i = 0; i < data.length; i++) {
            var brewBox = $(`<div id="idx-${i}" data-index="${i}" class="box"></div>`);
            if (data[i].website_url) {
                brewBox.append($(`<a href="${data[i].website_url}" target="_blank">${data[i].name}</a>`));
            } else {
                brewBox.append($(`<h1>${data[i].name}</h1>`));
            }
            brewBox.append($(`<p>${data[i].street}</p>`));
            brewBox.append($(`<p>${data[i].city}, ${data[i].state} ${data[i].postal_code}</p>`));
            brewBox.append($(`<p>${data[i].phone}</p>`));
            $("#searchResults").append(brewBox);
        }
        updateMap(currentLocation, data);
    }
}

// ******* MAP ***********
// ******* STUFF BELOW ***********
// ******* HERE ***********

// IMPORTANT: this event bubbling links the corresponding map markers map with list items
// either way markerToggleListItem will be called so all styling and dynamic changes only need to be there
// it's the next function below
$("#searchResults").on("click", ".box", event => {
    var index = $(event.target).is("div") ? $(event.target).attr('data-index') : $(event.target).parent('div').attr('data-index');
    google.maps.event.trigger(markers[index], 'click');
});

function markerToggleListItem(i) {
    // to do scorll to this maybe expand, add class, make sure to remove previous one
    $(`#idx-${i}`).css("backgroundColor", "red");
    // change the styling of the previously clicked list item back by removing the class or whatever
    // do the opposite here of what we did above
    if (previousListItemIndex !== null) {
        $(`#idx-${previousListItemIndex}`).css("backgroundColor", "white");
    }
    previousListItemIndex = i;
}

// center ({lat: lat, lng: lng}) results array of brewery objects
function updateMap(center, results) {
    if (markers.length) {
        // remove old markers from map, marker.setMap(null);
        markers.forEach(marker => marker = null);
        markers = [];
    }

    let map = new google.maps.Map(document.querySelector("#map"), { center });
    let infoWindow = new google.maps.InfoWindow({ content: "", disableAutoPan: true });
    let bounds = new google.maps.LatLngBounds();

    // Add markers to the map.

    // id="idx-${i}" data-index="${i}"
    for (let i = 0; i < results.length; i++) {
        var position = new google.maps.LatLng(results[i].latitude, results[i].longitude);
        bounds.extend(position);
        const marker = new google.maps.Marker({
            position,
            map,
            title: results[i].name,
            optimized: false,
            animation: google.maps.Animation.DROP,
            // label: results[i].name,
            // animation: google.maps.Animation.BOUNCE,
            // icon: './wittcode-marker.png',
        });
        map.fitBounds(bounds);
        // open info window when marker is clicked
        marker.addListener("click", (event) => {
            infoWindow.setContent(results[i].name);
            infoWindow.open(map, marker);
            map.panTo(position);
            markerToggleListItem(i);
        });
        markers.push(marker);
        // google.maps.event.trigger(markers[index], 'click')
    }
    previousListItemIndex = null;
}

// ******* END ***********
// ******* OF ***********
// ******* MAP ***********

$("#searchBtn").on('click', function (event) {
    event.preventDefault();
    validateEntry($("#searchInput").val());
    $("#searchInput").val("");
});
