var fs = require('fs-extra');
var async = require('async');
var _ = require('underscore');
var path = require('path');
var through2 = require('through2')
fs.walkOutUntil = function (dir, condition, callback) {
	if(!fs.statSync(dir).isDirectory()) {

		dir = path.dirname(dir);
	}
var foundDir = null;
	return async.during(
			function (cb) {

				return condition(dir, function(err, result){
					if(err) return callback(err);
					if(result) {
						foundDir =  dir
						return cb(null, false);
					}
					return cb(null, true);

				});
			},
			function (cb) {

				dir = path.resolve(dir, '..');
				return cb();
			},
			function (err) {

				if(err){
					return callback(err);
				}
				return callback(null, foundDir);
			}
	)

}

fs.walkSync = fs.walk;
fs.walk = function (dir, funIterator, callback) {

	var dirs = [];
	fs.walkSync(dir)
			.pipe(through2.obj(function (item, enc, next) {
				if (path.resolve(item.path, '..') == dir) {
					this.push(item);
				}
				return next();
			}))
			.on('data', function (dir) {
				dirs.push(dir);
			})
			.on('end', function () {

				return async.eachSeries(
						dirs,
						funIterator,
						callback
				);
			});

}
/**
 *
 * @param dir
 * @param funIterator
 * @param callback
 * @returns {*}
 */
fs.walkFiles = function (dir, funIterator, callback) {
	return fs.walkAsync(
			dir,
			function (stat, cb) {
				return fs.readFile(
						stat.path,//path.join(dir,stat.path),
						function (err, contents) {
							if (err) return callback(err);
							return funIterator(contents, cb);
						}
				)
			},
			callback
	);
}

module.exports = fs;