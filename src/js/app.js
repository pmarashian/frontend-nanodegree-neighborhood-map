'use strict';

var map,
    activeMarker,
    infoWindowTemplate = _.template( $('#infoWindowContent-template').html() );

// Config constants used in the app.
var SMALL_SCREEN_MAX_WIDTH = 420,
    WIDTH_FACTOR_INFO_WINDOW_MOBILE_PORTRAIT = 0.70,
    WIDTH_FACTOR_INFO_WINDOW_OTHER = 1;

// Config for custom icons
var iconCategories = [
    {
        names: ['Restaurant','Pizza'],
        prop: {
            icon: fontawesome.markers.CUTLERY,
            fillColor: '#f8ae5f'
        }

    },
    {
        names: ['Coffee'],
        prop: {
            icon: fontawesome.markers.COFFEE,
            fillColor: '#f8ae5f'
        }
    }
];

/**
 * @description Helper function to generate the html content for the map infoWindow
 * @param {object} listing - A single listing object.
 */
var infoWindowContent = function( listing ) {

    return infoWindowTemplate({
        title: listing.title(),
        display_phone: listing.display_phone(),
        description: listing.description(),
        image: listing.img(),
        address: listing.location().display_address.join('<br>')
    });

};

/**
 * @description Model object for a single listing.
 * @constructor
 * @param {object} data - Data object returned from yelp request.
 */
var Listing = function( data ) {

    this.id = ko.observable( data.id );
    this.title = ko.observable( data.title );
    this.img = ko.observable( data.img );
    this.description = ko.observable( data.description );
    this.location = ko.observable( data.location );
    this.phone = ko.observable( data.phone );
    this.display_phone = ko.observable( data.display_phone );
    this.categories = ko.observableArray( data.categories );

    /* used in list view to filter results */
    this.show = ko.observable( true );

    this.marker = new Marker( this );

    this.toggle = function( val ) {
        this.show( val );
        this.marker.toggle( val );
    };

};

/**
 * @description Object for a single map marker. Handles interactions with the view.
 * @constructor
 * @param {object} listing - Listing object created from yelp results
 */
var Marker = function( listing ) {

    var self = this,

        lat = listing.location().latitude,
        lon = listing.location().longitude,
        title = listing.title(),
        listing = listing,
        maxWidthFactor = window.screen.width < SMALL_SCREEN_MAX_WIDTH ? WIDTH_FACTOR_INFO_WINDOW_MOBILE_PORTRAIT : WIDTH_FACTOR_INFO_WINDOW_OTHER,

        marker, infoWindow;

    /**
     * @description Handles closing an info window and reseting the marker status
     */
    this.closeWindow = function() {
        infoWindow.close();
        marker.setAnimation( null );
        activeMarker = null;
    };

    /**
     * @description Handles opening an info window, setting marker status, and resetting status of
     * a window that is already open
     */
    this.openWindow = function() {

        if( activeMarker ) {
            activeMarker.closeWindow();
        }

        map.panTo( new google.maps.LatLng(lat, lon) );
        marker.setAnimation( google.maps.Animation.BOUNCE );
        infoWindow.open( map, marker );

        if( listing.img() == '' ) {

            $('.image-col').removeClass('col-sm-2');
            $('.content-col').addClass('col-sm-12').removeClass('col-sm-10');

        }

        activeMarker = self;

    };

    /**
     * @description Toggles the visibility of a marker
     * @param {bool} val - Visibility flag
     */
    this.toggle = function(val){

        marker.setVisible( val );

        // we only want to close the window if toggling off
        if( !val ) {
            this.closeWindow();
        }
    };

    /**
     * @description Handles what icon to show for a listing marker.
     */
    this.getIcon = function() {

        var  props = {
                path: fontawesome.markers.MAP_MARKER,
                scale: 0.5,
                strokeWeight: 0.2,
                strokeColor: 'black',
                strokeOpacity: 1,
                fillColor: '#ff0000',
                fillOpacity: 0.9
            };

        // search through each category and see if is one of the categories that
        // has a custom icon
        _.each( listing.categories(), function(cat){

            _.each( iconCategories, function(iconCat){

                _.each( iconCat.names, function(catName){

                    if( inSearchFilter( cat, catName ) ) {

                        props.path = iconCat.prop.icon;
                        props.fillColor = iconCat.prop.fillColor;

                    }

                });



            });

        });

        return props;



    };

    /**
     *  Create the marker, infoWindow, and setup the event listeners.
     */
    marker = new google.maps.Marker({
        map: map,
        position: new google.maps.LatLng( lat, lon ),
        title: title,
        animation: google.maps.Animation.DROP,
        icon: self.getIcon()
    });

    infoWindow = new google.maps.InfoWindow({
        content: infoWindowContent( listing ),
        maxWidth: Math.floor( (window.screen.width * maxWidthFactor) )
    });

    google.maps.event.addListener( infoWindow, 'closeclick', function(){
        marker.setAnimation( null );
        activeMarker = null;
    });

    google.maps.event.addListener(marker, 'click', function(){
        self.openWindow();
    });

};

/**
 * @description Main viewModel for the app.
 * @constructor
 */
var ViewModel = function() {

    // store reference to self
    var vm = this;

    // set up variables
    this.listings = ko.observableArray([]);
    this.activeListing = ko.observable();
    this.filter = ko.observable('');
    this.neighborhood = ko.observable('West San Jose');
    this.loading = ko.observable( false );

    /**
     * @description Dynamically set the search input placeholder based on the current neighborhood.
     */
    this.searchPlaceholder = ko.computed(function() {
        return "Search within " + this.neighborhood();
    }, this);

    // store reference to DOM elements
    var $window = $(window),
        $map = $('#map'),
        $searchBar = $('.search-bar'),
        $listView = $('.list-view'),
        $listWrapper = $('#list-group-wrapper'),
        $listButton = $('a.list-group-item.active')[0];

    // misc variables to keep track of items that need to initialized once.
    var niceScrollInit = false;

    /**
     * @description Initialization function.
     */
    this.init = function() {

        this.setSizes();

        vm.initMap();

        if( !this.loadSavedData() ) {

            vm.refresh()
                .then( function( response ){
                    vm.centerMap( response.region );
                });

        }

        this.initAutoComplete();

        window.addEventListener('resize', function(){
            vm.setSizes();
        });

        //https://davidwalsh.name/orientation-change
        window.addEventListener("orientationchange", function() {
            vm.setSizes();
        }, false);

    };

    /**
     * @description Initializes autocomplete on the search input
     * @param {array} records - Data source for the autocomplete box.
     */
    this.initAutoComplete = function() {

        var $input = $('#search');

        $input
            .typeahead({

                source: vm.listings(),

                matcher: function( item ) {
                    // "this" typeahead instance
                    // item is the listing record
                    return inSearchFilter( item.title(), this.query );
                },

                displayText: function( item ) {
                    return item.title();
                }

            })

            .change(function() {

                var current = $input.typeahead("getActive");

                if (current) {

                    if (current.title() == $input.val()) {
                        // current active for typeahead ( which is a listing) is same as input val
                        // therefore there is only one listing shown.
                        vm.centerMap( current.location().latitude, current.location().longitude );
                        current.marker.openWindow();

                    }

                }

            });

    };

    /**
     * @description Centers the map to a location
     * @param {object} region - Region object returned from yelp api.
     */
    this.centerMap = function( latitude, longitude ) {

        map.setCenter( {
            lat: latitude,
            lng: longitude
        });

        map.setZoom(15);

    };

    /**
     * @description Loads results from server. Clears view of results while loading new data.
     */
    this.refresh = function() {

        var d = Q.defer();

        vm.loading( true );

        _.each( vm.listings(), function(listing){
            listing.marker.toggle(false);
        });

        vm.listings([]);

        $.ajax( 'results', {
            success: function( response ) {

                if(_.has( response, 'region') ) {

                    vm.addListings( response.results );

                    vm.save( 'region', JSON.stringify( response.region ) );
                    vm.save( 'listings', JSON.stringify( response.results ));
                    vm.save( 'searchFilter', vm.filter() );

                    vm.updateFilterResults();

                    vm.loading( false );

                    d.resolve( response );

                }
            }
        });

        return d.promise;

    };

    /**
     * @description Loads saved data from localStorage. Returns false if saved data not present.
     */
    this.loadSavedData = function() {

        var dataLoaded = false;

        if( typeof(Storage) !== "undefined" ) {

            if( !_.isUndefined(localStorage.region) && !_.isUndefined(localStorage.listings) ) {

                var region = JSON.parse( localStorage.region ),
                    listings = JSON.parse( localStorage.listings),
                    filter = _.isString( localStorage.searchFilter ) ? localStorage.searchFilter : '';

                if( _.isObject( region ) && _.isObject( listings ) ) {

                    vm.initMap( region );
                    vm.addListings( listings );
                    vm.filter( filter );

                    vm.centerMap( region.center.latitude, region.center.longitude );

                    dataLoaded = true;

                }
            }

        }

        return dataLoaded;

    };

    /**
     * @description Save data to localStorage
     * @param {string} key - localStorage key to save
     * @param {string} value - Data to save
     */
    this.save = function( key, value ) {

        if(typeof(Storage) !== "undefined") {
            localStorage.setItem( key, value );
        }

    };

    /**
     * @description Sets the list view and map heights. Inits the scrolling plugin for the list view.
     */
    this.setSizes = function( arg ) {

        var windowHeight = $window.height(),
            smallScreen = vm.onSmallScreen(),
            offsetTop = $searchBar.height(),
            mapHeight = windowHeight - offsetTop,

            // if we are on a small screen (portrait) place the list view
            // so it takes up the bottom 35% of the view
            listHeight = smallScreen ? mapHeight * 0.35 : mapHeight,
            listViewTop, listItemHeight, actualListHeight;

            // We need to set top to either the bottom 35% of screen or 0

        if( !smallScreen ) {

            listViewTop = 0;

        } else {

            // the height of the list view needs to be adjusted based on the search query.

            // get height of the button.  This is always visible.
            listItemHeight = $listButton.offsetHeight;

            // Calculate actual height of the list based on visible listings.
            // We need to add the button to the calculation.  it doesn't count as a visible listing.
            actualListHeight = listItemHeight * ( 1 + vm.numVisibleListings() );

            // override it the actual height that it should be is less
            if( listHeight > actualListHeight ) {

                listHeight = actualListHeight;

            }

            listViewTop = windowHeight - listHeight;

        }

        $map.css('height', mapHeight );
        $listWrapper.css('height', listHeight );

        // using niceScroll on the initial app load doesn't work
        // leaves the listView with a height of 0. Haven't figured out why
        // on the init load arg is undefined.
        // on subsequent calls during the afterRender event arg is an object
        // and calling niceSroll works as expected.

        if( ! _.isUndefined(arg) && !niceScrollInit ) {

            $listWrapper.niceScroll();

            niceScrollInit = true;

        }

        $listView.css('top', listViewTop );


    };

    /**
     * @description Helper function to determine if on mobile portrait.
     */
    this.onSmallScreen = function() {
        return window.screen.width < SMALL_SCREEN_MAX_WIDTH;
    };

    /**
     * @description Populates the listings observable array
     * @param {array} listings - Array of items to display
     */
    this.addListings = function( listings ) {

        _.each( listings, function(item){
            vm.listings.push( new Listing( item ) );
        });

    };

    /**
     * @description Event handler for clicking on an item in the list view
     * @param {object} listing - Listing object.
     */
    this.focusOnMarker = function( listing ){

        listing.marker.openWindow();        // openWindow() handles closing an
                                            // infoWindow that is already open

    };

    /**
     * @description Initialize the google map.
     * @param {object} region - Region object returned from yelp request.
     */
    this.initMap = function( region ) {

        var mapOptions = {
            disableDefaultUI: true
        };

        map = new google.maps.Map(document.querySelector('#map'), mapOptions);

    };

    /**
     * @description Updates listings and markers visibility based on Search Term
     */
    this.updateFilterResults = function() {

        var searchTerm = vm.filter().toLowerCase();

        vm.save( 'searchFilter', vm.filter() );

        _.each( vm.listings(), function(listing){

            var show = false;

            if( inSearchFilter( listing.title(), searchTerm ) ) {

                show = true;

            } else if ( inSearchFilter( listing.description(), searchTerm ) ) {

                show = true;

            } else if ( inSearchFilter( listing.phone(), searchTerm ) ) {

                show = true;

            }

            listing.toggle( show );

        });

        vm.setSizes();

    };

    /**
     * @description Returns number of listings that are visible based on current search query
     */
    this.numVisibleListings = function() {

        var count = 0;

        _.each( vm.listings(), function(listing){

            if( listing.show() ) {
                count++;
            }

        });

        return count;

    };

    /**
     * @description Event handler for updating filter results.
     */
    this.filter.subscribe( this.updateFilterResults );

    this.init();

};

/**
 * @description Callback function for google maps script tag.
 */
function initApp() {

    ko.applyBindings( new ViewModel() );

}

/**
 * @description Helper function for filtering searches.
 * @param {string} haystack - Haystack to check against
 * @param {string} needle - Needle to search for
 */
function inSearchFilter( haystack, needle ) {

    if( _.isUndefined(haystack) || _.isUndefined(needle) ) {
        return false;
    }

    return haystack.toLowerCase().indexOf( needle.toLowerCase() ) > -1
}