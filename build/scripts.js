(function(){

    'use strict';

    var map,
        infoWindowTemplate = _.template( $('#infoWindowContent-template').html() );

    /**
     * @description Generates the html content for the map infoWindow
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
                position: new google.maps.LatLng(lat, lon),
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
            infoWindow.open(map, marker);
        };

        this.toggle = function(val){
            marker.setVisible( val );

            // we only want to close the window if toggling off
            if( !val ) {
                this.closeWindow();
            }
        };

    };

    var ViewModel = function() {

        // store reference to self
        var vm = this;

        // set up variables
        this.listings = ko.observableArray([]);
        this.activeListing = ko.observable();
        this.filter = ko.observable('');

        this.init = function() {

            this.setSizes();

            $.ajax( '/yelp', {
                success: function( response ) {

                    if(_.has( response, 'region') ) {
                        vm.initMap( response.region );
                        vm.addListings( response.businesses );
                        vm.initMarkers();
                    }
                }
            });

            window.addEventListener('resize', function(){
                vm.setSizes();
            });

        };

        this.initMarkers = function() {

            _.each( vm.listings(), function( listing ){

                var marker = listing.marker;

                

            });

        };

        this.setSizes = function() {

            var offsetTop = $('.search-bar').height(),
                height = $(window).height() - offsetTop;

            $('#map, #list-group-wrapper').css('height', height );

            $("#list-group-wrapper").niceScroll();

        };

        this.addListings = function( listings ) {

            _.each( listings, function(item){
                vm.listings.push( new Listing( item ) );
            });

        };

        this.focusOnMarker = function( listing ){

            if( vm.activeListing() ) {
                vm.activeListing().marker.closeWindow();
            }

            listing.marker.openWindow();

            vm.activeListing( listing );

        };

        this.initMap = function( region ) {

            var mapOptions = {
                disableDefaultUI: true,
                center: {lat: region.center.latitude, lng: region.center.longitude},
                zoom: 15,
                styles: [{
                    stylers: []
                }, {
                    elementType: 'labels',
                    stylers: [{ visibility: 'on' }]
                }]
            };

            map = new google.maps.Map(document.querySelector('#map'), mapOptions);

        };

        this.filter.subscribe(function() {

            _.each( vm.listings(), function(listing){

                var show = false,
                    filter = vm.filter().toLowerCase();

                if( listing.title().toLowerCase().indexOf( filter ) > -1 ) {
                    show = true;
                } else if ( listing.description().toLowerCase().indexOf( filter ) > -1 ) {
                    show = true;
                } else if ( listing.phone().toLowerCase().indexOf( filter ) > -1 ) {
                    show = true;
                }

                listing.toggle( show );

            });

        });

        this.init();

    };

    ko.applyBindings( new ViewModel() );

})();