// "use strict";

// var markers = [];

// function deleteMarkers() {
//     markers.forEach(marker => {
//         marker.setMap(null);
//         marker = null;
//     })
// }

// // center ({lat: lat, lng: lng}) results array of brewery objects
// function updateMap(center, results) {
//     deleteMarkers();
//     let mapOptions = {
//         center,
//         zoom: 12
//     };
//     let map = new google.maps.Map(document.querySelector("#map"), mapOptions);

//     const infoWindow = new google.maps.InfoWindow({
//         content: "",
//         disableAutoPan: true,
//     });
//     // Create an array of alphabetical characters used to label the markers.
//     const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
//     // Add some markers to the map.
//     markers = results.map((brewery, i) => {

//         // const label = labels[i % labels.length];
//         var position = { lat: Number(brewery.latitude), lng: Number(brewery.longitude) }
//         const marker = new google.maps.Marker({
//             position,
//             map,
//             title: brewery.name,
//             optimized: false,
//             animation: google.maps.Animation.DROP,
//             // label: brewery.name,
//             // animation: google.maps.Animation.BOUNCE,
//             // icon: './wittcode-marker.png',
//         });

//         // markers can only be keyboard focusable when they have click listeners
//         // open info window when marker is clicked
//         marker.addListener("click", () => {
//             infoWindow.setContent(brewery.name);
//             infoWindow.open(map, marker);
//             map.setCenter(position)
//         });
//     });

// }

// module.exports = { updateMap, deleteMarkers };