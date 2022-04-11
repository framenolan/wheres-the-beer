"use strict";

function validateEntry(e) {
    e = e.trim();
    if (!e) {
        console.log("empty entry");
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
    } else if ( e.includes(",")) {
        var eArray = e.split(",");
        if (eArray.length != 2) {
            console.log("invalid city entry");
        }
        eArray[0] = eArray[0].trim();
        eArray[1] = eArray[1].trim();
        if (/^[A-Za-z\s]*$/.test(eArray[0]) && /^[A-Za-z\s]*$/.test(eArray[1])){ //regex to check if string is letters and spaces only
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
        .catch(function(error) {
            console.log('error');
        });
}

function getByName(name) {
    // fetch by name
    fetch(`https://api.openbrewerydb.org/breweries?by_name=${name}`)
        .then(function (response) {
            if(!response.ok) {
                throw new Error('response not ok');
            }
            return response.json();
        })
        .then(function (data) {
            showResults(data);
        })
        .catch(function(error) {
            console.long('error')
        })
}

function geocode(location) {
    // location is zip code ex. 98005
    // OR city + state encoded ex. san%20diego+ca
    let url = `https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyA-pYFi70-5pv6ldc1jAStH871OgfoMre8&address=${location}`;
    return fetch(url)
        .then(res => {
            return res.ok ? res.json() : Promise.reject(res);
        })
        .then(res => {
            if (res && res.results && res.results.length) {
                return res.results[0].geometry.location;
            } else {
                Promise.reject(res);
                return null;
            }
        })
        .catch(err => {
            console.log("err: ", err);
        });
}

function showResults(data) {
    console.log(data);
    $("#searchResults").empty();
    if (data.length === 0) {
        $("#searchResults").append($(`<div class="box">No Results</div>`));
    } else {
        for (let i=0; i<data.length; i++) {
            var brewBox = $(`<div class="box"></div>`);
            brewBox.append($(`<h1>${data[i].name}</h1>`));
            brewBox.append($(`<p>${data[i].street}</p>`));
            brewBox.append($(`<p>${data[i].city}, ${data[i].state} ${data[i].postal_code}</p>`));
            brewBox.append($(`<p>${data[i].phone}</p>`));
            brewBox.append($(`<p>${data[i].website_url}</p>`));
            $("#searchResults").append(brewBox);
        }
    }
}


$("#searchBtn").on('click', function (event) {
    event.preventDefault();
    validateEntry($("#searchInput").val());
    $("#searchInput").val("");
});