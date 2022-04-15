# wheres-the-beer
https://excalidraw.com/#json=akWE38ntx3o_9VOsTRdkZ,jZ9sXmGoRe2sMhT1JUkDHA

BREWERY API SITE: https://www.openbrewerydb.org/
github: https://github.com/framenolan/wheres-the-beer
deployment: https://framenolan.github.io/wheres-the-beer/

~ ~ ~ MVP ~ ~ ~

    - get the wireframe on the page
        - with input and  clearly labeled html elements to display results 
            - responsive, cross browser functionality
            - choose CSS framework (materialize)
        - wireframe for mobile  (NOLAN)
        - wireframe for tablet  ()
            - document of functionality
                - when you click this then this 
                    on initial page load this is what happens
                        - USER JOURNEY


    -   Beer API (console.log results)
        -   search input html and javascript
        - end points to hit
            - by postal code - CHUAN
                https://api.openbrewerydb.org/breweries?by_postal=44107 
            - by city - CHUAN
                https://api.openbrewerydb.org/breweries?by_city=san_diego
                https://api.openbrewerydb.org/breweries?by_city=san%20diego
                    - tip: .trim() on input and convert spaces to (_ or %20)
            - by brewery name NOLAN
                https://api.openbrewerydb.org/breweries?by_name=modern%20times
                    -tip: change spaces to (%20)

    - google maps api - (BRIAN)
        - add markers (https://developers.google.com/maps/documentation/javascript/markers)
        -  instructions to destination

~ ~ ~ END MVP ~ ~ ~