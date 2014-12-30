angular.module('frontpage.services', ['firebase'])

.factory('HNFirebase', function($q, $firebase) {
  var APIUrl = "https://hacker-news.firebaseio.com/v0",
      topStories  = [],
      newStories = [],
      comments = [],
      currentMaxID = null,
      newStoriesCount = null;

  var getItem = function(itemID) {
    var refItem = new Firebase(APIUrl).child("item").child(itemID);
    var item = $firebase(refItem).$asObject();
    return item;
  };

  var getNewStoriesUntil = function(count){
    if (currentMaxID === null) return;
    var item = getItem(currentMaxID);
    currentMaxID--;
    item.$loaded().then(function(data) {
      if(data.type === 'story' && !data.deleted) newStories.splice(data.id,0,data);
      if(newStories.length < count){
        // make one final recursive request
        getNewStoriesUntil(count);

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
    getTopStoriesPercentLoaded: function(){
      var numberOfTopStories = 100;
      var numberCompleted = 0;
      angular.forEach(topStories, function (story) {
        if(story.$loaded().$$state.status === 1) numberCompleted++
      });
      return numberCompleted / numberOfTopStories;
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
        currentMaxID  = data.$value;
        // http://stackoverflow.com/questions/985431/max-parallel-http-connections-in-a-browser
        var concurrentRequests = 6;
        // make several non-recursive requests
        for(var x = 0; x < concurrentRequests; x++) {
          // get 100 stories
          getNewStoriesUntil(newStoriesCount)
        }
      });
    },
    getNewStories: function() {
      return newStories;
    },
    getNewStoriesCount: function() {
      return newStoriesCount;
    },
    setNewStoriesCount: function(count) {
      newStoriesCount = count;
      return newStoriesCount;
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
;

