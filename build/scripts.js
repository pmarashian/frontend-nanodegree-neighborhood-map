(function($q){

    'use strict';

    var map,
        infoWindowTemplate = _.template( $('#infoWindowContent-template').html() );

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
     * @param {object} data - Data object returned from yelp request.
     */
    var Listing = function( data ) {

        this.id = ko.observable( data.id );
        this.title = ko.observable( data.name );
        this.img = ko.observable( data.image_url );
        this.description = ko.observable( data.snippet_text );
        this.location = ko.observable( data.location );
        this.phone = ko.observable( data.phone );
        this.display_phone = ko.observable( data.display_phone.replace('+1-','') );

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
     * @param {object} listing - Listing object created from yelp results
     */
    var Marker = function( listing ) {

        var self = this,

            lat = listing.location().coordinate.latitude,
            lon = listing.location().coordinate.longitude,
            title = listing.title(),

            marker = new google.maps.Marker({
                map: map,
                position: new google.maps.LatLng( lat, lon ),
                title: title,
                animation: google.maps.Animation.DROP
            }),

            infoWindow = new google.maps.InfoWindow({
                content: infoWindowContent( listing )
            });

        google.maps.event.addListener( infoWindow, 'closeclick', function(){
            marker.setAnimation( null );
        });

        google.maps.event.addListener(marker, 'click', function(){
            self.openWindow();
        });

        this.closeWindow = function() {
            infoWindow.close();
            marker.setAnimation( null );
        };

        this.openWindow = function() {
            map.panTo( new google.maps.LatLng(lat, lon) );
            marker.setAnimation( google.maps.Animation.BOUNCE );
            infoWindow.open( map, marker );
        };

        this.toggle = function(val){

            marker.setVisible( val );

            // we only want to close the window if toggling off
            if( !val ) {
                this.closeWindow();
            }
        };

    };

    /**
     * @description Main viewModel for the app.
     */
    var ViewModel = function() {

        // store reference to self
        var vm = this;

        // set up variables
        this.listings = ko.observableArray([]);
        this.activeListing = ko.observable( null );
        this.filter = ko.observable('');
        this.neighborhood = ko.observable('West San Jose');
        this.loading = ko.observable( false );

        /**
         * @description Dynamically set the search input placeholder based on the current neighborhood.
         */
        this.searchPlaceholder = ko.computed(function() {
            return "Search within " + this.neighborhood();
        }, this);

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

            window.addEventListener('resize', function(){
                vm.setSizes();
            });

        };

        /**
         * @description Centers the map to a location
         * @param {object} region - Region object returned from yelp api.
         */
        this.centerMap = function( region ) {

            map.setCenter( {
                lat: region.center.latitude,
                lng: region.center.longitude} );

            map.setZoom(15);

        };

        /**
         * @description Loads results from server. Clears view of results while loading new data.
         */
        this.refresh = function() {

            var d = $q.defer();

            vm.loading( true );

            _.each( vm.listings(), function(listing){
                listing.marker.toggle(false);
            });

            vm.listings([]);

            $.ajax( '/yelp', {
                success: function( response ) {

                    if(_.has( response, 'region') ) {

                        vm.addListings( response.businesses );

                        vm.save( 'region', JSON.stringify( response.region ) );
                        vm.save( 'listings', JSON.stringify( response.businesses ));
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
                        filter = localStorage.searchFilter;

                    if( _.isObject( region ) && _.isObject( listings ) ) {

                        vm.initMap( region );
                        vm.addListings( listings );
                        vm.filter( filter );

                        vm.centerMap( region );

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
        this.setSizes = function() {

            var offsetTop = $('.search-bar').height(),
                height = $(window).height() - offsetTop;

            $('#map, #list-group-wrapper').css('height', height );

            $("#list-group-wrapper").niceScroll();

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

            // close the info window if one was already open.
            if( vm.activeListing() ) {
                vm.activeListing().marker.closeWindow();
            }

            listing.marker.openWindow();

            vm.activeListing( listing );

        };

        /**
         * @description Initialize the google map.
         * @param {object} region - Region object returned from yelp request.
         */
        this.initMap = function( region ) {

            var mapOptions = {
                disableDefaultUI: true
                //center: {lat: region.center.latitude, lng: region.center.longitude},
                //zoom: 15
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

                if( inSearchFilter( listing.title() ) ) {

                    show = true;

                } else if ( inSearchFilter( listing.description() ) ) {

                    show = true;

                } else if ( inSearchFilter( listing.phone() ) ) {

                    show = true;

                }

                listing.toggle( show );

            });

            /**
             * @description Helper function for filtering searches.
             * @param {string} search - Search term to check against
             */
            function inSearchFilter( search ) {
                return search.toLowerCase().indexOf( searchTerm ) > -1
            }

        };

        /**
         * @description Event handler for updating filter results.
         */
        this.filter.subscribe( this.updateFilterResults );

        this.init();

    };

    ko.applyBindings( new ViewModel() );

})(Q);