angular.module('frontpage.services', [])

/**
 * A service that calls out to Drifty's Hacker News API
 */

.factory('HNAPI', function($rootScope, $http, $q) {
  var apiURL = 'http://127.0.0.1:8080/';
  // load saved data if available

  function validateResponse(result){
    return !(typeof result.data != 'array' && typeof result.data != 'object');

  }

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
  var requestsToCache = ['frontpage/0','new/0'];
  var cache = typeof localStorage.cache == 'undefined'?{}:JSON.parse(localStorage.cache);
  return{
    entry: function(request){
      for(var i = 0;i<requestsToCache.length;i++){
        if(request.config.url.indexOf(requestsToCache[i]) != -1){
          cache[requestsToCache[i]] = request.data;
          localStorage.cache = JSON.stringify(cache);
        }
      }

    },
    get:function(url){
      return typeof cache[url] === 'undefined' ? false:cache[url];
    }
  }
})
;

