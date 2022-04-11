"use strict";

function validateEntry(e) {
    e = e.trim();
    if (!e) {
        console.log("empty entry");
    } else if (/^\d+$/.test(e)) { //regex to check if string is only numbers
        if (e.length === 5) {
            // all number and 5 digit, use getByPostal
            getByPostal(e);
        } else {
            console.log("wrong number digit for zipcode");
        }
    } else if (/^[A-Za-z\s]*$/.test(e)){ //regex to check if string is letters and spaces only
        // replace spaces with underscore
        e = e.split(" ").join("_");
        console.log(e);
        // try searching by city first
        getByCity(e);
    } else {
        console.log("invalid entry");
    }
}

function getByPostal(postal) {
    // fetch by postal code
    fetch(`https://api.openbrewerydb.org/breweries?by_postal=${postal}`)
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

function getByCity(city) {
    // fetch by city name
    fetch(`https://api.openbrewerydb.org/breweries?by_city=${city}`)
        .then(function (response) {
            if (!response.ok) {
                //make sure response is ok, throw error if not
                throw new Error('response not ok');
            }
            return response.json();
        })
        .then(function (data) {
            console.log(data);
            if (data.length === 0) {
                // try searching by name;
                console.log("maybe not a city let's try search by name");
                getByName(city);
            }
        })
        .catch(function(error) {
            console.log('error');
        });
}

function getByName(name) {
    // TODO: code for search by name
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

$("#searchBtn").on('click', function (event) {
    event.preventDefault();
    validateEntry($("#searchText").val());
    $("#searchText").val("");
});