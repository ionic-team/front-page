angular.module('starter.controllers', [])

.controller('FrontPageCtrl', function($scope, HNAPI) {
  HNAPI.frontpage(0).then(function(posts){
    $scope.posts = posts;
  });
  $scope.open = function(url){
    window.open(url,'_system');
  }
})

.controller('NewestCtrl', function($scope, HNAPI) {
  HNAPI.newest(0).then(function(posts){
    $scope.posts = posts;
  });
  $scope.open = function(url){
    window.open(url,'_system');
  }
})

.controller('PostDetailCtrl', function($scope, $stateParams, Friends) {
  $scope.friend = Friends.get($stateParams.friendId);
})

.controller('SearchCtrl', function($scope, HNAPI, $ionicListDelegate) {
  $scope.searchTerm = '';
  $scope.posts = [];
  $scope.search = function(searchTerm){
    HNAPI.search(searchTerm).then(function(searchResults){
      $scope.posts = searchResults;
    });
  }
  $scope.open = function(url){
    window.open(url,'_system');
  }
})

.controller('AccountCtrl', function($scope) {
})
;
