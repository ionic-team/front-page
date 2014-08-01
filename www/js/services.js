angular.module('frontpage.services', [])

/**
 * A service that calls out to Drifty's Hacker News API
 */

.factory('HNAPI', function($rootScope, $http, $q) {
  // define the API in just one place so it's easy to update
  var apiURL = 'http://hn-api.ionic.io/';

  function validateResponse(result){
    return !(typeof result.data != 'array' && typeof result.data != 'object');
  }

  // Each return method is nearly identical, but it's good to keep them separate so they can be easily customized.
  // They start by initiating and returning a promise, allowing for the then() method controller's use.
  // They also start their respective AJAX request to the API server.
  // We validate the response to make sure it's valid data and then we resolve the promise, passing the data to
  // the controller's then() method
  return {
    // get all recent posts
    frontpage: function(page) {
      var q = $q.defer();
      $http.get(apiURL+'frontpage/'+page)
        .then(function(result){
          return !validateResponse(result)? q.reject(new Error('Invalid Response')):q.resolve(result.data);
        },function(err){
          console.log('Search Failed');
          q.reject(err);
        });
      return q.promise;
    },
    newest: function(page) {
      var q = $q.defer();
      $http.get(apiURL+'new/'+page)
        .then(function(result){
          return !validateResponse(result)? q.reject(new Error('Invalid Response')):q.resolve(result.data);
        },function(err){
          console.log('Search Failed');
          q.reject(err);
        });
      return q.promise;
    },
    comments: function(postID) {
      var q = $q.defer();
      $http.get(apiURL+'comments/'+postID)
        .then(function(result){
          return !validateResponse(result)? q.reject(new Error('Invalid Response')):q.resolve(result.data);
        },function(err){
          console.log('Search Failed');
          q.reject(err);
        });
      return q.promise;
    },
    search: function(searchTerm) {
      // call
      var q = $q.defer();
      $http.get(apiURL+'search?&q='+searchTerm)
           .then(function(result){
            return !validateResponse(result)? q.reject(new Error('Invalid Response')):q.resolve(result.data);
           },function(err){
             console.log('Search Failed');
             q.reject(err);
          });
      return q.promise;
    }
  }
})

/**
 * A service that caches some API responses
 */

.factory('RequestCache', function() {
  // what pages should we cache?
  var requestsToCache = ['frontpage/0','new/0'];
  // create the cache if it doesn't exist yet
  var cache = typeof localStorage.cache == 'undefined'?{}:JSON.parse(localStorage.cache);
  return{
    // enter a request's reponse in to the cache
    entry: function(request){
      for(var i = 0;i<requestsToCache.length;i++){
        if(request.config.url.indexOf(requestsToCache[i]) != -1){
          cache[requestsToCache[i]] = request.data;
          localStorage.cache = JSON.stringify(cache);
        }
      }
    },
    // request a cache item's data based on the reuqested URL
    get:function(url){
      return typeof cache[url] === 'undefined' ? false:cache[url];
    }
  }
})
;

