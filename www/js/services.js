angular.module('frontpage.services', ['firebase'])

.factory('HNFirebase', function($q, $firebase, $rootScope) {
  var APIUrl = "https://hacker-news.firebaseio.com/v0",
      topStories  = [],
      newStories = {},
      comments = {},
      currentMaxID = null,
      newStoriesCount = 15,
      topStoryCache ={},
      checkedForNewStories = {},
      numberOfComments = null,
      lowestCommentLevel = 0;

  var getItem = function(itemID) {
    var refItem = new Firebase(APIUrl).child("item").child(itemID);
    var item = $firebase(refItem).$asObject();
    return item;
  };

  var getRef = function(itemID) {
    return new Firebase(APIUrl).child("item").child(itemID);
  };

  var getNewStoriesUntil = function(){
    if (currentMaxID === null) return;
    var alreadyAtMax = Object.keys(newStories).length >= newStoriesCount;
    // if the item is already found, skip it. used in infinite scroll
    if(!alreadyAtMax && checkedForNewStories[currentMaxID]){
      currentMaxID--;
      getNewStoriesUntil();
      return;
    }
    var item = getItem(currentMaxID);
    currentMaxID--;
    item.$loaded().then(function(data) {
      checkedForNewStories[data.id] = true;
      if(data.type === 'story' && !data.deleted && !data.dead && data.title){
        newStories[data.$id] = data;
        $rootScope.$broadcast('HNFirebase.newStoriesUpdated', newStories);
      }
      if(
      (!alreadyAtMax && Object.keys(newStories).length < newStoriesCount) ||
      (alreadyAtMax && typeof newStories[currentMaxID] == 'object')){
        // make one final recursive request
        getNewStoriesUntil();
      }
    });
  };

  var getComment = function(commentID, level){
    commentRef = getItem(commentID)
    commentRef.$loaded().then(function(comment){
      if(comment.deleted){
        numberOfComments--;
        return;
      }
      if(comment.kids){
        // get children
        numberOfComments = numberOfComments + comment.kids.length;
        angular.forEach(comment.kids, function (childID) {
          getComment(childID, level + 1 );
        });
      }
      if(level > lowestCommentLevel) lowestCommentLevel = level;
      comment.level = level;
      comments[comment.id] = comment;
      $rootScope.$broadcast('HNFirebase.commentsUpdated', comments);
    })
    .catch(function(error){
      console.error('Unable to get comment', error);
      numberOfComments--
    })
  };

  return {
    fetchTopStories: function(){
      topStories = [];
      var ref = new Firebase(APIUrl).child("topstories");
      ref.on('value', function(update){
        update.val().forEach(function (storyID, index) {
          // Since most updates are just position changes, we cache stories so
          // we don't have to re-grab them with every minor update
          if(typeof topStoryCache[storyID] == 'object'){
            topStories[index] = topStoryCache[storyID]
          }else{
            var storyRef = getRef(storyID);
            storyRef.on('value', function(storyVal){
              // note the value of kids will be wrong since it only has the top level children
              // getting subsequent children and having that live update creates a crazy amount of traffic
              // the HN API should update this
              topStories[index] = storyVal.val();
              topStoryCache[storyID] = storyVal.val();
            });
          }
          $rootScope.$broadcast('HNFirebase.topStoriesUpdated', topStories);
        });
      });
    },
    getTopStories: function() {
      return topStories;
    },
    getTopStoriesPercentLoaded: function(){
      var numberOfTopStories = 100;
      var numberCompleted = topStories.length;
      //angular.forEach(topStories, function (story) {
      //  console.log(story)
      //  if(story.$loaded().$$state.status === 1) numberCompleted++
      //});
      return numberCompleted / numberOfTopStories;
    },
    fetchComments: function(storyID) {
      comments = {};
      numberOfComments = null;
      lowestCommentLevel = 0;
      var refStory = new Firebase(APIUrl).child("item").child(storyID);
      var story = $firebase(refStory).$asObject();
      story.$loaded()
      .then(function(data) {
        numberOfComments = data.kids.length;
        angular.forEach(data.kids, function (commentID) {
          getComment(commentID, 0);
        });
      });
    },
    getComments: function() {
      commentArray = [];
      // convert the object of comment objects to an array of IDs so we're not juggling large objects
      var commentPool = Object.keys(comments).sort().reverse().map(function(strID){return parseInt(strID)});
      // get a list of the top level comments
      angular.forEach(commentPool, function(commentID) {
        if (comments[commentID].level == 0) {
          commentArray.push(commentID);
          commentPool.splice(commentPool.indexOf(commentID), 1);
        }
      });

      // reverse the order so subcomments show up newest first (last to be added)
      commentPool.reverse();
      // cycle through, looking for parent IDs in the array of comment IDs
      // if it's found, add it and remove it from the pool
      // continue this until the pool is empty or we've reached the max number of loops
      var lastPoolLength = commentPool.length;
      for(var i = 1; i < 20; i++){
        angular.forEach(commentPool, function(commentID){
          if(commentArray.indexOf(comments[commentID].parent) != -1){
            commentArray.splice(commentArray.indexOf(comments[commentID].parent)+1, 0, commentID);
            commentPool.splice(commentPool.indexOf(commentID), 1);
          }
        });
        // sometimes a comment can become an orphan if we are not applying new comments, then move on
        if(lastPoolLength === commentPool.length)break;
      }
      return commentArray.map(function(commentID){
        return comments[commentID]
      });
    },
    getCommentsPercentLoaded: function(){
      var numberCompleted = 0;
      angular.forEach(comments, function (story) {
        if(story.$loaded().$$state.status === 1) numberCompleted++
        //console.log(numberCompleted / numberOfComments)
      });
      return numberCompleted / numberOfComments;
    },
    fetchNewStories: function() {
      var ref = new Firebase(APIUrl).child("maxitem");
      ref.on('value', function(update){
        currentMaxID  = update.val();
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
      return Object.keys(newStories).map(function(k) { return newStories[k] }).reverse();
    },
    increaseNewStoriesCount: function(increase) {
      newStoriesCount = newStoriesCount + increase;
      currentMaxID = Object.keys(newStories)[Object.keys(newStories).length - 1];
      this.fetchNewStories();
      return newStoriesCount;
    },
    getNewStoriesPercentLoaded: function() {
      return Object.keys(newStories).length/newStoriesCount;
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

