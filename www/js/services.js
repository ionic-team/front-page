angular.module('starter.services', [])

/**
 * A service that calls out to Drifty's Hacker News API
 */

.factory('HNAPI', function($rootScope, $http, $q) {
  var apiURL = 'http://127.0.0.1:8080/';
  // load saved data if available
  var posts = typeof localStorage.posts === 'undefined'? {}:localStorage.posts;

  function update(){
    function validateResponse(result){
      console.log(result);
      if(typeof result.data != 'array' || typeof result.data != 'object' )return false;

      return true;
    }
  }

  return {
    // get all recent posts
    frontpage: function(page) {
      var q = $q.defer();
      $http.get(apiURL+'frontpage/'+page)
        .then(function(result){
          if(!validateResponse(result))return q.reject(new Error('Invalid Response'));
          q.resolve(result.data);
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
             if(!validateResponse(result))return q.reject(new Error('Invalid Response'));
             q.resolve(result.data);
           },function(err){
             console.log('Search Failed');
             q.reject(err);
          });
      return q.promise;
    }
  }
})
;

