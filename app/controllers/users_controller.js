var _ = require("lodash");
var fs = require('fs');
var path = require('path');

module.exports = function(app) {
  var User = app.Models.User,
      userParams = ['name', 'email', 'id', 'jobTitle', 'company', 'bio'];

  function setGravatar (user) {
    return user.set('gravatar', user.gravatar());
  }

  return {
    contributors: function(req, res, next) {
      User.query(function(db) {
        db.count('publications.id as publication_count')
        .from('users')
        .rightJoin('publications', 'users.id', 'publications.user_id')
        .groupBy('users.id')
        .orderBy('publication_count', 'desc')
        .limit(5)
      })
      .fetchAll()
      .then(function(contributors) {
        return _.map(contributors.models, function(contributor) {
          delete contributor.attributes.password;
          return setGravatar(contributor);
        });
      })
      .then(res.json.bind(res))
      .catch(next);
    },

    contributorsByCat: function(req, res, next) {
      User.query(function(db) {
        db.count('publications.id as publication_count')
        .rightJoin('publications', 'users.id', 'publications.user_id')
        .rightJoin('publication_categories', 'publications.category_id', 'publication_categories.id')
        .where('publication_categories.id', req.params.cat_id)
        .groupBy('users.id')
        .orderBy('publication_count', 'desc')
        .limit(5)
      })
      .fetchAll()
      .then(function(contributors) {
        return _.map(contributors.models, function(contributor) {
          delete contributor.attributes.password;
          return setGravatar(contributor);
        });
      })
      .then(res.json.bind(res))
      .catch(next);
    },

    subscribe: function(req, res, next) {
      req.user.addSubscription(req.params.index, req.params.data_set_id)
        .then(function() {
          res.json(req.user);
        }).catch(next);
    },

    unsubscribe: function(req, res, next) {
      req.user.removeSubscription(req.params.index, req.params.data_set_id)
        .then(function() {
          res.json(req.user);
        }).catch(next);
    },

    get: function (req, res, next) {
      User.forge({id: req.signedCookies.user})
        .fetch()
        .then(function(user) {
          setGravatar(user);
          res.json(_.pick(user.attributes, userParams.concat('gravatar')));
        })
    },

    update: function (req, res, next) {
      var attrs = _(req.body)
        .pick(userParams.concat('currentPassword', 'newPassword'))
        .omit('id')
        .value();

      req.user.update(attrs)
        .then(function (user) {
          res.json(_.pick(user.attributes, userParams));
        })
        .catch(function (err) {
          var statusCode = 500;
          if (err.errors && err.errors.email) {
            err.message = err.errors.email.message;
            statusCode = 422;
          } else if (err.message == 'Wrong Password') {
            statusCode = 422;
          }
          res.status(statusCode).send(err.message);
        });
    },

    uploadFile: function(req, res, next) {
      if (!req.files || !req.files.file) {
        // Unprocessable entity
        return res.status(422).end();
      }

      var file = req.files.file;
      var newFilePath = path.join(req.user.ensureScratchSpace(), file.originalFilename);

      var readSteam  = fs.createReadStream(file.path);
      var writeStream = fs.createWriteStream(newFilePath);

      readSteam
      .pipe(writeStream);

      readSteam.on('error', next);

      writeStream.on('error', function (err) {
        if (err.code === 'ENOSPC') {
          res.status(422).send("Disk quota exceeded");
        }
      });

      readSteam.on('end', function(){
        res.status(200).end();
      });
    },

    scratchSpaceFiles: function(req, res, next) {
      User.forge({id: req.signedCookies.user})
      .fetch()
      .then(function(user) {
        return user.getScratchSpaceContents();
      })
      .then(res.json.bind(res))
      .catch(next);
    }
  }
}
