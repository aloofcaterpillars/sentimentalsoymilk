// these services can be loaded into any controller by including 'app.services' in the
// angular dependencies
angular.module('app.services',[])

//factory for ratings, methods for posting and getting playlist rating
.factory('Ratings', function($http) {
  var postRatings = function(rating, playlistid) {
    return $http({
        method: 'POST',
        //NEED THE ROUTE FOR ADDING RATINGS, may need playlist id
        //playlist id stored as scope id on tripcontroller
        url: '/api/ratings/' + playlistid,
        //sending the rating to the database
        data: rating
      }).success(function(data) {
        console.log('made request');
      });
  };

  //method for getting all the ratings for a particular playlist
  //this will be the value of a rating scope variable for controller
  //and will replace the foursquare rating
  //INTERACTS WITH LANDING CONTROLLER/VIEW
  var getPlaylistRating = function(playlistid) {
    return $http({
        method: 'GET',
        //need to figure out this url, the query will be for all
        //ratings with a particular playlist id. 
        url: '/api/ratings/' + playlistid,
        //sending the rating to the database
      }).success(function(data) {
        //I'm envisioning that data is all the ratings for the PL
        //can manipulate it somehow (average). 
        return data;
      });
  };

  return {
    postRatings: postRatings,
    getPlaylistRating: getPlaylistRating
  }
})

// Include ActivitiesData in controller paramters to access these factory
// functions
.factory('ActivitiesData', function($http, $location){
  // data stores all of the service functions
  var data = {};
  data.searchedCity = {};
  data.cityCache = {};

  // <h4>data.getActivities</h4>
  // Function that sends a get request to /activities/`cityname`
  // and retrieves 30 foursquare top rated activities for the city
  // returns a promise
  data.getActivities = function(city){
    //checks if the city has been searched before
    if(data.searchedCity[city]){
      //sends a callback with the cache data
      return data.cityCache[city]
    }
    //call get request to our server, with the city
    return $http.get('/activities/' + city)
    .then(function(results){
      //our server calls a get request to the foursquare api
      //posts it to our database
      //gets data back out of our database and returns it
      console.log('getActivities success data: ', results)
      data.searchedCity[city] = true;
      data.cityCache[city] = results;
      return results;
    })
    .catch(function(err){
      console.log("Error Getting Activity Data: ", err)
    })
  };

  // <h4>data.getTrips</h4>
  // Function that sends a get request to /trips and retrieves
  // all trips from the db
  data.getTrips = function(){
    return $http.get('/trips')
    .then(function(results){
      return results;
    })
    .catch(function(err){
      console.log("Error Getting User Trip Data: ", err)
    })
  };

  // <h4>data.getUsersTrips</h4>
  // Function that retrieves all of one users stored trips
  // sends get request to /trips/`userId`
  data.getUsersTrips = function(userId, callback){
    $http.get('/trips/' + userId)
    .then(function(results){
      //our server calls a get request to the foursquare api
      //posts it to our database
      //gets data back out of our database and returns it
      console.log('Trip Results for ' +userId +': ' + results)
      return results;
    })
    .catch(function(err){
      console.log("Error Getting User Trip Data: ", err)
    })
  };

  // <h4>data.getIndividualTrip</h4>
  // pulls an trip from the db with the tripId
  // sends get request to /trips/`tripId`
  data.getIndividualTrip = function(tripId){
    $http.get('/trips/' + tripId)
    .then(function(results){
      // server calls a get request to the foursquare api
      // posts it to our database
      // gets data back out of our database and returns it
      console.log('Trip Result for ' + tripId +': ' + results)
      callback(results);
    })
    .catch(function(err){
      console.log("Error Getting Individual Trip Data: ", err)
    })
  };

  // <h4>data.createTrip</h4>
  // creates a trip and stores it to the db
  data.createTrip = function(tripData){
    //tripData is a JSON object
    console.log('Trip inside of create', tripData);
    $http.post('/trips', tripData)
    .then(function(){
      console.log("Trip Created");
      $location.path('/myTrips');
    })
    .catch(function(err){
      console.log("Error Creating Trip: ", err);
    })
  };

  // <h4>data.getTripActivities</h4>
  // retrieves an object containing all activities and data related
  // to the trip id
  data.getTripActivities = function(id, cb){
   return $http.get('/trips/' + id)
   .then(function(results){
    console.log('trip data: ', results)
     //our server calls a get request to the foursquare api
     //posts it to our database
     //gets data back out of our database and returns it
     cb(results);
   })
   .catch(function(err){
     console.log("Error Getting User Trip Data: ", err)
   })
 };
// this method gets a list of playlist given search parameters of location and duration
 data.getSearchedTrips = function (obj) {
  return $http({
    method: 'GET',
    url: '/api/trips', // need to coordinate with anthony about this endpoint
    params: {location: obj.location,
              duration: obj.duration}
  }).success(function(data){
    return data;
  });

 };


// this function adds playlists to a users wishlist  passing the playlistObj to the api
 data.postToWishList = function (playlist) {
   return $http({
    method: 'POST',
    url: '/api/wishlist', // need to coordinate with anthony about this endpoint
    data: playlist // this is an object containg the playlist information
  }).success(function(data){
    return data;
  }); 

 }

  return data;
})



// this factory is for authentication which is not impemented in the app yet.
.factory('Auth', function($http, $location){
  var auth = {};
  auth.user = { password : '' };
  auth.pass = '';

  auth.clearPassword = function() {
    auth.user.password = '';
    auth.pass = '';
  };

  auth.login = function(user) {
    return $http.post('/api/login', user)
      .then(function(result){
        console.log("Auth Login Hit")
        if(result.data){
          console.log("login results", result)
          console.log("Username", user.username)
          auth.getUser(user.username)
          .then(function() {
            auth.clearPassword();
            $location.path("/myTrips");
          });
        } else {
          //stay on login
          var loginError = "Please Try Again"
          return loginError;
        }
      })
  };

  auth.signup = function(userData) {
    auth.pass = userData.password;
    return $http.post('/api/signup', userData)
    .then(function(result){
      if(Array.isArray(result.data)){
        var signUpError = "Username Taken";
        return signUpError;
      } else {
        auth.user = result.data;
        auth.user.password = auth.pass;
        auth.login(auth.user);
      }
      //redirect
    })
  };

  auth.getUser = function(username) {
    return $http.get('/api/user/'+ username)
    .then(function(result){
      console.log("Result of getUser", result.data)
      auth.user = result.data;
    })
  };

  return auth;
});