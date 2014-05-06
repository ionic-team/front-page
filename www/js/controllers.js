angular.module('starter.controllers', [])

.controller('PostsCtrl', function($scope, HackerNewsScraper) {
  HackerNewsScraper.new().then(function(posts){
    $scope.posts = posts;
  });
  console.log($);
})
.filter('timeAgo', function (){
  var cache = [];
  return function(date) {
    if(typeof cache[date] === 'string')return cache[date];
    var origDate = date;
    var now = moment();
    if (now.diff(date, 'days') <= 5) {
        date = moment(date).fromNow();
    } else {
        date = moment(date).format("MMMM Do YYYY");
    }
    cache[origDate] = date;
    return date;
  }
})

.controller('NewCtrl', function($scope, Algolia) {
    $scope.posts = Algolia.all();
    $scope.$on('newPostsAvailable', function(event, posts){
      $scope.posts = posts;
    });
})

.controller('PostDetailCtrl', function($scope, $stateParams, Friends) {
  $scope.friend = Friends.get($stateParams.friendId);
})

.controller('SearchCtrl', function($scope, Algolia, $ionicListDelegate) {
  $scope.searchTerm = '';
  $scope.posts = [];
  $scope.search = function(searchTerm){
    Algolia.search(searchTerm)
           .then(function(searchResults){
             $scope.posts = searchResults;
           });
  }
  $scope.clearResults = function(){
    console.log('clearing results');
    console.log($scope);
    $scope.posts = [];
    $scope.searchTerm = '';
    console.log($scope.searchTerm);
  }
  $scope.openPost = function(url){
    window.open(url,'_system');
  }
})

.controller('AccountCtrl', function($scope) {
})
;
