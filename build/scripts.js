(function(){

    'use strict';

    var map,
        infoWindowTemplate = _.template( $('#infoWindowContent-template').html() );

    var infoWindowContent = function( place ) {

        return infoWindowTemplate({
            title: place.title(),
            display_phone: place.display_phone(),
            description: place.description(),
            image: place.img()
        });

    };

    var Listing = function( data ) {

        this.id = ko.observable( data.id );
        this.title = ko.observable( data.name );
        this.img = ko.observable( data.image_url );
        this.description = ko.observable( data.snippet_text );
        this.location = ko.observable( data.location );
        this.phone = ko.observable( data.phone );
        this.display_phone = ko.observable( data.display_phone );
        this.show = ko.observable( true );

        this.marker = new Marker( this );

        this.toggle = function( val ) {
            this.show( val );
            this.marker.toggle( val );
        };

    };

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

            if( !val ) {
                this.closeWindow();
            }

        };

    };

    var ViewModel = function() {

        var vm = this;

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
                    } else {

                    }
                }
            });

            window.addEventListener('resize', function(){
                vm.setSizes();
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

                listing.toggle( listing.title().toLowerCase().indexOf( vm.filter().toLowerCase() ) > -1 );

            });

        });

        this.init();

    };

    ko.applyBindings( new ViewModel() );

})();