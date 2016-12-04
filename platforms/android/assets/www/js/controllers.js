angular.module('starter.controllers', [])

/*
 * Map Controller
 *
 */
.controller('MapCtrl', function($scope, $state, location /*, $cordovaGeolocation */) {
  var options = {timeout: 10000, enableHighAccuracy: true};
  var latLng = new google.maps.LatLng(42.4075, -71.1190);
  var mapOptions = {
    center: latLng,
    zoom: 17,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };

  $scope.map = new google.maps.Map(document.getElementById("map"), mapOptions);
  $scope.makeMarker = function() {
    //alertPopup.close();
    var loc = location.getProperty();
    var newLatLng; 
    // call getter from factory
    newLatLng = new google.maps.LatLng(loc.lat, loc.lng);
    var marker = new google.maps.Marker({
      map: $scope.map,
      animation: google.maps.Animation.DROP,
      position: newLatLng
    });      
    var infoWindow = new google.maps.InfoWindow({
      content: "yo"
    });
    google.maps.event.addListener(marker, 'click', function () {
      infoWindow.open($scope.map, marker);
    });
  }
  $scope.makeMarker();
})


/*
 * Events Controller
 *
 */
.controller('EventsCtrl',
    ['$scope', '$ionicPopup', '$ionicScrollDelegate', '$timeout', '$ionicPosition', 'Events', 'Favorites', 'location', 
    function($scope, $ionicPopup, $ionicScrollDelegate,  $timeout, $ionicPosition, Events, Favorites, location) {

      // Makes http request if data is not already downloaded
      Events.get(function(data) {
        $scope.events = data;
      });

      // http://stackoverflow.com/questions/32301054/ionic-scroll-to-element
      // lifesaver ^
      $scope.jumptoEvent = function (event) {
        var eventPosition = $ionicPosition.position(angular.element(document.getElementById('item_' + event.id)));
        $ionicScrollDelegate.$getByHandle('scrollview').scrollTo(eventPosition.left, eventPosition.top, true);
      }
      // Make dynamic accordian list
      $scope.toggleGroup = function(group) {
        if (group.type != 'composite') {
          return; 
        } else if ($scope.isGroupShown(group)) {
          $scope.shownGroup = null;
        } else {
          setTimeout(function () {
            $scope.jumptoEvent(group);
          }, 0090);
          $scope.shownGroup = group;
        }
      };
      $scope.isGroupShown = function(group) {
        if ($scope.shownGroup === group && $scope.shownGroup.subevents) {
          return true;
        }
      };

      $scope.refreshFavorites = function() {
        $scope.favs = Array.from(Favorites.get());
      };

      // On star click - change in data and html
      $scope.toggleFavorite = function(event, event_id) {
        html_id = "fav_icon_" + event_id;
        if (Favorites.has(event)) {
          document.getElementById(html_id).className = "icon ion-android-star-outline icon-accessory star";
          Favorites.remove(event);
        } else {
          document.getElementById(html_id).className = "icon ion-android-star icon-accessory star";
          Favorites.add(event);
        }
      }

      // Display event info pop-up
      $scope.showAlert = function(event) {
        // $timeout(function(){
        //   console.log("handle_" + event.id.toString());
        //   $ionicScrollDelegate.$getByHandle("handle_" + event.id.toString()).scrollTop(); 
        // },10)
        if (event.type == 'composite') 
          return;
        var alertPopup = $ionicPopup.alert({
          title: event.title,
          // factory set lat/lng
          content: "<a href=\"#/tab/map\" ng-click='location.setProperty("+ event.lat + "," + event.lng + ")'>" + event.location + "</a><br><br>" + event.description ,
          buttons: [{text: 'CLOSE',
            type: 'button-positive'}]
        });
      }
    }])

// Leftover from demo app - might revert to full screen event details page, so keeping it for now
.controller('EventDetailCtrl', function($scope, $stateParams, Events) {
  $scope.event = Events.getEvent($stateParams.eventId);
})

// Third page controler - name leftover form demo app, currently favorites list
.controller('FavoritesCtrl', function($scope, Favorites) {
  $scope.$on('$ionicView.enter', function() {
    $scope.favs = Array.from(Favorites.get());
  });
});
