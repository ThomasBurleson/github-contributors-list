"use strict";

var githubAPI   = require('./githubLoader');
var q           = require('q'),
    sprintf     = require('sprintf-js').sprintf,
    END_POINT   = '/repos/%s/%s/commits?since=%sT00:00:00';


/**
 * Service:  GitHub API Commits
 */
module.exports = function $committers(options) {

  var owner       = options.owner,
      repository  = options.repository,
      authToken   = options.authToken || process.env.GITHUB_API_TOKEN;

  // Publish $committers service API

  return {
    loadSince: function ( since ) {
      var path    = sprintf( END_POINT, owner, repository, since || "" );
      var headers = authToken ? { 'Authorization' : sprintf('token %s', authToken) } : null;

      if ( !!options.sha ) path += sprintf( '&sha=%s', options.sha );

      return q.Promise(function (resolve, reject) {
        if ( hasFromDate(since) ) {

          githubAPI(options)
            .loadFrom(path, headers)
            .then(function (result) {
              resolve( calculateSummaries(result) );

            }, reject);
        }

        /**
         * Trying to load ALL commits can easily be too large;
         * a 'since' date is required...
         */
        function hasFromDate( since ) {
            if ( !since ) resolve(null);    // No committers available
            return !!since;
          }
      });

      /**
       * Get summary listing of all committer login names
       * and their associated # of commits
       */
      function calculateSummaries(result) {
        return result.reduce( function (summary, it){
          var count = summary[it.author.login] || 0;
          summary[ it.author.login ] = count + 1;
          return summary;
        }, { })
      }
    }
  };

};
