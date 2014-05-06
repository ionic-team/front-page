angular.module('starter.services', [])

/**
 * A service that calls out to Algolia's Hacker News Search API
 */

.factory('Algolia', function($rootScope, $http, $q) {
  var apiURL = 'https://hn.algolia.com/api/v1/';
  // load saved data if available
  var posts = typeof localStorage.posts === 'undefined'? []:localStorage.posts;

  function update(){
    $http.get(apiURL+'search_by_date?tags=(story,poll)')
         .then(function(result){
           posts = result.data.hits;
           $rootScope.$broadcast('newPostsAvailable',posts);
           localStorage.posts = posts;
         });
  }

  return {
    // get all recent posts
    all: function() {
      // get updated data from the server, but deliver what we have now too
      update();
      return posts;
    },
    search: function(searchTerm) {
      var q = $q.defer();
      $http.get(apiURL+'search?tags=story&query='+searchTerm)
           .then(function(result){
             console.log(result.data.hits);
             posts = result.data.hits;
             q.resolve(result.data.hits);
           },function(err){
             console.log('Search Failed');
             q.reject(err);
          });
      return q.promise;
    }
  }
})

/**
 * A service that scrapes the Hacker News website for post data
 */

.factory('HackerNewsScraper', function($rootScope, $http, $q) {
  var hnURL = 'https://news.ycombinator.com/';

  function parseNewHTML(html){
    var el = document.createElement( 'div' );
    el.innerHTML = html;
    console.log(el);
  }

  return {
    new:function(){
      var q = $q.defer();
      $http.get(hnURL)
        .then(function(result){
          console.log(result);
          posts = parseNewHTML(result.data);
          q.resolve(result);
        },function(err){
          console.log('Request Failed');
          q.reject(err);
        });
      return q.promise;
    }
  }

})
;

