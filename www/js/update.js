angular.module('ionic.services.update', ['ionic.services.common'])

/**
 * @ngdoc service
 * @name $ionicUpdate
 * @module ionic.services.update
 * @description
 *
 * A simple way to push updates to your app.
 *
 * Initialize the service with your app id before calling other functions.
 * Then, use the check, download, extract and load functions to update and/or load
 * the updated version of your app.
 *
 * @usage
 * ```javascript
 * $ionicUpdate.initialize('8cdd99a2');
 *
 * // Check for updates
 * $ionicUpdate.check().then(function(response) {
 *    // response will be true/false
 *    if (response) {
 *        // Download the updates
 *        $ionicUpdate.download().then(function() {
 *            // Extract the updates
 *            $ionicUpdate.extract().then(function() {
 *                // Load the updated version
 *                $ionicTrack.load();
 *            }, function(error) {
 *                // Error extracting
 *            }, function(progress) {
 *                // Do something with the zip extraction progress
 *                $scope.extraction_progress = progress;
 *            });
 *        }, function(error) {
 *            // Error downloading the updates
 *        }, function(progress) {
 *            // Do something with the download progress
 *            $scope.download_progress = progress;
 *        });
 *    }
 * } else {
 *    // No updates, load the most up to date version of the app
 *    $ionicUpdate.load();
 * }, function(error) {
 *    // Error checking for updates
 * })
 * ```
 */
  .factory('$ionicUpdate', [
    '$q',
    function($q) {
      return {
        check: function() {
          var deferred = $q.defer();

          IonicUpdate.check(function(result) {
            deferred.resolve(result === 'true');
          }, function(error) {
            deferred.reject(error);
          });

          return deferred.promise;
        },

        download: function() {
          var deferred = $q.defer();

          IonicUpdate.download(function(result) {
            if (result !== 'true' && result !== 'false') {
              deferred.notify(result);
            } else {
              deferred.resolve(result === 'true');
            }
          }, function(error) {
            deferred.reject(error);
          });

          return deferred.promise;
        },

        extract: function() {
          var deferred = $q.defer();

          IonicUpdate.extract(function(result) {
            if (result !== 'done') {
              deferred.notify(result);
            } else {
              deferred.resolve(result);
            }
          }, function(error) {
            deferred.reject(error);
          });

          return deferred.promise;
        },

        load: function() {
          IonicUpdate.redirect();
        },

        initialize: function(app_id) {
          IonicUpdate.initialize(app_id);
        }
      }
    }])