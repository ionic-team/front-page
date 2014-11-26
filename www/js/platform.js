/**
 * Created by perry on 10/8/14.
 * This directory can be used to override any JS controller, service, config, or directive with a
 * platform specific version. For example, below, I "android-i-cize" the search bar directive that
 * was very "iOS-ey" before.
 */
angular.module('frontpage.directives', [])
  .directive('searchBar', function() {
    return {
      restrict: 'E',
      replace: true,
      require: '?ngModel',
      scope: {
        model: '=?',
        focused: '=?',
        submit: '&',
        clear: '&'
      },
      template:
      '<form class="bar bar-header bar-energized item-input-inset" ng-submit="submit()">' +
      '<div class="item-input-wrapper light-bg" ng-class="focused" ng-click="focus()">' +
      '<i class="icon ion-ios7-search-strong placeholder-icon"></i>' +
      '<input type="search"' +
      'id="searchInput"' +
      'placeholder="Search HN"' +
      'ng-model="model"' +
      'ng-focus="focused = \'text-left\'"' +
      'ng-blur="focused = model.length?\'left\':\'centered\'">' +
      '</div>' +
      '<i class="icon ion-ios7-close dark" ng-show="model.length" ng-click="clear()"></i>' +
      '</form>',
      link: function(scope, elem, attrs, $document){
        scope.focus = function(){
          document.getElementById('searchInput').focus()
        }
      }
    };
  })