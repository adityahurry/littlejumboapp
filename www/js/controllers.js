angular.module('starter.controllers', ['ngCordova'])

/*
 * Event Detail Controller
 */

.controller('EventDetailCtrl', ["$scope", "$state", "$stateParams", "$ionicHistory", "Favorites", "location", function($scope, $state, $stateParams, $ionicHistory, Favorites, location) {
        $scope.event = $stateParams.cEvent;
        //var latLng = new google.maps.LatLng(event.lat, event.lng);  
        var map = document.getElementById("minimap");
        console.log('mapping');     
        map.src = "https://maps.googleapis.com/maps/api/staticmap?center=" + $scope.event.lat + "," + $scope.event.lng + "&zoom=16&size=" + map.width + "x" + map.height + "&style=element:labels|visibility:on&style=element:geometry.stroke&markers=color:blue|" + $scope.event.lat + "," + $scope.event.lng + "&key=AIzaSyCp0GNF8euqXxdbPgziuz_Up74ydS8cdS0";
        $scope.goBack = function() {
            //$ionicHistory.goBack();
            //$state.go("tab.events");
            $scope.favs = Array.from(Favorites.get($scope.event.visiting_day));
            $state.transitionTo('tab.events', null, { reload: true, notify: true });
        }

        // On star click - change in data and html
        $scope.toggleFavorite = function(event, event_id) {
            html_id = "fav_icon_detail";
            if (Favorites.has(event)) {
                // Could replace with jQuery
                document.getElementById(html_id).className = "icon ion-android-star-outline icon-accessory star";
                Favorites.remove(event);
            } else {
                document.getElementById(html_id).className = "icon ion-android-star icon-accessory star";
                Favorites.add(event);
            }
        };

        // $scope.isFavorited = function(event) {
        $scope.$on('$ionicView.beforeEnter', function() {
            var returned = Favorites.has($scope.event);
            console.log(returned);
            html_id = "fav_icon_detail";
            if (!returned) {
                document.getElementById(html_id).className = "icon ion-android-star-outline icon-accessory star";
            } else {
                document.getElementById(html_id).className = "icon ion-android-star icon-accessory star";
            }
        });
        // return returned;
        // }
        // On click pop-up window location link
        $scope.goToMap = function() {
            console.log("Going");
            location.setProperty($scope.event.lat, $scope.event.lng, $scope.event.location, true, $scope.event.address);
            $state.go("tab.map");
        }

        $scope.$on('$viewContentLoaded', function() {
            $scope.favs = Array.from(Favorites.get());
        });

    }])
    /*
     * Map Controller
     */
    .controller('MapCtrl', function($scope, $state, location, $cordovaGeolocation) {

        var options = { timeout: 10000, enableHighAccuracy: true };
        var latLng = new google.maps.LatLng(42.4075, -71.1190);
        var posOptions = {
            enableHighAccuracy: false,
            timeout: 100000,
            maximumAge: 0
        };
        var mapOptions = {
            center: latLng,
            zoom: 16,
            streetViewControl: false,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        if ($scope.map == undefined) {
            var map = new google.maps.Map(document.getElementById("map"), mapOptions);
            $scope.map = map;
        }

        var infoWindow = new google.maps.InfoWindow();

        $scope.makeUserMarker = function(userLatLng) {
            userMarker = new google.maps.Marker({
                map: $scope.map,
                animation: google.maps.Animation.DROP,
                position: userLatLng,
                icon: './img/bluecircle.png'
            });

            google.maps.event.addListener(userMarker, 'click', function() {
                infoWindow.setContent('<div class="bubble_content">You are here!</div>');
                infoWindow.open($scope.map, userMarker);
            });

            google.maps.event.addListener(map, 'click', function() {
                infoWindow.close();
            });

        };

        $cordovaGeolocation.getCurrentPosition(posOptions).then(function(position) {
            var userlat = position.coords.latitude;
            var userlong = position.coords.longitude;

            var userLatLng = new google.maps.LatLng(userlat, userlong);

            $scope.makeUserMarker(userLatLng);

        }, function(err) {
            console.log(JSON.stringify(err));
        });



        var loc = location.getProperty();
        var marker;

        $scope.makeMarker = function() {
            infoWindow.close();
            console.log("in makeMarker");
            if (marker != null)
                marker.setMap(null);
            var newLatLng;
            newLatLng = new google.maps.LatLng(loc.lat, loc.lng);
            marker = new google.maps.Marker({
                map: $scope.map,
                animation: google.maps.Animation.DROP,
                position: newLatLng
            });

            google.maps.event.addListener(marker, 'click', function() {
                infoWindow.setContent("<div class='bubble_content'><strong><a href='comgooglemaps://?center=" + loc.lat + "," + loc.lng + "&zoom=16'>" + loc.address + "</a></strong></br></div>");
                infoWindow.open($scope.map, marker);
            });

            loc.wasCalled = false;

            $scope.map.setCenter(newLatLng);
        }

        $scope.$on('$ionicView.enter', function() {
            if (loc.wasCalled == true) {
                $scope.makeMarker();
            }
            // $scope.makeUserMarker();
        });
    })


/*
 * Events Controller
 */
.controller('EventsCtrl', ['$scope', '$rootScope', '$state', '$ionicPopup', '$ionicScrollDelegate', '$timeout', '$ionicPosition', '$window', 'Events', 'Favorites', 'location',
    function($scope, $rootScope, $state, $ionicPopup, $ionicScrollDelegate, $timeout, $ionicPosition, $window, Events, Favorites, location) {

        $scope.isFavorited = function(event) {
            var returned = Favorites.has(event);
            console.log(returned);
            return returned;
        }

        // Find the date to fetch if no date has been selected yet
        if ($scope.dates == undefined) {
            Events.getDates(function(dates) {

                $scope.dates = dates;
                $scope.date = undefined;
                $scope.date = $scope.dates[0];

                // Broadcast gotEvents to rootScope when event list populated
                Events.get($scope.date, function(data) {
                    $scope.events = data;
                    $rootScope.$broadcast('gotEvents');
                });
            });
        }


        // Receive dateChanged event, repopulate event list
        // Broadcast gotEvents to rootScope when event list populated
        $scope.$on('dateChanged', function(event, date) {
            Events.deactivateAllDates(date);
            Events.get(date, function(data) {
                $scope.events = data;
                $rootScope.$broadcast('gotEvents');
            });
        });

        // On expandable item click - scroll list item to top
        $scope.jumptoEvent = function(event) {
            var element = document.getElementById("item_" + event.pk);
            var eventPosition = $ionicPosition.position(angular.element(element));
            $ionicScrollDelegate.$getByHandle('scrollview').scrollTo(eventPosition.left, eventPosition.top, true);
        };

        // Make dynamic accordion list
        $scope.toggleGroup = function(group) {
            console.log("in toggleGroup");
            if (group.type != 'composite') {
                return;
            } else if ($scope.isGroupShown(group)) {
                $scope.shownGroup = null;
            } else {
                // Delay to allow expanding animation to finish
                // Ideally they would happen at the same time but it gets buggy and the scroll doesnt work
                setTimeout(function() {
                    $scope.jumptoEvent(group);
                }, 0170);
                $scope.shownGroup = group;
            }
        };

        $scope.isGroupShown = function(group) {
            if ($scope.shownGroup === group && $scope.shownGroup.sub_events) {
                return true;
            }
        };

        // On favorites tab bar clicked
        $scope.refreshFavorites = function() {
            var currentVisitingDay = $scope.date.standalone_events[0].visiting_day;
            console.log("refreshFavorites cvd:" + currentVisitingDay);
            $scope.favs = Favorites.get(currentVisitingDay);
        };

        $scope.$on('$ionicView.beforeEnter', function() {
            $scope.refreshFavorites();
        });

        // On star click - change in data and html
        $scope.toggleFavorite = function(event, event_id) {
            html_id = "fav_icon_" + event.name + "_" + event_id;
            if (Favorites.has(event)) {
                // Could replace with jQuery
                document.getElementById(html_id).className = "icon ion-android-star-outline icon-accessory star";
                Favorites.remove(event);
                console.log("---------------");
            } else {
                document.getElementById(html_id).className = "icon ion-android-star icon-accessory star";
                Favorites.add(event);
                console.log("---------------");
            }
        };

        // Name should be changed
        $scope.showAlert = function(event) {
            console.log(event);
            if (event.type == 'composite')
                return;
            // $state.transitionTo('tab.event-detail, null, {reload: true, notify:true}');
            $state.go("tab.event-detail", { cEvent: event });
            // $window.location.reload();
        }

        // On click pop-up window location link
        $scope.goToMap = function(lat, lng, building, address) {
            location.setProperty(lat, lng, building, true, address);
            $state.go("tab.map");
        }

    }
])

/*
 * Navigation Controller - manages navigation bar date chooser
 */
.controller('NavCtrl', function($scope, $rootScope, $ionicPopover, $ionicModal, Events) {

    Events.getDates(function(data) {
        $scope.dates = data;
    });

    // Select new date
    // Broadcast dateChanged event to rootScope
    $scope.changeDate = function(date) {
        $scope.modal.hide();
        $rootScope.$broadcast('dateChanged', date);
    };

    $scope.$on('gotEvents', function(event) {
        $scope.currentDate = Events.getCurrDate();
    });

    if (ionic.Platform.isAndroid()) {
        // Will disable Android animations (intentional) - slide-in-right is not implemented for modals
        // slide-top animation stutters on android right now
        // Might have to write custom css animation instead of using AngularUI
        $scope.animation = 'slide-in-right';
    } else {
        $scope.animation = 'am-slide-top';
    }

    // Generate modal date chooser
    $ionicModal.fromTemplateUrl('templates/choose-date.html', {
        scope: $scope,
        animation: $scope.animation
    }).then(function(modal) {
        $scope.modal = modal;
    });
})


/*
 * Documents Controller
 */
.controller('DocumentsCtrl', ['$scope', '$state', '$ionicScrollDelegate', 'Documents',
    function($scope, $state, $ionicScrollDelegate, Documents) {
        $scope.$on('$ionicView.enter', function() {
            Documents.get(function(docs) {
                $scope.docs = docs;
            });
        });
    }
]);
