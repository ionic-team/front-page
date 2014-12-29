angular.module('frontpage.services', ['firebase'])

.factory('HNFirebase', function($q, $firebase) {
  var APIUrl = "https://hacker-news.firebaseio.com/v0";
  var topStories  = [];
  var newStories = [];
  var comments = [];

  var getItem = function(itemID) {
    var refItem = new Firebase(APIUrl).child("item").child(itemID);
    var item = $firebase(refItem).$asObject();
    //console.log(item)
    return item;
  };

  var getNewStoriesUntil = function(count, currentID, recursive){
    var concurrentRequests = 10;
    var item = getItem(currentID);
    item.$loaded().then(function(data) {
      if(item.type === 'story' && !item.deleted) newStories.splice(currentID,0,data);
      if(newStories.length < count && recursive){
        // how many requests should we make?
        var requestsToMake = newStories.length - count > concurrentRequests ? newStories.length - count : concurrentRequests;
        // make several non-recursive requests. note we count from 1
        for(var x = 1; x < requestsToMake; x++) {
          getNewStoriesUntil(count,currentID - x)
        }
        // make one final recursive request
        getNewStoriesUntil(count,currentID - x - 1, true);

      }
    });
  };

  return {
    fetchTopStories: function(){
      var ref = new Firebase(APIUrl).child("topstories");
      var refTS = $firebase(ref).$asArray();
      refTS.$loaded()
      .then(function(data) {
        angular.forEach(data, function (story) {
          topStories.splice(story.$id,0,getItem(story.$value));
        });
      });
    },
    getTopStories: function() {
      return topStories;
    },
    fetchComments: function(storyID) {
      comments = [];
      var refStory = new Firebase(APIUrl).child("item").child(storyID);
      var story = $firebase(refStory).$asObject();
      story.$loaded()
      .then(function(data) {
        angular.forEach(data.kids, function (comment) {
          comments.splice(comment.$id,0,getItem(comment));
        });
      });
    },
    getComments: function() {
      return comments;
    },
    fetchNewStories: function() {
      comments = [];
      var refStory = new Firebase(APIUrl).child("maxitem");
      var story = $firebase(refStory).$asObject();
      story.$loaded()
      .then(function(data) {
        console.log('maxItem is ', data, getItem(data.$value));
        getNewStoriesUntil(100, data.$value, true)
      });
    },
    getNewStories: function() {
      return newStories;
    }
  }
})

/**
 * A simple AJAX service for Algolia's search API
 */

.factory('Algolia', function($http, $q) {
  var apiURL = 'https://hn.algolia.com/api/v1/search?tags=story&query=',
      config = {timeout: 10000};

  function validateResponse(result){
    return !(typeof result.data != 'array' && typeof result.data != 'object');
  }

  return{
    // enter a request's reponse in to the cache
    search: function(query){
      var q = $q.defer();
      $http.get(apiURL+query, config)
      .then(function(result){
        return !validateResponse(result)? q.reject(new Error('Invalid Response')):q.resolve(result.data);
      },function(err){
        console.log('Query '+page+' Failed');
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
  var requestsToCache = ['frontpage/1','new/1'];
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
    // request a cache item's data based on the requested URL
    get:function(url){
      return typeof cache[url] === 'undefined' ? false:cache[url];
    }
  }
})
;

