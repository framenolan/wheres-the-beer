"use strict";

var currentLocation, markers = [];

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
                console.log("end geocode")
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
            var brewBox = $(`<div class="box"></div>`);
            brewBox.append($(`<h1>${data[i].name}</h1>`));
            brewBox.append($(`<p>${data[i].street}</p>`));
            brewBox.append($(`<p>${data[i].city}, ${data[i].state} ${data[i].postal_code}</p>`));
            brewBox.append($(`<p>${data[i].phone}</p>`));
            brewBox.append($(`<p>${data[i].website_url}</p>`));
            $("#searchResults").append(brewBox);
        }
        updateMap(currentLocation, data);
    }
}

// ******* MAP ***********
// ******* STUFF BELOW ***********
// ******* HERE ***********

// center ({lat: lat, lng: lng}) results array of brewery objects
function updateMap(center, results) {
    console.log(" updateMap center:  ", center);
    console.log("updateMap results: ", results);
    if (markers && markers.length) {
        markers.forEach(marker => {
            // marker.setMap(null);
            marker = null;
        })
    }

    let mapOptions = {
        center,
        zoom: 12
    };
    let map = new google.maps.Map(document.querySelector("#map"), mapOptions);

    const infoWindow = new google.maps.InfoWindow({
        content: "",
        disableAutoPan: true,
    });
    // Create an array of alphabetical characters used to label the markers.
    const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    // Add some markers to the map.
    markers = results.map((brewery, i) => {

        // const label = labels[i % labels.length];
        var position = { lat: Number(brewery.latitude), lng: Number(brewery.longitude) }
        const marker = new google.maps.Marker({
            position,
            map,
            title: brewery.name,
            optimized: false,
            animation: google.maps.Animation.DROP,
            // label: brewery.name,
            // animation: google.maps.Animation.BOUNCE,
            // icon: './wittcode-marker.png',
        });

        // markers can only be keyboard focusable when they have click listeners
        // open info window when marker is clicked
        marker.addListener("click", () => {
            infoWindow.setContent(brewery.name);
            infoWindow.open(map, marker);
            map.setCenter(position)
        });
    });

}

// ******* END ***********
// ******* OF ***********
// ******* MAP ***********

$("#searchBtn").on('click', function (event) {
    event.preventDefault();
    validateEntry($("#searchInput").val());
    $("#searchInput").val("");
});
