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
            console.log("invalid city entry");
        }
    } else {
        getByName(e);
    }
}

function getByCoord(coord) {
        // fetch by coordinate sort by distance
        fetch(`https://api.openbrewerydb.org/breweries?by_dist=${coord.lat},${coord.lng}`)
        .then(function (response) {
            if (!response.ok) {
                //make sure response is ok, throw error if not
                throw new Error('response not ok');
            }
            return response.json();
        })
        .then(function (data) {
            console.log(data);
        })
        .catch(function(error) {
            console.log('error');
        });
}

function getByName(name) {
    // fetch by name
    console.log("searching by name");
    fetch(`https://api.openbrewerydb.org/breweries?by_name=${name}`)
        .then(function (response) {
            if(!response.ok) {
                throw new Error('response not ok');
            }
            return response.json();
        })
        .then(function (data) {
            console.log(data);
            if (data.length === 0) {
                console.log('no results by name')
            }
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
            }
        })
        .catch(err => {
            console.log("err: ", err);
        });
}

function showResults(data) {
    if (data.length === 0) {
        //TODO: show no results on html
    } else {

    }
}

$("#searchBtn").on('click', function (event) {
    event.preventDefault();
    validateEntry($("#searchText").val());
    $("#searchText").val("");
});